import json
import os

def lambda_handler(event, context):
    """
    Handler for CORS preflight requests.
    This function properly responds to OPTIONS requests with appropriate CORS headers.
    """
    print(f"CORS handler invoked with event: {event}")
    
    # Log all environment variables for debugging
    print(f"Environment variables: {os.environ}")
    
    # Log incoming headers
    headers = event.get('headers', {})
    if headers:
        print(f"Incoming headers: {headers}")
    
    # Always return CORS headers regardless of the request
    response = {
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
    
    print(f"Returning response: {response}")
    return response
