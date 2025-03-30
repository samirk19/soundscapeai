import json
import boto3
import requests
import os
import traceback
import sys

# Add direct console logging for debugging
print("generate_audio module loading...")
print(f"Python version: {sys.version}")
print(f"Environment variables: {os.environ}")

# Define a function to optimize sound prompts
def optimize_sound_prompt(prompt, max_length=400):
    """
    Optimize the sound prompt to conserve ElevenLabs API tokens
    """
    if not prompt:
        return ""

    # If prompt is already within limit, return as is
    if len(prompt) <= max_length:
        return prompt

    # Split into sentences
    sentences = [s.strip() for s in prompt.replace('\n', '. ').split('.')]
    sentences = [s for s in sentences if s]

    # Start with the first sentence
    optimized = [sentences[0]]
    current_length = len(sentences[0])

    # Add sentences until we reach the limit
    for sentence in sentences[1:]:
        if current_length + len(sentence) + 2 <= max_length:  # +2 for the period and space
            optimized.append(sentence)
            current_length += len(sentence) + 2
        else:
            break

    # Join sentences back together
    result = '. '.join(optimized)
    if not result.endswith('.'):
        result += '.'

    print(f"Optimized sound prompt from {len(prompt)} to {len(result)} characters")
    return result

# Initialize AWS services
try:
    s3 = boto3.client('s3')
    dynamodb = boto3.resource('dynamodb')
    ssm = boto3.client('ssm')
    table_name = os.environ.get('TABLE_NAME')
    if table_name:
        table = dynamodb.Table(table_name)
    audio_bucket = os.environ.get('AUDIO_BUCKET')
    param_name = os.environ.get('ELEVEN_LABS_PARAM')
    print(f"AWS services initialized. Table: {table_name}, Bucket: {audio_bucket}, Param: {param_name}")
except Exception as e:
    print(f"Error initializing AWS services: {e}")
    print(traceback.format_exc())

# ElevenLabs API constants
ELEVEN_LABS_API_URL = "https://api.elevenlabs.io/v1/sound-generation"

def update_db_error(image_id, error_message):
    """Update DynamoDB with error information"""
    try:
        table.update_item(
            Key={'imageId': image_id},
            UpdateExpression="set #s=:s, errorMessage=:e",
            ExpressionAttributeNames={
                '#s': 'status'
            },
            ExpressionAttributeValues={
                ':s': 'ERROR',
                ':e': error_message
            }
        )
        print(f"Updated DynamoDB record {image_id} with error status")
    except Exception as db_err:
        print(f"Failed to update DynamoDB with error status for {image_id}: {db_err}")
        print(traceback.format_exc())

def lambda_handler(event, context):
    """
    Generates audio using ElevenLabs Sound Generation API based on
    the AI-generated sound prompt.
    """
    print(f"generate_audio lambda_handler invoked with event: {event}")

    try:
        # Validate input
        if not isinstance(event, dict) or 'imageId' not in event or 'soundPrompt' not in event:
            print(f"Invalid event structure: {type(event)}")
            raise Exception("Invalid input: Missing required fields")

        # Get image analysis from previous step
        image_id = event['imageId']
        description = event.get('description', '')
        scene = event.get('scene', 'unknown')
        detected_elements = event.get('detectedElements', [])
        sound_prompt = event['soundPrompt']

        print(f"Processing image ID: {image_id}, Scene: {scene}")
        print(f"Sound prompt ({len(sound_prompt)} chars): {sound_prompt[:100]}...")

        # Validate sound prompt
        if not sound_prompt or len(sound_prompt) < 10:
            print(f"Invalid sound prompt: {sound_prompt}")
            raise Exception("Sound prompt is too short or empty")

        # Get ElevenLabs API key from Parameter Store or environment variable
        print("Getting ElevenLabs API key")
        eleven_labs_api_key = None

        # First try to get from environment variable if available (for testing/backup)
        elevenlabs_api_key_env = os.environ.get('ELEVENLABS_API_KEY')
        if elevenlabs_api_key_env:
            print("Using ElevenLabs API key from environment variable")
            eleven_labs_api_key = elevenlabs_api_key_env

        # Otherwise try to get from Parameter Store
        if not eleven_labs_api_key:
            try:
                print(f"Retrieving API key from SSM Parameter Store: {param_name}")
                ssm_response = ssm.get_parameter(
                    Name=param_name,
                    WithDecryption=True
                )
                eleven_labs_api_key = ssm_response['Parameter']['Value']
                print("Successfully retrieved API key from Parameter Store")
            except Exception as ssm_err:
                print(f"Error accessing SSM parameter: {ssm_err}")
                print(traceback.format_exc())
                print("Using fallback sound generation strategy due to SSM access error")

                # Generate audio URL without calling API
                audio_key = f'audio/{image_id}_fallback.mp3'
                audio_url = f"https://{audio_bucket}.s3.amazonaws.com/{audio_key}"

                # Return result without audio (will be updated later)
                result = {
                    'imageId': image_id,
                    'description': description,
                    'scene': scene,
                    'audioUrl': audio_url,  # Fallback URL
                    'detectedElements': detected_elements,
                    'soundPrompt': sound_prompt,
                    'fallback': True
                }

                # Update DynamoDB without audio
                try:
                    table.update_item(
                        Key={'imageId': image_id},
                        UpdateExpression="set #s=:s, audioError=:e",
                        ExpressionAttributeNames={
                            '#s': 'status'
                        },
                        ExpressionAttributeValues={
                            ':s': 'COMPLETED',
                            ':e': f"Could not access audio API key: {str(ssm_err)}"
                        }
                    )
                    print("Updated DynamoDB with fallback status")
                except Exception as db_err:
                    print(f"Failed to update DynamoDB with fallback status: {db_err}")

                return result

        # Call ElevenLabs Sound Generation API
        print("Calling ElevenLabs Sound Generation API")
        headers = {
            "xi-api-key": eleven_labs_api_key,
            "Content-Type": "application/json"
        }

        # Optimize sound prompt to conserve tokens
        optimized_prompt = optimize_sound_prompt(sound_prompt)

        payload = {
            "text": optimized_prompt,
            "duration_seconds": 8.0,  # Reduced from 10 to 8 seconds to save tokens
            "prompt_influence": 0.7    # Increased from 0.5 to better follow the prompt with fewer tokens
        }

        try:
            # Log api request with masked API key
            masked_headers = headers.copy()
            masked_headers["xi-api-key"] = "****" + headers["xi-api-key"][-4:] if headers["xi-api-key"] else "****"
            print(f"Sending request to ElevenLabs: {ELEVEN_LABS_API_URL}")
            print(f"Headers (masked): {masked_headers}")
            print(f"Payload size: {len(json.dumps(payload))} bytes")

            response = requests.post(
                ELEVEN_LABS_API_URL,
                headers=headers,
                json=payload,
                timeout=30  # Add timeout for the request
            )

            # Check response status
            if response.status_code != 200:
                print(f"ElevenLabs API returned non-200 status code: {response.status_code}")
                print(f"Response text: {response.text[:200]}...")
                raise Exception(f"ElevenLabs API error ({response.status_code}): {response.text[:100]}...")

            print(f"Successfully received audio from ElevenLabs. Content-Type: {response.headers.get('Content-Type')}, Length: {response.headers.get('Content-Length')}")

            # Get audio data
            audio_data = response.content
            if not audio_data or len(audio_data) < 100:  # Basic validation check
                raise Exception("Received empty or too small audio data from ElevenLabs")

        except requests.RequestException as req_err:
            print(f"Network error when calling ElevenLabs API: {req_err}")
            print(traceback.format_exc())
            raise Exception(f"ElevenLabs API request failed: {str(req_err)}")
        except Exception as api_err:
            print(f"Error in ElevenLabs API call: {api_err}")
            print(traceback.format_exc())
            raise

        # Save audio file to S3
        print("Saving audio file to S3")
        audio_key = f'audio/{image_id}.mp3'
        try:
            s3_response = s3.put_object(
                Bucket=audio_bucket,
                Key=audio_key,
                Body=audio_data,
                ContentType='audio/mpeg'
            )
            print(f"Successfully saved audio to S3. ETag: {s3_response.get('ETag')}, Key: {audio_key}")
        except Exception as s3_err:
            print(f"Failed to save audio to S3: {s3_err}")
            print(traceback.format_exc())
            raise Exception(f"Could not save audio file: {str(s3_err)}")

        # Generate public URL for the audio file
        audio_url = f"https://{audio_bucket}.s3.amazonaws.com/{audio_key}"
        print(f"Generated audio URL: {audio_url}")

        # Update DynamoDB with audio info
        print("Updating DynamoDB with audio URL")
        try:
            table.update_item(
                Key={'imageId': image_id},
                UpdateExpression="set audioUrl=:a, #s=:s",
                ExpressionAttributeNames={
                    '#s': 'status'
                },
                ExpressionAttributeValues={
                    ':a': audio_url,
                    ':s': 'COMPLETED'
                }
            )
            print("Successfully updated DynamoDB with audio URL and COMPLETED status")
        except Exception as db_err:
            print(f"Failed to update DynamoDB with audio URL: {db_err}")
            print(traceback.format_exc())
            raise Exception(f"Failed to update audio URL: {str(db_err)}")

        # Return audio info for the next step
        result = {
            'imageId': image_id,
            'description': description,
            'scene': scene,
            'audioUrl': audio_url,
            'detectedElements': detected_elements,
            'soundPrompt': sound_prompt
        }

        print("Audio generation complete")
        return result
    except Exception as e:
        # Handle errors and update DynamoDB
        print(f"Error in generate_audio: {e}")
        print(traceback.format_exc())

        # Try to update DynamoDB with error status if image_id is available
        if 'image_id' in locals():
            update_db_error(image_id, str(e))
        # Also check camelCase version
        elif 'imageId' in locals():
            update_db_error(imageId, str(e))
        # Check if it's in the event dictionary
        elif isinstance(event, dict) and 'imageId' in event:
            update_db_error(event['imageId'], str(e))

        # Re-raise for Step Functions error handling
        raise
