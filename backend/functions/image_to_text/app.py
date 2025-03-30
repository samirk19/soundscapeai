import json
import boto3
import base64
import os
from utils import logger, error_handlers
from utils.logger import ValidationError, ExternalServiceError, DatabaseError

# Initialize logger
log = logger.get_logger()

# Initialize AWS services
s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
rekognition = boto3.client('rekognition')
bedrock = boto3.client('bedrock-runtime')
table = dynamodb.Table(os.environ['TABLE_NAME'])
images_bucket = os.environ['IMAGES_BUCKET']

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
    except Exception as db_err:
        log.error(
            "Failed to update DynamoDB with error status",
            error=db_err,
            image_id=image_id
        )
        raise DatabaseError(f"Could not update error status in database: {str(db_err)}")

@error_handlers.stepfunctions_error_handler(
    table_name=os.environ['TABLE_NAME'],
    id_key_name='imageId',
    id_path='imageId'
)
def lambda_handler(event, context):
    """
    Analyzes the image using AWS Rekognition and Bedrock (Claude) to generate a description
    and a sound prompt for audio generation.
    """
    # Validate input
    if not isinstance(event, dict) or 'imageId' not in event or 's3Key' not in event:
        log.error("Invalid event structure", event_keys=str(event.keys()) if isinstance(event, dict) else "not_dict")
        raise ValidationError("Invalid input: Missing required fields")
    
    # Get image information from input
    image_id = event['imageId']
    s3_key = event['s3Key']
    
    # Set context for all subsequent logs
    log.set_context(image_id=image_id, s3_key=s3_key)
    log.info("Processing image for text analysis")
    
    try:
        # Get the image from S3
        log.info("Retrieving image from S3")
        try:
            response = s3.get_object(
                Bucket=images_bucket,
                Key=s3_key
            )
            image_bytes = response['Body'].read()
            log.info("Successfully retrieved image from S3", size_bytes=len(image_bytes))
        except Exception as s3_err:
            log.error("Failed to retrieve image from S3", error=s3_err)
            raise ExternalServiceError(
                f"Could not retrieve image: {str(s3_err)}",
                service_name="S3",
                operation="get_object"
            )
        
        # Use Rekognition to detect objects
        log.info("Calling AWS Rekognition for object detection")
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
            log.info(
                "Successfully detected objects using Rekognition",
                element_count=len(detected_elements),
                elements=detected_elements
            )
        except Exception as rekognition_err:
            log.error("Failed to detect objects with Rekognition", error=rekognition_err)
            raise ExternalServiceError(
                f"Object detection failed: {str(rekognition_err)}",
                service_name="Rekognition",
                operation="detect_labels"
            )
        
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
        log.info("Calling AWS Bedrock (Claude) for image description and sound prompt")
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
            log.info("Successfully received image analysis from Claude")
        except Exception as bedrock_err:
            log.error("Failed to generate description with Bedrock", error=bedrock_err)
            raise ExternalServiceError(
                f"Image description failed: {str(bedrock_err)}",
                service_name="Bedrock",
                operation="invoke_model"
            )
        
        # Parse the response from Claude
        log.info("Parsing Claude response")
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
            log.warning(
                "Claude response parsing incomplete",
                has_description=bool(description),
                has_scene=bool(scene != "other"),
                element_count=len(ai_elements),
                has_sound_prompt=bool(sound_prompt)
            )
        
        # Merge AI-detected elements with Rekognition elements
        combined_elements = list(set(detected_elements + ai_elements))
        log.info(
            "Combined elements from Rekognition and Claude",
            total_elements=len(combined_elements)
        )
        
        # Update DynamoDB with analysis results
        log.info("Updating DynamoDB with analysis results")
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
            log.info("Successfully updated DynamoDB with analysis results")
        except Exception as db_err:
            log.error("Failed to update DynamoDB with analysis results", error=db_err)
            raise DatabaseError(f"Failed to update analysis results: {str(db_err)}")
        
        # Return the analysis results for the next step
        result = {
            'imageId': image_id,
            'description': description,
            'scene': scene,
            'detectedElements': combined_elements,
            'soundPrompt': sound_prompt
        }
        
        log.info(
            "Image analysis complete",
            scene_type=scene,
            element_count=len(combined_elements)
        )
        
        return result
    except Exception as e:
        # This will be caught by the decorator which will handle the DynamoDB update
        # and properly format the error for Step Functions
        log.error(
            "Unhandled exception in image analysis",
            error=e
        )
        raise
