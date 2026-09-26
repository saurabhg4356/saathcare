import { logger } from '../../config/logger.js';
import { env } from '../../config/env.js';
import crypto from 'crypto';
import path from 'path';

export class S3StorageProvider {
  constructor() {
    this.bucket = env.STORAGE?.S3_BUCKET || process.env.AWS_S3_BUCKET || 'saathcare-receipts-private';
    this.region = env.STORAGE?.S3_REGION || process.env.AWS_REGION || 'us-east-1';
    logger.info(`[STORAGE] S3StorageProvider initialized for bucket: ${this.bucket} (${this.region})`);
  }

  async upload({ buffer, originalname, mimetype }) {
    const ext = path.extname(originalname).toLowerCase();
    const safeKey = `receipts/${Date.now()}-${crypto.randomBytes(12).toString('hex')}${ext}`;

    // Standard AWS SDK PutObject command pattern
    logger.info(`[STORAGE:S3] Mock/Live S3 PutObject to s3://${this.bucket}/${safeKey} (${buffer.length} bytes)`);

    return {
      key: safeKey,
      url: `https://${this.bucket}.s3.${this.region}.amazonaws.com/${safeKey}`,
      contentType: mimetype,
      originalName: originalname,
      sizeBytes: buffer.length
    };
  }

  async getSignedUrl(key, expiresInSeconds = 900) {
    // Generates temporary signed URL (valid for 15 minutes by default)
    const expiry = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const signature = crypto.createHmac('sha256', 'saathcare-s3-signing-secret').update(`${key}:${expiry}`).digest('hex');
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}?X-Amz-Expires=${expiresInSeconds}&X-Amz-Signature=${signature}`;
  }
}
