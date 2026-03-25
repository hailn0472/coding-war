/**
 * S3 Service
 * Handles testcase file storage in S3-compatible object storage
 * Requirements: SDD 3.2.4 (Resource Downloader), SDD 4.2 (D4 - Object Storage)
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { logger } from '../utils/logger';

// S3 Configuration from environment variables
const S3_ENDPOINT = process.env.S3_ENDPOINT || 'http://localhost:9000';
const S3_REGION = process.env.S3_REGION || 'us-east-1';
const S3_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID || 'minioadmin';
const S3_SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY || 'minioadmin';
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || 'coding-war-testcases';
const S3_PRESIGNED_URL_EXPIRY = parseInt(process.env.S3_PRESIGNED_URL_EXPIRY || '300', 10);

// S3 Client singleton
const s3Client = new S3Client({
  endpoint: S3_ENDPOINT,
  region: S3_REGION,
  credentials: {
    accessKeyId: S3_ACCESS_KEY_ID,
    secretAccessKey: S3_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true, // Required for MinIO and other S3-compatible services
});

/**
 * Generate S3 key for a testcase file
 * Format: testcases/{problemId}/{orderIndex}.{in|out}
 */
export function getTestCaseS3Key(problemId: string, orderIndex: number, type: 'in' | 'out'): string {
  return `testcases/${problemId}/${orderIndex}.${type}`;
}

/**
 * Upload a testcase file to S3
 * @param key - S3 object key
 * @param content - File content as Buffer
 */
export async function uploadTestCaseFile(key: string, content: Buffer): Promise<void> {
  const command = new PutObjectCommand({
    Bucket: S3_BUCKET_NAME,
    Key: key,
    Body: content,
    ContentType: 'text/plain',
  });

  await s3Client.send(command);

  logger.debug('Uploaded testcase file to S3', { key, size: content.length });
}

/**
 * Download a testcase file from S3
 * @param key - S3 object key
 * @returns File content as Buffer
 */
export async function downloadTestCaseFile(key: string): Promise<Buffer> {
  const command = new GetObjectCommand({
    Bucket: S3_BUCKET_NAME,
    Key: key,
  });

  const response = await s3Client.send(command);

  if (!response.Body) {
    throw new Error(`Empty response body for S3 key: ${key}`);
  }

  // Convert readable stream to Buffer
  const chunks: Uint8Array[] = [];
  for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
    chunks.push(chunk);
  }

  logger.debug('Downloaded testcase file from S3', { key });
  return Buffer.concat(chunks);
}

/**
 * Generate a presigned GET URL for a testcase file
 * @param key - S3 object key
 * @param expiresIn - URL TTL in seconds (default from env)
 * @returns Presigned URL string
 */
export async function generatePresignedUrl(key: string, expiresIn: number = S3_PRESIGNED_URL_EXPIRY): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: S3_BUCKET_NAME,
    Key: key,
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn });

  logger.debug('Generated presigned URL', { key, expiresIn });
  return url;
}

/**
 * Delete all testcase files for a problem from S3
 * @param problemId - Problem ID to delete testcases for
 */
export async function deleteTestCaseFiles(problemId: string): Promise<void> {
  const prefix = `testcases/${problemId}/`;

  // List all objects with the prefix
  const listCommand = new ListObjectsV2Command({
    Bucket: S3_BUCKET_NAME,
    Prefix: prefix,
  });

  const listResponse = await s3Client.send(listCommand);

  if (!listResponse.Contents || listResponse.Contents.length === 0) {
    logger.debug('No testcase files to delete', { problemId });
    return;
  }

  // Delete all listed objects
  const deleteCommand = new DeleteObjectsCommand({
    Bucket: S3_BUCKET_NAME,
    Delete: {
      Objects: listResponse.Contents.map((obj) => ({ Key: obj.Key })),
    },
  });

  await s3Client.send(deleteCommand);

  logger.info('Deleted testcase files from S3', {
    problemId,
    count: listResponse.Contents.length,
  });
}
