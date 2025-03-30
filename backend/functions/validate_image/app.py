import json
import uuid
import os
import boto3
import sys
import traceback
import datetime

# Add direct console logging for debugging
print("validate_image module loading without utils dependency...")
print(f"Python version: {sys.version}")
print(f"Environment variables: {os.environ}")

# Initialize AWS services
try:
    s3 = boto3.client('s3')
    dynamodb = boto3.resource('dynamodb')
    table_name = os.environ.get('TABLE_NAME')
    if table_name:
        table = dynamodb.Table(table_name)
    images_bucket = os.environ.get('IMAGES_BUCKET')
    print(f"AWS services initialized. Table: {table_name}, Bucket: {images_bucket}")
except Exception as e:
    print(f"Error initializing AWS services: {e}")
    print(traceback.format_exc())

# Image validation constants
SUPPORTED_FORMATS = ['jpeg', 'jpg', 'png']

def format_error_response(status_code, message, event=None):
    """
    Format a standardized error response.
    This is a simplified version that doesn't depend on the utils module.
    """
    if event and isinstance(event, dict) and 'httpMethod' in event:
        # This is an API Gateway request
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
    else:
        # This is a Step Functions request
        # For Step Functions, we need to throw an exception instead of returning an error response
        raise Exception(message)

def lambda_handler(event, context):
    """
    Validates the image that was already uploaded to S3.
    This simplified version doesn't depend on utils module.
    """
    # Direct console logs for debugging
    print(f"validate_image lambda_handler invoked with event: {event}")
    print(f"Context: {context}")
    
    try:
        # Parse JSON string if needed
        if isinstance(event, str):
            try:
                print(f"Event is a string, parsing as JSON: {event[:100]}...")
                event = json.loads(event)
            except json.JSONDecodeError as e:
                print(f"Failed to parse event as JSON: {e}")
                return format_error_response(400, f"Invalid JSON: {str(e)}", event)
        
        # Check required fields in the event
        if not isinstance(event, dict):
            print(f"Event is not a dictionary: {type(event)}")
            return format_error_response(400, "Invalid input format", event)
            
        if 'imageId' not in event or 's3Key' not in event:
            print(f"Missing required fields. Event keys: {event.keys()}")
            return format_error_response(400, "Missing required fields: imageId and s3Key must be provided", event)
        
        # Get image details
        image_id = event['imageId']
        s3_key = event['s3Key']
        
        print(f"Processing image ID: {image_id}, S3 Key: {s3_key}")
        
        # Get file extension from S3 key
        try:
            image_format = s3_key.split('.')[-1].lower()
            print(f"Image format from S3 key: {image_format}")
            
            # Check if format is supported
            if image_format not in SUPPORTED_FORMATS:
                print(f"Unsupported image format: {image_format}")
                return format_error_response(400, f"Unsupported image format. Use {', '.join(SUPPORTED_FORMATS)}", event)
        except Exception as format_err:
            print(f"Error extracting image format: {format_err}")
            return format_error_response(400, f"Error determining image format: {str(format_err)}", event)
        
        # SKIPPING PILLOW VALIDATION
        # Instead of downloading and validating with Pillow, 
        # we'll just check that the object exists in S3
        try:
            print(f"Checking if image exists in S3: {images_bucket}/{s3_key}")
            # Use head_object instead of get_object to avoid downloading the whole file
            s3.head_object(
                Bucket=images_bucket,
                Key=s3_key
            )
            print("Image exists in S3")
            
            # Set dimensions to unknown since we're skipping Pillow
            dimensions = "unknown (Pillow validation skipped)"
            
            print("Basic image validation successful (Pillow validation skipped)")
        except Exception as s3_err:
            print(f"Failed to verify image in S3: {s3_err}")
            print(traceback.format_exc())
            return format_error_response(500, f"Could not access image from storage: {str(s3_err)}", event)
        
        # Create initial entry in DynamoDB if it doesn't exist already
        print("Creating/updating entry in DynamoDB")
        try:
            timestamp = int(datetime.datetime.now().timestamp())
            table.update_item(
                Key={'imageId': image_id},
                UpdateExpression="set #s=:s, s3Key=:k, createdAt=:t, #f=:f",
                ExpressionAttributeNames={
                    '#s': 'status',
                    '#f': 'format'
                },
                ExpressionAttributeValues={
                    ':s': 'PROCESSING',
                    ':k': s3_key,
                    ':t': timestamp,
                    ':f': image_format
                }
            )
            print(f"Successfully updated DynamoDB entry. Timestamp: {timestamp}")
        except Exception as db_err:
            print(f"Failed to update DynamoDB entry: {db_err}")
            print(traceback.format_exc())
            return format_error_response(500, f"Failed to store image metadata: {str(db_err)}", event)
        
        # Log success
        print("Image validation complete, proceeding to processing")
        
        # Return data for the next step in the Step Functions workflow
        return {
            'imageId': image_id,
            's3Key': s3_key
        }
    except Exception as e:
        print(f"Unhandled error in validate_image: {e}")
        print(traceback.format_exc())
        return format_error_response(500, f"Unexpected error: {str(e)}", event)
