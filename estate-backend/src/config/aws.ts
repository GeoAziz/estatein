import { S3Client } from "@aws-sdk/client-s3";
import { SQSClient } from "@aws-sdk/client-sqs";

const isLocal = process.env.NODE_ENV === "development";

const awsConfig = {
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "local",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "local",
  },
  ...(isLocal && {
    endpoint: process.env.AWS_ENDPOINT || "http://localhost:4566",
    forcePathStyle: true,
  }),
};

export const s3Client = new S3Client(awsConfig);
export const sqsClient = new SQSClient(awsConfig);

export const S3_BUCKET = process.env.S3_BUCKET || "estatein-images";
export const SQS_QUEUE_URL = process.env.SQS_QUEUE_URL || "";
