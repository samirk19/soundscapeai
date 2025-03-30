import json
import base64
import uuid
import os
import boto3
import io
from PIL import Image
import datetime

# Initialize AWS services
s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['TABLE_NAME'])
images_bucket = os.environ['IMAGES_BUCKET']


def lambda_handler(event, context):
    """
    Validates the incoming image request and stores the image in S3.
    """
    try:
        # Parse request body
        if isinstance(event, str):
            event = json.loads(event)

        if 'body' in event:
            body = json.loads(event['body'])
        else:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Invalid request format'})
            }

        if 'image' not in body:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'No image data provided'})
            }

        # Generate a unique ID for this request
        image_id = str(uuid.uuid4())

        # Decode base64 image
        try:
            image_data = base64.b64decode(body['image'])

            # Validate image format using PIL
            img = Image.open(io.BytesIO(image_data))
            img.verify()  # Verify it's a valid image

            # Get image format
            image_format = img.format.lower()

            # Check if format is supported
            if image_format not in ['jpeg', 'jpg', 'png']:
                return {
                    'statusCode': 400,
                    'body': json.dumps({'error': 'Unsupported image format. Use JPEG or PNG'})
                }
        except Exception as e:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': f'Invalid image data: {str(e)}'})
            }

        # Save image to S3
        s3_key = f'uploads/{image_id}.{image_format}'
        s3.put_object(
            Bucket=images_bucket,
            Key=s3_key,
            Body=image_data,
            ContentType=f'image/{image_format}'
        )

        # Create initial entry in DynamoDB
        table.put_item(
            Item={
                'imageId': image_id,
                'status': 'PROCESSING',
                's3Key': s3_key,
                'createdAt': int(datetime.datetime.now().timestamp())
            }
        )

        # Return success with image ID and S3 key for the next step
        return {
            'imageId': image_id,
            's3Key': s3_key
        }

    except Exception as e:
        print(f"Error in image validation: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': f'Internal server error: {str(e)}'})
        }
