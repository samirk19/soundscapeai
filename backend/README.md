# Soundscape AI Backend

This directory contains the serverless backend for the Soundscape AI application, built using AWS SAM and various AWS services.

## Architecture

The backend uses a serverless architecture with the following components:

- **API Gateway** - REST API endpoints
- **Lambda Functions** - Serverless compute
- **Step Functions** - Workflow orchestration
- **DynamoDB** - Metadata storage
- **S3** - File storage for images and audio
- **Amazon Rekognition** - Object detection in images
- **Amazon Bedrock (Claude)** - Image analysis and prompt generation
- **ElevenLabs API** - Audio generation

## Directory Structure

- **/functions** - Lambda function code
  - **/analyze_api** - API entry point
  - **/validate_image** - Image validation and storage
  - **/image_to_text** - Image analysis with AI
  - **/generate_audio** - Sound generation with ElevenLabs
  - **/final_response** - Response formatting
  - **/health_check** - System health verification
  
- **/layers** - Lambda layers
  - **/pillow** - Image processing library
  - **/utils** - Shared utilities for logging and error handling
  
- **/events** - Sample event payloads for testing
- **/step-functions** - Step Functions workflow definition
- **/scripts** - Utility scripts
- **template.yaml** - SAM template defining all resources

## Features

- **Serverless Architecture** - Scalable, pay-per-use model
- **Step Function Workflow** - Reliable processing pipeline
- **Comprehensive Error Logging** - Structured logging with detailed context
- **Error Handling & Recovery** - Graceful error handling
- **Monitoring Dashboard** - CloudWatch dashboard for system monitoring

## Lambda Layers

- **pillow** - Contains the Pillow library for image processing
- **utils** - Contains shared utilities:
  - Structured logging
  - Error handling decorators
  - Custom error classes
  - API response formatting

## Processing Pipeline

1. **API Gateway** receives the image upload
2. **analyze_api** function starts the Step Functions workflow
3. **validate_image** validates and stores the image in S3
4. **image_to_text** analyzes the image using Rekognition and Bedrock (Claude)
5. **generate_audio** creates audio using ElevenLabs API
6. **final_response** formats the API response with results

## CloudWatch Integration

- **Metrics** - Error counts, execution times
- **Dashboard** - System health visualization
- **Alarms** - Critical error alerting
- **Structured Logs** - JSON-formatted, contextual logs

## Deployment

### Prerequisites

- AWS Account
- AWS SAM CLI
- Python 3.9+
- ElevenLabs API key

### Build & Deploy

```bash
# Build the application
sam build

# Deploy to AWS (first time)
sam deploy --guided

# Subsequent deployments
sam deploy
```

### Configuration Parameters

- **ElevenLabsApiKey** - API key for ElevenLabs
- **AppNamePrefix** - Prefix for all resources (default: soundscape)
- **LogLevel** - Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)

## Local Testing

```bash
# Invoke a function locally
sam local invoke ValidateImageFunction -e events/validate-image-event.json

# Start local API Gateway
sam local start-api
```

## Monitoring

After deployment, you can access the CloudWatch Dashboard at:
https://{region}.console.aws.amazon.com/cloudwatch/home?region={region}#dashboards:name={AppNamePrefix}-dashboard

## Documentation

- [Logging Improvements](./LOGGING_IMPROVEMENTS.md)
- [Changes Summary](./CHANGES_SUMMARY.md)
