import json
import boto3
import os
import uuid
import traceback
import base64

# Initialize AWS clients
s3 = boto3.client('s3')
stepfunctions = boto3.client('stepfunctions')

def lambda_handler(event, context):
    """
    Handler for the analyze API endpoint. This function:
    1. Extracts the image from the request
    2. Uploads it to S3
    3. Starts the Step Functions workflow with the S3 reference
    """
    print(f"analyze_api lambda_handler invoked with event type: {type(event)}")

    try:
        # Get state machine ARN from environment
        state_machine_arn = os.environ.get('STATE_MACHINE_ARN')
        print(f"STATE_MACHINE_ARN from environment: {state_machine_arn}")

        if not state_machine_arn:
            print("Missing environment variable: STATE_MACHINE_ARN")
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Requested-With',
                    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS,PUT,DELETE'
                },
                'body': json.dumps({
                    'error': 'System configuration error: Missing state machine ARN'
                })
            }

        # Check for OPTIONS request (preflight)
        if isinstance(event, dict) and event.get('httpMethod') == 'OPTIONS':
            print("Handling OPTIONS preflight request")
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Requested-With',
                    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS,PUT,DELETE',
                    'Access-Control-Max-Age': '3600'
                },
                'body': json.dumps({
                    'message': 'CORS preflight request successful'
                })
            }

        # Print event for debugging
        event_keys = list(event.keys()) if isinstance(event, dict) else 'not a dict'
        print(f"Event keys: {event_keys}")

        # Parse request body
        if not event or not isinstance(event, dict):
            print(f"Invalid event format: {type(event).__name__}")
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'Invalid request format'
                })
            }

        # Extract the body
        body_str = event.get('body', '{}')
        if isinstance(body_str, str):
            body = json.loads(body_str)
        else:
            body = body_str

        # Check for image data
        if 'image' not in body:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'No image data provided'
                })
            }

        # Process the image
        try:
            # Generate a unique ID
            image_id = str(uuid.uuid4())

            # Decode base64 image
            image_data_str = body['image']
            if image_data_str.startswith('data:image/'):
                # Remove the data URL prefix
                image_data_str = image_data_str.split(',', 1)[1]

            image_data = base64.b64decode(image_data_str)

            # Get image extension/format (you might want to improve this)
            image_format = 'jpg'  # Default

            # Upload to S3
            s3_key = f'uploads/{image_id}.{image_format}'
            images_bucket = os.environ.get('IMAGES_BUCKET')

            print(f"Uploading image to S3: {images_bucket}/{s3_key}")
            s3.put_object(
                Bucket=images_bucket,
                Key=s3_key,
                Body=image_data,
                ContentType=f'image/{image_format}'
            )
            print("Image uploaded successfully")

            # Prepare a smaller payload for Step Functions
            workflow_input = {
                'imageId': image_id,
                's3Key': s3_key
                # Add any other metadata here, but NOT the image data
            }

            # Generate a unique execution name
            execution_name = f"soundscape-{uuid.uuid4()}"
            print(f"Generated execution name: {execution_name}")

            # Start Step Functions synchronous execution with the smaller payload
            print(f"Starting synchronous Step Functions execution with ARN: {state_machine_arn}")

            response = stepfunctions.start_sync_execution(
                stateMachineArn=state_machine_arn,
                name=execution_name,
                input=json.dumps(workflow_input)  # Much smaller payload
            )

            # Log successful execution and results
            print(f"Step Functions execution completed: {response['status']}")

            # Check for successful execution
            if response['status'] == 'SUCCEEDED':
                # Parse output from the Step Functions execution
                output_json = json.loads(response['output'])

                # If FinalResponse function returned a properly formatted API response, use it
                if isinstance(output_json, dict) and 'statusCode' in output_json and 'body' in output_json:
                    # Extract the body from the response
                    result_body = json.loads(output_json['body']) if isinstance(output_json['body'], str) else output_json['body']

                    # Return the final response with 200 status code
                    return {
                        'statusCode': 200,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*',
                            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Requested-With',
                            'Access-Control-Allow-Methods': 'GET,POST,OPTIONS,PUT,DELETE'
                        },
                        'body': json.dumps(result_body)
                    }
                else:
                    # Return the raw output as response
                    return {
                        'statusCode': 200,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*',
                            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Requested-With',
                            'Access-Control-Allow-Methods': 'GET,POST,OPTIONS,PUT,DELETE'
                        },
                        'body': response['output']
                    }
            else:
                # If execution failed, return error
                error_detail = "Unknown error"
                if 'error' in response:
                    error_detail = response['error']
                elif 'cause' in response:
                    error_detail = response['cause']

                return {
                    'statusCode': 500,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Requested-With',
                        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS,PUT,DELETE'
                    },
                    'body': json.dumps({
                        'error': f'Workflow execution failed: {error_detail}'
                    })
                }

        except Exception as img_err:
            print(f"Error processing image: {img_err}")
            print(traceback.format_exc())
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': f'Error processing image: {str(img_err)}'
                })
            }

    except Exception as e:
        # Print exception details
        print(f"Error in lambda_handler: {e}")
        print(traceback.format_exc())

        # Return error response
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Requested-With',
                'Access-Control-Allow-Methods': 'GET,POST,OPTIONS,PUT,DELETE'
            },
            'body': json.dumps({
                'error': f'Error starting workflow: {str(e)}'
            })
        }
