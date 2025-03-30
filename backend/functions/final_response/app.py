import json
from utils import logger, error_handlers
from utils.logger import ValidationError

# Initialize logger
log = logger.get_logger()

@error_handlers.api_error_handler
def lambda_handler(event, context):
    """
    Formats the final API response with all the processed data.
    """
    # Validate input
    if not isinstance(event, dict) or 'imageId' not in event:
        log.error("Invalid event structure", event_keys=str(event.keys()) if isinstance(event, dict) else "not_dict")
        raise ValidationError("Invalid input: Missing required fields")
    
    # Get data from previous step
    image_id = event['imageId']
    
    # Set context for all subsequent logs
    log.set_context(image_id=image_id)
    log.info("Preparing final response")
    
    # Validate required fields
    required_fields = ['description', 'scene', 'audioUrl', 'detectedElements']
    missing_fields = [field for field in required_fields if field not in event]
    
    if missing_fields:
        log.warning(
            "Missing fields in event data",
            missing_fields=missing_fields,
            available_fields=list(event.keys())
        )
    
    # Get fields with safe defaults
    description = event.get('description', "No description available")
    scene = event.get('scene', "unknown")
    audio_url = event.get('audioUrl', "")
    detected_elements = event.get('detectedElements', [])
    sound_prompt = event.get('soundPrompt', "")
    
    # Prepare final API response
    response = {
        'imageId': image_id,
        'description': description,
        'scene': scene,
        'audioUrl': audio_url,
        'detectedElements': detected_elements,
        'soundPrompt': sound_prompt
    }
    
    log.info(
        "Final response prepared",
        has_audio=bool(audio_url),
        element_count=len(detected_elements),
        scene_type=scene
    )
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps(response)
    }
