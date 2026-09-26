import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { logger } from '../../config/logger.js';
import { env } from '../../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.resolve(__dirname, '../../../uploads/receipts');

export class LocalStorageProvider {
  constructor() {
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
      logger.info(`[STORAGE] Created local receipts directory at: ${UPLOADS_DIR}`);
    }
  }

  async upload({ buffer, originalname, mimetype }) {
    const ext = path.extname(originalname).toLowerCase();
    const randomHex = crypto.randomBytes(12).toString('hex');
    const safeKey = `receipt-${Date.now()}-${randomHex}${ext}`;
    const filePath = path.join(UPLOADS_DIR, safeKey);

    await fs.promises.writeFile(filePath, buffer);

    logger.info(`[STORAGE] Local receipt saved: ${safeKey} (${buffer.length} bytes)`);

    return {
      key: safeKey,
      url: `/api/expenses/receipts/${safeKey}`,
      contentType: mimetype,
      originalName: originalname,
      sizeBytes: buffer.length
    };
  }

  async getSignedUrl(key) {
    // For local storage, returns the secure streaming endpoint URL
    return `/api/expenses/receipts/${key}`;
  }

  getFilePath(key) {
    const safeKey = path.basename(key); // Prevent directory traversal
    const fullPath = path.join(UPLOADS_DIR, safeKey);
    if (!fs.existsSync(fullPath)) {
      return null;
    }
    return fullPath;
  }
}
