import json
import boto3
import requests
import os
from utils import logger, error_handlers
from utils.logger import ValidationError, ExternalServiceError, DatabaseError, AudioGenerationError

# Initialize logger
log = logger.get_logger()

# Initialize AWS services
s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['TABLE_NAME'])
ssm = boto3.client('ssm')
audio_bucket = os.environ['AUDIO_BUCKET']
param_name = os.environ['ELEVEN_LABS_PARAM']

# ElevenLabs API constants
ELEVEN_LABS_API_URL = "https://api.elevenlabs.io/v1/sound-generation"

@error_handlers.stepfunctions_error_handler(
    table_name=os.environ['TABLE_NAME'],
    id_key_name='imageId',
    id_path='imageId'
)
def lambda_handler(event, context):
    """
    Generates audio using ElevenLabs Sound Generation API based on
    the AI-generated sound prompt.
    """
    # Validate input
    if not isinstance(event, dict) or 'imageId' not in event or 'soundPrompt' not in event:
        log.error("Invalid event structure", event_keys=str(event.keys()) if isinstance(event, dict) else "not_dict")
        raise ValidationError("Invalid input: Missing required fields")
    
    # Get image analysis from previous step
    image_id = event['imageId']
    description = event.get('description', '')
    scene = event.get('scene', 'unknown')
    detected_elements = event.get('detectedElements', [])
    sound_prompt = event['soundPrompt']
    
    # Set context for all subsequent logs
    log.set_context(image_id=image_id, scene=scene)
    log.info("Starting audio generation", prompt_length=len(sound_prompt))
    
    # Validate sound prompt
    if not sound_prompt or len(sound_prompt) < 10:
        log.error("Invalid sound prompt", prompt=sound_prompt)
        raise ValidationError("Sound prompt is too short or empty")
    
    # Get ElevenLabs API key from Parameter Store
    log.info("Retrieving ElevenLabs API key from Parameter Store")
    try:
        eleven_labs_api_key = ssm.get_parameter(
            Name=param_name,
            WithDecryption=True
        )['Parameter']['Value']
        log.info("Successfully retrieved API key")
    except Exception as ssm_err:
        log.error("Failed to retrieve API key from Parameter Store", error=ssm_err)
        raise ExternalServiceError(
            f"Could not retrieve API key: {str(ssm_err)}",
            service_name="SSM Parameter Store",
            operation="get_parameter"
        )
    
    # Call ElevenLabs Sound Generation API
    log.info("Calling ElevenLabs Sound Generation API")
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
        log.info(
            "Sending request to ElevenLabs",
            url=ELEVEN_LABS_API_URL,
            headers=masked_headers,
            payload_size=len(json.dumps(payload))
        )
        
        response = requests.post(
            ELEVEN_LABS_API_URL,
            headers=headers,
            json=payload,
            timeout=30  # Add timeout for the request
        )
        
        # Check response status
        if response.status_code != 200:
            log.error(
                "ElevenLabs API returned non-200 status code",
                status_code=response.status_code,
                response_text=response.text[:200]  # Log only first 200 chars to avoid excessive logging
            )
            raise AudioGenerationError(
                f"ElevenLabs API error ({response.status_code}): {response.text[:100]}..."
            )
        
        log.info(
            "Successfully received audio from ElevenLabs",
            content_type=response.headers.get('Content-Type'),
            content_length=response.headers.get('Content-Length')
        )
        
        # Get audio data
        audio_data = response.content
        if not audio_data or len(audio_data) < 100:  # Basic validation check
            raise AudioGenerationError("Received empty or too small audio data from ElevenLabs")
        
    except requests.RequestException as req_err:
        log.error("Network error when calling ElevenLabs API", error=req_err)
        raise ExternalServiceError(
            f"ElevenLabs API request failed: {str(req_err)}",
            service_name="ElevenLabs",
            operation="sound_generation"
        )
    except AudioGenerationError:
        # Re-raise already formatted errors
        raise
    except Exception as api_err:
        log.error("Unexpected error when calling ElevenLabs API", error=api_err)
        raise AudioGenerationError(f"Unexpected error in audio generation: {str(api_err)}")
    
    # Save audio file to S3
    log.info("Saving audio file to S3")
    audio_key = f'audio/{image_id}.mp3'
    try:
        s3_response = s3.put_object(
            Bucket=audio_bucket,
            Key=audio_key,
            Body=audio_data,
            ContentType='audio/mpeg'
        )
        log.info(
            "Successfully saved audio to S3",
            etag=s3_response.get('ETag'),
            audio_key=audio_key
        )
    except Exception as s3_err:
        log.error("Failed to save audio to S3", error=s3_err)
        raise ExternalServiceError(
            f"Could not save audio file: {str(s3_err)}",
            service_name="S3",
            operation="put_object"
        )
    
    # Generate public URL for the audio file
    audio_url = f"https://{audio_bucket}.s3.amazonaws.com/{audio_key}"
    log.info("Generated audio URL", audio_url=audio_url)
    
    # Update DynamoDB with audio info
    log.info("Updating DynamoDB with audio URL")
    try:
        table.update_item(
            Key={'imageId': image_id},
            UpdateExpression="set audioUrl=:a, status=:s",
            ExpressionAttributeValues={
                ':a': audio_url,
                ':s': 'COMPLETED'
            }
        )
        log.info("Successfully updated DynamoDB with audio URL and COMPLETED status")
    except Exception as db_err:
        log.error("Failed to update DynamoDB with audio URL", error=db_err)
        raise DatabaseError(f"Failed to update audio URL: {str(db_err)}")
    
    # Return audio info for the next step
    result = {
        'imageId': image_id,
        'description': description,
        'scene': scene,
        'audioUrl': audio_url,
        'detectedElements': detected_elements,
        'soundPrompt': sound_prompt
    }
    
    log.info("Audio generation complete")
    return result
