import json
import boto3
import base64
import os
import traceback
import sys

# Check boto3 version to determine Bedrock service name
import pkg_resources

# Get boto3 version
try:
    boto3_version = pkg_resources.get_distribution("boto3").version
    print(f"Boto3 version: {boto3_version}")
except Exception as version_err:
    print(f"Could not determine boto3 version: {version_err}")
    boto3_version = "0.0.0"  # Default to old version if we can't determine

# Determine if we have a version that supports bedrock-runtime
from packaging import version
boto3_has_bedrock = version.parse(boto3_version) >= version.parse("1.28.0")
print(f"Boto3 has bedrock support: {boto3_has_bedrock}")

# Initialize AWS services
try:
    s3 = boto3.client('s3')
    dynamodb = boto3.resource('dynamodb')
    rekognition = boto3.client('rekognition')

    # Try different bedrock client names based on boto3 version
    bedrock = None
    if boto3_has_bedrock:
        # For newer boto3 versions (1.28.0+)
        try:
            print("Attempting to initialize bedrock-runtime client (newer boto3 version)")
            bedrock = boto3.client('bedrock-runtime')
            print("Successfully initialized bedrock-runtime client")
        except Exception as bedrock_err:
            print(f"Error initializing bedrock-runtime: {bedrock_err}")

    if bedrock is None:
        # Try alternative service name or older boto3 versions
        try:
            print("Attempting to initialize bedrock client (alternative name)")
            bedrock = boto3.client('bedrock')
            print("Successfully initialized bedrock client")
        except Exception as alt_err:
            print(f"Error initializing bedrock client: {alt_err}")
            print("WARNING: Both bedrock client initialization attempts failed!")
            # Create a mock bedrock client that will provide a descriptive error
            class MockBedrockClient:
                def invoke_model(self, **kwargs):
                    raise Exception("Bedrock client initialization failed. You may need to update boto3 to v1.28.0+ or ensure the Lambda function has proper permissions.")
            bedrock = MockBedrockClient()

    # Get environment variables with validation
    table_name = os.environ.get('TABLE_NAME')
    images_bucket = os.environ.get('IMAGES_BUCKET')

    if not table_name:
        print("WARNING: TABLE_NAME environment variable is not set")
    else:
        table = dynamodb.Table(table_name)

    if not images_bucket:
        print("WARNING: IMAGES_BUCKET environment variable is not set")

    print(f"AWS services initialized. Table: {table_name}, Bucket: {images_bucket}")
except Exception as e:
    print(f"Error initializing AWS services: {e}")
    print(traceback.format_exc())

def update_db_error(image_id, error_message):
    """Update DynamoDB with error information"""
    try:
        # Check if table is defined
        if not 'table' in globals() or table is None:
            table_name = os.environ.get('TABLE_NAME')
            if not table_name:
                print(f"Cannot update error status: TABLE_NAME environment variable is not set")
                return

            # Initialize table on-the-fly if needed
            db_table = boto3.resource('dynamodb').Table(table_name)
        else:
            db_table = table

        # Update the record
        db_table.update_item(
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
    # Print environment variables at the start of the function for debugging
    print(f"Environment variables in lambda_handler: {dict(os.environ)}")
    # Get environment variables
    bucket_name = os.environ.get('IMAGES_BUCKET')
    print(f"IMAGES_BUCKET environment variable: {bucket_name}")

    """
    Analyzes the image using AWS Rekognition and Bedrock (Claude) to generate a description
    and a sound prompt for audio generation.
    """
    print(f"image_to_text lambda_handler invoked with event: {event}")
    print(f"Context: {context}")

    try:
        # Validate input
        if not isinstance(event, dict) or 'imageId' not in event or 's3Key' not in event:
            print(f"Invalid event structure: {type(event)}")
            raise Exception("Invalid input: Missing required fields")

        # Get image information from input
        image_id = event['imageId']
        s3_key = event['s3Key']

        print(f"Processing image ID: {image_id}, S3 Key: {s3_key}")

        # Get the image from S3
        print("Retrieving image from S3")
        try:
            # Check if we have a valid S3 bucket name
            bucket_name = os.environ.get('IMAGES_BUCKET')
            print(f"Retrieved IMAGES_BUCKET from environment: {bucket_name}")

            # Final validation - make sure we have a bucket name
            if not bucket_name:
                # Print all environment variables for debugging
                print(f"All environment variables: {dict(os.environ)}")
                error_msg = "IMAGES_BUCKET environment variable is not set or not accessible"
                print(f"ERROR: {error_msg}")
                raise ValueError(error_msg)

            print(f"Using bucket name: {bucket_name}")

            # Get the image from S3
            response = s3.get_object(
                Bucket=bucket_name,
                Key=s3_key
            )
            image_bytes = response['Body'].read()
            print(f"Successfully retrieved image from S3, size: {len(image_bytes)} bytes")
        except ValueError as val_err:
            # Configuration error - environment variable issues
            print(f"Configuration error: {val_err}")
            print(traceback.format_exc())
            # Format error message specifically for Step Functions error handling
            raise Exception(f"Configuration error in image_to_text function: {str(val_err)}")
        except Exception as s3_err:
            print(f"Failed to retrieve image from S3: {s3_err}")
            print(traceback.format_exc())
            # Format error message specifically for Step Functions error handling
            raise Exception(f"Could not retrieve image from S3: {str(s3_err)}")

        # Use Rekognition to detect objects
        print("Calling AWS Rekognition for object detection")
        try:
            rekognition_response = rekognition.detect_labels(
                Image={
                    'Bytes': image_bytes
                },
                MaxLabels=15,
                MinConfidence=70
            )

            # Extract detected elements
            detected_elements = [label['Name'] for label in rekognition_response['Labels']]
            print(f"Successfully detected {len(detected_elements)} objects using Rekognition")
        except Exception as rekognition_err:
            print(f"Failed to detect objects with Rekognition: {rekognition_err}")
            print(traceback.format_exc())
            raise Exception(f"Object detection failed: {str(rekognition_err)}")

        # Use AWS Bedrock (Claude) for detailed image description and sound prompt generation
        encoded_image = base64.b64encode(image_bytes).decode('utf-8')

        prompt = """
        Please analyze this image and provide two things:
        1. A detailed description of what you see, including scene type and key elements
        2. A sound generation prompt for Eleven Labs that would create the perfect audio atmosphere 
           for this image. The sound prompt should be detailed and evocative, describing the specific 
           sounds, their qualities, and how they interact.

        IMPORTANT: Avoid including music or musical elements in your sound prompt unless the image 
        explicitly contains musical instruments being played or shows a music performance setting. 
        Focus on natural ambient sounds, environmental effects, human/animal vocalizations, and other 
        non-musical audio elements. Music should only be included when absolutely necessary for the scene.

        Format your response as:
        DESCRIPTION: [your detailed image description]
        SCENE_TYPE: [one of: city, nature, beach, forest, indoor, mountain, desert, snow]
        ELEMENTS: [comma-separated list of key elements]
        SOUND_PROMPT: [your sound generation prompt]
        """

        # Using Claude Anthropic API through Bedrock
        print("Calling AWS Bedrock (Claude) for image description and sound prompt")
        try:
            # Check if bedrock client is available
            if bedrock is None:
                print("ERROR: Bedrock client is not available. Cannot analyze image.")
                raise Exception("Bedrock client is not available. Cannot analyze image.")

            # Prepare payload for Bedrock
            claude_payload = {
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 1000,
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": prompt
                            },
                            {
                                "type": "image",
                                "source": {
                                    "type": "base64",
                                    "media_type": "image/jpeg",
                                    "data": encoded_image
                                }
                            }
                        ]
                    }
                ]
            }

            # Call Bedrock API
            print(f"Calling Bedrock API with {len(encoded_image)} chars of base64 image data")
            bedrock_response = bedrock.invoke_model(
                modelId='anthropic.claude-3-sonnet-20240229-v1:0',
                body=json.dumps(claude_payload)
            )

            # Parse response
            response_body = json.loads(bedrock_response['body'].read())
            response_text = response_body['content'][0]['text']
            print("Successfully received image analysis from Claude")
        except Exception as bedrock_err:
            print(f"Failed to generate description with Bedrock: {bedrock_err}")
            print(traceback.format_exc())

            # Fallback: use Rekognition elements if Bedrock fails
            print("USING FALLBACK: Creating description using Rekognition results only")
            description = f"Image containing {', '.join(detected_elements[:5])}"
            scene = "unknown"
            ai_elements = []
            sound_prompt = f"Create a natural ambient soundscape with environmental sounds for a scene with {', '.join(detected_elements[:5])}. Focus on non-musical audio elements like ambient noises, natural sounds, and spatial effects."

            # Log the fallback situation
            print(f"Created fallback description and sound prompt from Rekognition results")
            print(f"Fallback description: {description}")
            print(f"Fallback sound prompt: {sound_prompt}")

        # Check if we have a response from Claude to parse (vs. using fallback values)
        if 'response_text' in locals():
            # Parse the response from Claude
            print("Parsing Claude response")
            parts = response_text.split('\n')

            description = ""
            scene = "other"
            ai_elements = []
            sound_prompt = ""

            for part in parts:
                if part.startswith("DESCRIPTION:"):
                    description = part.replace("DESCRIPTION:", "").strip()
                elif part.startswith("SCENE_TYPE:"):
                    scene = part.replace("SCENE_TYPE:", "").strip().lower()
                elif part.startswith("ELEMENTS:"):
                    elements_text = part.replace("ELEMENTS:", "").strip()
                    ai_elements = [elem.strip() for elem in elements_text.split(',')]
                elif part.startswith("SOUND_PROMPT:"):
                    sound_prompt = part.replace("SOUND_PROMPT:", "").strip()

            # Validate response parsing
            if not description or not sound_prompt:
                print(
                    f"Claude response parsing incomplete: description={bool(description)}, "
                    f"scene={bool(scene != 'other')}, elements={len(ai_elements)}, "
                    f"sound_prompt={bool(sound_prompt)}"
                )
        else:
            # We're using fallback values, already set in the except block
            print("Using fallback values, skipping Claude response parsing")

        # Merge AI-detected elements with Rekognition elements
        combined_elements = list(set(detected_elements + ai_elements))
        print(f"Combined {len(combined_elements)} elements from Rekognition and Claude")

        # Update DynamoDB with analysis results
        print("Updating DynamoDB with analysis results")
        try:
            table.update_item(
                Key={'imageId': image_id},
                UpdateExpression="set #s=:s, description=:d, scene=:sc, detectedElements=:e, soundPrompt=:p",
                ExpressionAttributeNames={
                    '#s': 'status'
                },
                ExpressionAttributeValues={
                    ':s': 'ANALYZED',
                    ':d': description,
                    ':sc': scene,
                    ':e': combined_elements,
                    ':p': sound_prompt
                }
            )
            print("Successfully updated DynamoDB with analysis results")
        except Exception as db_err:
            print(f"Failed to update DynamoDB with analysis results: {db_err}")
            print(traceback.format_exc())
            raise Exception(f"Failed to update analysis results: {str(db_err)}")

        # Return the analysis results for the next step
        result = {
            'imageId': image_id,
            'description': description,
            'scene': scene,
            'detectedElements': combined_elements,
            'soundPrompt': sound_prompt
        }

        print(f"Image analysis complete. Scene: {scene}, Elements: {len(combined_elements)}")

        return result
    except Exception as e:
        # Handle errors and update DynamoDB
        print(f"Error in image_to_text: {e}")
        print(traceback.format_exc())

        # Try to update DynamoDB with error status if image_id is available
        if 'image_id' in locals():
            update_db_error(image_id, str(e))
        # Also check the properly capitalized version
        elif 'imageId' in locals() or (isinstance(event, dict) and 'imageId' in event):
            # Get the ID from either locals or the event
            error_image_id = locals().get('imageId', event.get('imageId'))
            update_db_error(error_image_id, str(e))

        # Format error for Step Functions state machine
        if isinstance(e, ValueError) and "IMAGES_BUCKET" in str(e):
            # Make the error message more specific for environment variable issues
            raise Exception(f"Configuration error: Environment variable IMAGES_BUCKET not available - please check Lambda configuration")
        else:
            # Re-raise for Step Functions error handling
            raise
