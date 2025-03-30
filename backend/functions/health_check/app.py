import json

def lambda_handler(event, context):
    """
    Simple health check endpoint to verify if the API is running.
    """
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({
            'status': 'healthy'
        })
    }