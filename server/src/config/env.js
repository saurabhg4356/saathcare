import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from server directory or root directory fallback
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/saathcare',

  JWT: {
    ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'saathcare_default_dev_access_secret_min32chars_key',
    REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'saathcare_default_dev_refresh_secret_min32chars_key',
    ACCESS_EXPIRY: process.env.JWT_ACCESS_EXPIRY || '15m',
    REFRESH_EXPIRY_DAYS: parseInt(process.env.JWT_REFRESH_EXPIRY_DAYS || '7', 10)
  },

  COOKIE: {
    SECURE: process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production',
    SAME_SITE: process.env.COOKIE_SAME_SITE || (process.env.NODE_ENV === 'production' ? 'strict' : 'lax'),
    DOMAIN: process.env.COOKIE_DOMAIN || undefined
  },

  RATE_LIMIT: {
    WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 mins
    MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '200', 10)
  },

  CRON: {
    MISSED_TASK_SCHEDULE: process.env.MISSED_TASK_CRON_SCHEDULE || '*/5 * * * *',
    MISSED_TASK_ENABLED: process.env.MISSED_TASK_JOB_ENABLED !== 'false'
  }
};
