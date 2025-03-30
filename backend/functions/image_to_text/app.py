import json
import boto3
import base64
import os
import traceback
import sys

# Add direct console logging for debugging
print("image_to_text module loading without utils dependency...")
print(f"Python version: {sys.version}")
print(f"Environment variables: {os.environ}")

# Initialize AWS services
try:
    s3 = boto3.client('s3')
    dynamodb = boto3.resource('dynamodb')
    rekognition = boto3.client('rekognition')
    bedrock = boto3.client('bedrock-runtime')
    table_name = os.environ.get('TABLE_NAME')
    if table_name:
        table = dynamodb.Table(table_name)
    images_bucket = os.environ.get('IMAGES_BUCKET')
    print(f"AWS services initialized. Table: {table_name}, Bucket: {images_bucket}")
except Exception as e:
    print(f"Error initializing AWS services: {e}")
    print(traceback.format_exc())

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
            response = s3.get_object(
                Bucket=images_bucket,
                Key=s3_key
            )
            image_bytes = response['Body'].read()
            print(f"Successfully retrieved image from S3, size: {len(image_bytes)} bytes")
        except Exception as s3_err:
            print(f"Failed to retrieve image from S3: {s3_err}")
            print(traceback.format_exc())
            raise Exception(f"Could not retrieve image: {str(s3_err)}")
        
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

        Format your response as:
        DESCRIPTION: [your detailed image description]
        SCENE_TYPE: [one of: city, nature, beach, forest, indoor, mountain, desert, snow]
        ELEMENTS: [comma-separated list of key elements]
        SOUND_PROMPT: [your sound generation prompt]
        """
        
        # Using Claude Anthropic API through Bedrock
        print("Calling AWS Bedrock (Claude) for image description and sound prompt")
        try:
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
            
            bedrock_response = bedrock.invoke_model(
                modelId='anthropic.claude-3-sonnet-20240229-v1:0',
                body=json.dumps(claude_payload)
            )
            
            response_body = json.loads(bedrock_response['body'].read())
            response_text = response_body['content'][0]['text']
            print("Successfully received image analysis from Claude")
        except Exception as bedrock_err:
            print(f"Failed to generate description with Bedrock: {bedrock_err}")
            print(traceback.format_exc())
            raise Exception(f"Image description failed: {str(bedrock_err)}")
        
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
        
        # Merge AI-detected elements with Rekognition elements
        combined_elements = list(set(detected_elements + ai_elements))
        print(f"Combined {len(combined_elements)} elements from Rekognition and Claude")
        
        # Update DynamoDB with analysis results
        print("Updating DynamoDB with analysis results")
        try:
            table.update_item(
                Key={'imageId': image_id},
                UpdateExpression="set description=:d, scene=:s, detectedElements=:e, soundPrompt=:p, status=:st",
                ExpressionAttributeValues={
                    ':d': description,
                    ':s': scene,
                    ':e': combined_elements,
                    ':p': sound_prompt,
                    ':st': 'ANALYZED'
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
        
        # Re-raise for Step Functions error handling
        raise
