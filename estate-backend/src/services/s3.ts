import { PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { s3Client, S3_BUCKET } from "../config/aws.js";
import { InternalServerError } from "../utils/errors.js";
import logger from "../middleware/logging.js";

function sanitizePathSegment(segment: string): string {
  return segment.replace(/[^a-zA-Z0-9_.-]/g, "_");
}

export async function uploadImage(
  file: Express.Multer.File,
  folder: string = "properties",
  ownerId?: string
): Promise<{ url: string; key: string; size: number }> {
  const safeFolder = sanitizePathSegment(folder);
  const safeName = sanitizePathSegment(file.originalname);
  const key = ownerId
    ? `${safeFolder}/${sanitizePathSegment(ownerId)}/${Date.now()}-${safeName}`
    : `${safeFolder}/${Date.now()}-${safeName}`;

  try {
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await s3Client.send(command);

    const isLocal = process.env.NODE_ENV === "development";
    const url = isLocal
      ? `http://localhost:4566/${S3_BUCKET}/${key}`
      : `https://${S3_BUCKET}.s3.amazonaws.com/${key}`;

    return { url, key, size: file.size };
  } catch (err) {
    logger.error({ err, key }, "Failed to upload image to S3");
    throw new InternalServerError("Failed to upload image");
  }
}

export async function deleteImage(key: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    });
    await s3Client.send(command);
  } catch (err) {
    logger.error({ err, key }, "Failed to delete image from S3");
    throw new InternalServerError("Failed to delete image");
  }
}

export async function getImageUrl(key: string): Promise<string> {
  const isLocal = process.env.NODE_ENV === "development";
  return isLocal
    ? `http://localhost:4566/${S3_BUCKET}/${key}`
    : `https://${S3_BUCKET}.s3.amazonaws.com/${key}`;
}
