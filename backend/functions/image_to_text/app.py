import json
import boto3
import base64
import os

# Initialize AWS services
s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
rekognition = boto3.client('rekognition')
bedrock = boto3.client('bedrock-runtime')
table = dynamodb.Table(os.environ['TABLE_NAME'])
images_bucket = os.environ['IMAGES_BUCKET']

def lambda_handler(event, context):
    """
    Analyzes the image using AWS Rekognition and Bedrock (Claude) to generate a description
    and a sound prompt for audio generation.
    """
    try:
        # Get image information from input
        image_id = event['imageId']
        s3_key = event['s3Key']

        # Get the image from S3
        response = s3.get_object(
            Bucket=images_bucket,
            Key=s3_key
        )
        image_bytes = response['Body'].read()

        # Use Rekognition to detect objects
        rekognition_response = rekognition.detect_labels(
            Image={
                'Bytes': image_bytes
            },
            MaxLabels=15,
            MinConfidence=70
        )

        # Extract detected elements
        detected_elements = [label['Name'] for label in rekognition_response['Labels']]

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

        # Parse the response from Claude
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

        # Merge AI-detected elements with Rekognition elements
        combined_elements = list(set(detected_elements + ai_elements))

        # Update DynamoDB with analysis results
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

        # Return the analysis results for the next step
        return {
            'imageId': image_id,
            'description': description,
            'scene': scene,
            'detectedElements': combined_elements,
            'soundPrompt': sound_prompt
        }

    except Exception as e:
        print(f"Error in image analysis: {str(e)}")

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

        raise Exception(f"Error analyzing image: {str(e)}")