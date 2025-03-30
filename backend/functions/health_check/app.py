import json
import boto3
import os
import sys
import traceback

# Add direct console logging for debugging
print("health_check module loading without utils dependency...")
print(f"Python version: {sys.version}")
print(f"Environment variables: {os.environ}")

def lambda_handler(event, context):
    """
    Simple health check endpoint to verify if the API is running.
    Also verifies connectivity to required AWS services.
    This simplified version doesn't depend on utils module.
    """
    print("Health check invoked")
    
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
            print(f"S3 images bucket '{images_bucket}' is connected")
        
        # Check audio bucket
        if audio_bucket:
            s3.head_bucket(Bucket=audio_bucket)
            services_status['s3_audio'] = "connected"
            print(f"S3 audio bucket '{audio_bucket}' is connected")
    except Exception as e:
        print(f"S3 connection check failed: {e}")
        print(traceback.format_exc())
        services_status['s3'] = f"error: {str(e)}"
    
    # Check DynamoDB
    try:
        dynamodb = boto3.resource('dynamodb')
        table_name = os.environ.get('TABLE_NAME')
        
        if table_name:
            table = dynamodb.Table(table_name)
            table.scan(Limit=1)
            services_status['dynamodb'] = "connected"
            print(f"DynamoDB table '{table_name}' is connected")
    except Exception as e:
        print(f"DynamoDB connection check failed: {e}")
        print(traceback.format_exc())
        services_status['dynamodb'] = f"error: {str(e)}"
    
    # Check Step Functions if state machine ARN is available
    try:
        state_machine_arn = os.environ.get('STATE_MACHINE_ARN')
        if state_machine_arn:
            sfn = boto3.client('stepfunctions')
            sfn.describe_state_machine(stateMachineArn=state_machine_arn)
            services_status['stepfunctions'] = "connected"
            print(f"Step Functions '{state_machine_arn}' is connected")
    except Exception as e:
        # This is expected to fail if the ARN isn't available
        if state_machine_arn:
            print(f"Step Functions connection check failed: {e}")
            print(traceback.format_exc())
            services_status['stepfunctions'] = f"error: {str(e)}"
    
    # Log health check results
    all_healthy = all(not status.startswith("error") for status in services_status.values())
    print(f"Health check completed. Services checked: {len(services_status)}, All healthy: {all_healthy}")
    
    # Return health status
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Requested-With',
            'Access-Control-Allow-Methods': 'GET,POST,OPTIONS,PUT,DELETE'
        },
        'body': json.dumps({
            'status': 'healthy',
            'services': services_status,
            'region': os.environ.get('AWS_REGION', 'unknown'),
            'version': os.environ.get('AWS_LAMBDA_FUNCTION_VERSION', 'latest')
        })
    }
