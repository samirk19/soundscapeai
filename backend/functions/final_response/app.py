import json

def lambda_handler(event, context):
    """
    Formats the final API response with all the processed data.
    """
    try:
        # Get data from previous step
        image_id = event['imageId']
        description = event['description']
        scene = event['scene']
        audio_url = event['audioUrl']
        detected_elements = event['detectedElements']
        sound_prompt = event.get('soundPrompt', "")  # Get soundPrompt if available

        # Prepare final API response
        response = {
            'imageId': image_id,
            'description': description,
            'scene': scene,
            'audioUrl': audio_url,
            'detectedElements': detected_elements,
            'soundPrompt': sound_prompt  # Include the sound prompt in the response
        }

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(response)
        }

    except Exception as e:
        print(f"Error in final response processing: {str(e)}")

        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': f'Error processing final response: {str(e)}'
            })
        }