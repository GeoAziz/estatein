#!/bin/bash
# Initialize LocalStack services for EstateIn backend

set -e

ENDPOINT="--endpoint-url=http://localhost:4566"

echo "Creating S3 bucket: estatein-images..."
aws s3 mb s3://estatein-images $ENDPOINT

echo "Creating SQS queue: estatein-jobs..."
aws sqs create-queue --queue-name estatein-jobs $ENDPOINT

echo "LocalStack initialized successfully!"
echo "  S3:  http://localhost:4566/estatein-images"
echo "  SQS: http://localhost:4566/000000000000/estatein-jobs"
