import json
import boto3
import os
from utils import logger, error_handlers

# Initialize logger
log = logger.get_logger()

@error_handlers.api_error_handler
def lambda_handler(event, context):
    """
    Simple health check endpoint to verify if the API is running.
    Also verifies connectivity to required AWS services.
    """
    log.info("Health check invoked", event_type="API_CALL")
    
    # Check service connections
    services_status = {}
    
    # Check S3 buckets
    try:
        s3 = boto3.client('s3')
        images_bucket = os.environ.get('IMAGES_BUCKET')
        audio_bucket = os.environ.get('AUDIO_BUCKET')
        
        # Check images bucket
        if images_bucket:
            s3.head_bucket(Bucket=images_bucket)
            services_status['s3_images'] = "connected"
        
        # Check audio bucket
        if audio_bucket:
            s3.head_bucket(Bucket=audio_bucket)
            services_status['s3_audio'] = "connected"
    except Exception as e:
        log.warning("S3 connection check failed", error=e)
        services_status['s3'] = f"error: {str(e)}"
    
    # Check DynamoDB
    try:
        dynamodb = boto3.resource('dynamodb')
        table_name = os.environ.get('TABLE_NAME')
        
        if table_name:
            table = dynamodb.Table(table_name)
            table.scan(Limit=1)
            services_status['dynamodb'] = "connected"
    except Exception as e:
        log.warning("DynamoDB connection check failed", error=e)
        services_status['dynamodb'] = f"error: {str(e)}"
    
    # Check Step Functions if state machine ARN is available
    try:
        state_machine_arn = os.environ.get('STATE_MACHINE_ARN')
        if state_machine_arn:
            sfn = boto3.client('stepfunctions')
            sfn.describe_state_machine(stateMachineArn=state_machine_arn)
            services_status['stepfunctions'] = "connected"
    except Exception as e:
        # This is expected to fail if the ARN isn't available, so don't log as warning
        if state_machine_arn:
            log.warning("Step Functions connection check failed", error=e)
            services_status['stepfunctions'] = f"error: {str(e)}"
    
    # Log health check results
    log.info(
        "Health check completed",
        services_checked=len(services_status),
        all_healthy=all(not status.startswith("error") for status in services_status.values())
    )
    
    # Return health status
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({
            'status': 'healthy',
            'services': services_status,
            'region': os.environ.get('AWS_REGION', 'unknown'),
            'version': os.environ.get('AWS_LAMBDA_FUNCTION_VERSION', 'latest')
        })
    }
