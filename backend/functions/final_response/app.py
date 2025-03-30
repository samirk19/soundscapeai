import json
import sys
import traceback

# Add direct console logging for debugging
print("final_response module loading without utils dependency...")
print(f"Python version: {sys.version}")

def lambda_handler(event, context):
    """
    Formats the final API response with all the processed data.
    This simplified version doesn't depend on utils module.
    """
    # Direct console logs for debugging
    print(f"final_response lambda_handler invoked with event: {event}")
    print(f"Context: {context}")
    
    try:
        # Validate input
        if not isinstance(event, dict) or 'imageId' not in event:
            print(f"Invalid event structure: {type(event)}")
            return format_error_response(400, "Invalid input: Missing required fields")
        
        # Get data from previous step
        image_id = event['imageId']
        print(f"Processing image ID: {image_id}")
        
        # Validate required fields
        required_fields = ['description', 'scene', 'audioUrl', 'detectedElements']
        missing_fields = [field for field in required_fields if field not in event]
        
        if missing_fields:
            print(f"Missing fields in event data: {missing_fields}")
            print(f"Available fields: {list(event.keys())}")
        
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
        
        print(f"Final response prepared. Has audio: {bool(audio_url)}, Elements: {len(detected_elements)}, Scene: {scene}")
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Requested-With',
                'Access-Control-Allow-Methods': 'GET,POST,OPTIONS,PUT,DELETE'
            },
            'body': json.dumps(response)
        }
    except Exception as e:
        print(f"Error in final_response: {e}")
        print(traceback.format_exc())
        return format_error_response(500, f"Error preparing final response: {str(e)}")

def format_error_response(status_code, message):
    """Format a standardized error response"""
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Requested-With',
            'Access-Control-Allow-Methods': 'GET,POST,OPTIONS,PUT,DELETE'
        },
        'body': json.dumps({
            'error': message
        })
    }
