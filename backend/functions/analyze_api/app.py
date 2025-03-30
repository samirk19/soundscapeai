import json
import boto3
import os
import uuid

# Initialize AWS Step Functions client
stepfunctions = boto3.client('stepfunctions')

def lambda_handler(event, context):
    """
    Handler for the analyze API endpoint. This function starts the Step Functions workflow
    with the provided image data.
    """
    try:
        # Get state machine ARN from environment (set by SAM)
        state_machine_arn = os.environ.get('STATE_MACHINE_ARN')
        if not state_machine_arn:
            raise ValueError("STATE_MACHINE_ARN environment variable is not set")

        # Generate a unique execution name
        execution_name = f"soundscape-{uuid.uuid4()}"

        # Start Step Functions execution
        response = stepfunctions.start_execution(
            stateMachineArn=state_machine_arn,
            name=execution_name,
            input=json.dumps(event)
        )

        # Return immediate response with execution details
        return {
            'statusCode': 202,  # Accepted
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'message': 'Image processing started',
                'executionArn': response['executionArn']
            })
        }

    except Exception as e:
        print(f"Error starting workflow: {str(e)}")

        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': f'Error starting image processing: {str(e)}'
            })
        }