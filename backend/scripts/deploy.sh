import json
import boto3
import requests
import os

# Initialize AWS services
s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['TABLE_NAME'])
ssm = boto3.client('ssm')
audio_bucket = os.environ['AUDIO_BUCKET']
param_name = os.environ['ELEVEN_LABS_PARAM']

# ElevenLabs API constants
ELEVEN_LABS_API_URL = "https://api.elevenlabs.io/v1/sound-generation"

def lambda_handler(event, context):
    """
    Generates audio using ElevenLabs Sound Generation API based on
    the image analysis results.
    """
    try:
        # Get image analysis from previous step
        image_id = event['imageId']
        description = event['description']
        scene = event['scene']
        detected_elements = event['detectedElements']

        # Get ElevenLabs API key from Parameter Store
        eleven_labs_api_key = ssm.get_parameter(
            Name=param_name,
            WithDecryption=True
        )['Parameter']['Value']

        # Prepare prompt for Eleven Labs
        sound_prompt = create_sound_prompt(description, scene, detected_elements)

        # Call ElevenLabs Sound Generation API
        headers = {
            "xi-api-key": eleven_labs_api_key,
            "Content-Type": "application/json"
        }

        payload = {
            "text": sound_prompt,
            "duration_seconds": 10.0,
            "prompt_influence": 0.5  # Slightly higher than default for better prompt adherence
        }

        response = requests.post(
            ELEVEN_LABS_API_URL,
            headers=headers,
            json=payload
        )

        if response.status_code != 200:
            raise Exception(f"ElevenLabs API error: {response.text}")

        # Get audio data
        audio_data = response.content

        # Save audio file to S3
        audio_key = f'audio/{image_id}.mp3'
        s3.put_object(
            Bucket=audio_bucket,
            Key=audio_key,
            Body=audio_data,
            ContentType='audio/mpeg'
        )

        # Generate public URL for the audio file
        audio_url = f"https://{audio_bucket}.s3.amazonaws.com/{audio_key}"

        # Update DynamoDB with audio info
        table.update_item(
            Key={'imageId': image_id},
            UpdateExpression="set audioUrl=:a, status=:s",
            ExpressionAttributeValues={
                ':a': audio_url,
                ':s': 'COMPLETED'
            }
        )

        # Return audio info for the next step
        return {
            'imageId': image_id,
            'description': description,
            'scene': scene,
            'audioUrl': audio_url,
            'detectedElements': detected_elements
        }

    except Exception as e:
        print(f"Error in audio generation: {str(e)}")

        # Update DynamoDB with error status if possible
        if 'image_id' in locals():
            table.update_item(
                Key={'imageId': image_id},
                UpdateExpression="set status=:s, errorMessage=:e",
                ExpressionAttributeValues={
                    ':s': 'ERROR',
                    ':e': str(e)
                }
            )

        raise Exception(f"Error generating audio: {str(e)}")

def create_sound_prompt(description, scene, elements):
    """Create an optimized prompt for ElevenLabs sound generation"""

    # Map scenes to appropriate soundscapes
    scene_sounds = {
        "city": "Urban soundscape with traffic, car horns, people talking, footsteps on pavement",
        "nature": "Nature soundscape with birds chirping, wind in trees, rustling leaves",
        "beach": "Beach soundscape with ocean waves crashing, seagulls, wind, distant children playing",
        "forest": "Forest soundscape with birds, insects buzzing, leaves rustling, distant animal calls",
        "indoor": "Indoor ambience with quiet room tone, subtle electrical hum, occasional footsteps",
        "mountain": "Mountain soundscape with high winds, distant eagle calls, rocks occasionally shifting",
        "desert": "Desert soundscape with wind over sand, distant animal calls, heat shimmer",
        "snow": "Winter soundscape with occasional wind, snow crunching underfoot, distant winter birds"
    }

    # Get base sounds for the scene
    base_sounds = scene_sounds.get(scene, "Ambient environmental soundscape")

    # Create final prompt
    prompt = f"{base_sounds}. The scene is: {description}"

    # Add specific element sounds if available
    element_text = ""
    for element in elements[:5]:  # Limit to top 5 elements to keep prompt focused
        element_text += f"{element}, "

    if element_text:
        prompt += f" Including sounds of: {element_text.rstrip(', ')}"

    return prompt