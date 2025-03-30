import json
import boto3
import requests
import os
import traceback
import sys

# Add direct console logging for debugging
print("generate_audio module loading without utils dependency...")
print(f"Python version: {sys.version}")
print(f"Environment variables: {os.environ}")

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
            UpdateExpression="set #status=:s, errorMessage=:e",
            ExpressionAttributeNames={
                '#status': 'status'
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
    print(f"Context: {context}")
    
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
        
        # Get ElevenLabs API key from Parameter Store
        print("Retrieving ElevenLabs API key from Parameter Store")
        try:
            eleven_labs_api_key = ssm.get_parameter(
                Name=param_name,
                WithDecryption=True
            )['Parameter']['Value']
            print("Successfully retrieved API key")
        except Exception as ssm_err:
            print(f"Failed to retrieve API key from Parameter Store: {ssm_err}")
            print(traceback.format_exc())
            raise Exception(f"Could not retrieve API key: {str(ssm_err)}")
        
        # Call ElevenLabs Sound Generation API
        print("Calling ElevenLabs Sound Generation API")
        headers = {
            "xi-api-key": eleven_labs_api_key,
            "Content-Type": "application/json"
        }
        
        payload = {
            "text": sound_prompt,
            "duration_seconds": 10.0,  # Adjust as needed
            "prompt_influence": 0.5    # Slightly higher than default for better prompt adherence
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
                UpdateExpression="set audioUrl=:a, status=:s",
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
        
        # Re-raise for Step Functions error handling
        raise
