import json
import uuid
import os
import boto3
import io
import sys
import traceback
from PIL import Image
import datetime
from utils import logger, error_handlers
from utils.logger import ValidationError, ExternalServiceError, DatabaseError

# Add direct console logging for debugging
print("validate_image module loading...")
print(f"Python version: {sys.version}")
print(f"Environment variables: {os.environ}")

# Initialize logger
log = logger.get_logger()
print(f"Logger initialized: {log}")

# Initialize AWS services
try:
    s3 = boto3.client('s3')
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table(os.environ['TABLE_NAME'])
    images_bucket = os.environ['IMAGES_BUCKET']
    print("AWS services initialized successfully")
except Exception as e:
    print(f"Error initializing AWS services: {e}")
    print(traceback.format_exc())

# Image validation constants
SUPPORTED_FORMATS = ['jpeg', 'jpg', 'png']

@error_handlers.api_error_handler
def lambda_handler(event, context):
    """
    Validates the image that was already uploaded to S3.
    This updated version expects the S3 key and image ID instead of the raw image.
    """
    # Direct console logs for debugging
    print(f"validate_image lambda_handler invoked with event: {event}")
    
    log.info("Image validation started", event_type="STEP_FUNCTION")
    
    # Parse JSON string if needed
    if isinstance(event, str):
        try:
            print(f"Event is a string, parsing as JSON: {event[:100]}...")
            event = json.loads(event)
        except json.JSONDecodeError as e:
            print(f"Failed to parse event as JSON: {e}")
            log.error("Invalid JSON string in event", error=e)
            raise ValidationError("Invalid request format: Malformed JSON")
    
    # Check required fields in the event
    if not isinstance(event, dict):
        print(f"Event is not a dictionary: {type(event)}")
        log.error("Invalid event format", event_type=type(event).__name__)
        raise ValidationError("Invalid input format")
        
    if 'imageId' not in event or 's3Key' not in event:
        print(f"Missing required fields. Event keys: {event.keys()}")
        log.error("Missing required fields", event_keys=list(event.keys()))
        raise ValidationError("Missing required fields: imageId and s3Key must be provided")
    
    # Get image details
    image_id = event['imageId']
    s3_key = event['s3Key']
    
    print(f"Processing image ID: {image_id}, S3 Key: {s3_key}")
    log.set_context(image_id=image_id, s3_key=s3_key)
    
    # Get file extension from S3 key
    try:
        image_format = s3_key.split('.')[-1].lower()
        print(f"Image format from S3 key: {image_format}")
        
        # Check if format is supported
        if image_format not in SUPPORTED_FORMATS:
            print(f"Unsupported image format: {image_format}")
            log.warning(
                "Unsupported image format",
                format=image_format,
                supported_formats=SUPPORTED_FORMATS
            )
            raise ValidationError(f"Unsupported image format. Use {', '.join(SUPPORTED_FORMATS)}")
    except Exception as format_err:
        print(f"Error extracting image format: {format_err}")
        log.error("Error extracting image format", error=format_err)
        raise ValidationError(f"Error determining image format: {str(format_err)}")
    
    # Download the image from S3 for validation
    try:
        print(f"Downloading image from S3: {images_bucket}/{s3_key}")
        s3_response = s3.get_object(
            Bucket=images_bucket,
            Key=s3_key
        )
        image_data = s3_response['Body'].read()
        print(f"Downloaded image, size: {len(image_data)} bytes")
        
        # Validate image using PIL
        print("Validating image")
        try:
            img = Image.open(io.BytesIO(image_data))
            img.verify()  # Verify it's a valid image
            print("Image verified")
            
            # Reopen image to get dimensions
            img = Image.open(io.BytesIO(image_data))
            dimensions = f"{img.width}x{img.height}" if hasattr(img, 'width') and hasattr(img, 'height') else "unknown"
            print(f"Image dimensions: {dimensions}")
            
            log.info(
                "Image validated successfully",
                format=image_format,
                dimensions=dimensions
            )
        except IOError as io_err:
            print(f"Invalid image data - PIL verification failed: {io_err}")
            log.error("Invalid image data - PIL verification failed", error=io_err)
            raise ValidationError(f"Invalid image data: {str(io_err)}")
    except Exception as s3_err:
        print(f"Failed to download image from S3: {s3_err}")
        print(traceback.format_exc())
        log.error("Failed to download image from S3", error=s3_err)
        raise ExternalServiceError(
            f"Could not access image from storage: {str(s3_err)}",
            service_name="S3",
            operation="get_object"
        )
    
    # Create initial entry in DynamoDB if it doesn't exist already
    print("Creating/updating entry in DynamoDB")
    log.info("Creating/updating entry in DynamoDB")
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
        log.info("Successfully updated DynamoDB entry", timestamp=timestamp)
    except Exception as db_err:
        print(f"Failed to update DynamoDB entry: {db_err}")
        print(traceback.format_exc())
        log.error("Failed to update DynamoDB entry", error=db_err)
        raise DatabaseError(f"Failed to store image metadata: {str(db_err)}")
    
    # Log success
    print("Image validation complete, proceeding to processing")
    log.info(
        "Image validation complete, proceeding to processing",
        s3_key=s3_key,
        format=image_format
    )
    
    # Return data for the next step in the Step Functions workflow
    return {
        'imageId': image_id,
        's3Key': s3_key
    }
