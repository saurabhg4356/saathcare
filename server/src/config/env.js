import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from server directory or root directory fallback
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(5000),
  CLIENT_URL: z.string().trim().default('http://localhost:3000').transform(val => {
    if (!val) return 'http://localhost:3000';
    let url = val.trim();
    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`;
    }
    return url.replace(/\/+$/, '');
  }),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required').default('mongodb://127.0.0.1:27017/saathcare'),

  // JWT configuration
  JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET must be at least 16 characters').default('saathcare_default_dev_access_secret_min32chars_key'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET must be at least 16 characters').default('saathcare_default_dev_refresh_secret_min32chars_key'),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY_DAYS: z.coerce.number().default(7),

  // Cookie configuration
  COOKIE_SECURE: z.coerce.boolean().optional(),
  COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']).optional(),
  COOKIE_DOMAIN: z.string().optional(),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(200),

  // Scheduled Jobs
  MISSED_TASK_CRON_SCHEDULE: z.string().default('*/5 * * * *'),
  MISSED_TASK_JOB_ENABLED: z.coerce.boolean().default(true),

  // Email Infrastructure
  EMAIL_PROVIDER: z.enum(['mock', 'smtp', 'gmail']).default('mock'),
  GMAIL_USER: z.string().optional(),
  GMAIL_CLIENT_ID: z.string().optional(),
  GMAIL_CLIENT_SECRET: z.string().optional(),
  GMAIL_REFRESH_TOKEN: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().default('SaathCare <noreply@saathcare.org>'),

  // Storage Infrastructure
  STORAGE_PROVIDER: z.enum(['local', 's3']).default('local'),
  AWS_S3_BUCKET: z.string().optional(),
  AWS_REGION: z.string().default('us-east-1')
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('FATAL: Environment validation failed at application startup:');
  parsedEnv.error.issues.forEach(issue => {
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  });
  // Fail fast in production
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}

const validated = parsedEnv.success ? parsedEnv.data : envSchema.parse({});

export const env = {
  NODE_ENV: validated.NODE_ENV,
  PORT: validated.PORT,
  CLIENT_URL: validated.CLIENT_URL,
  MONGODB_URI: validated.MONGODB_URI,

  JWT: {
    ACCESS_SECRET: validated.JWT_ACCESS_SECRET,
    REFRESH_SECRET: validated.JWT_REFRESH_SECRET,
    ACCESS_EXPIRY: validated.JWT_ACCESS_EXPIRY,
    REFRESH_EXPIRY_DAYS: validated.JWT_REFRESH_EXPIRY_DAYS
  },

  COOKIE: {
    SECURE: validated.COOKIE_SECURE ?? (validated.NODE_ENV === 'production'),
    SAME_SITE: validated.COOKIE_SAME_SITE ?? (validated.NODE_ENV === 'production' ? 'none' : 'lax'),
    DOMAIN: validated.COOKIE_DOMAIN
  },

  RATE_LIMIT: {
    WINDOW_MS: validated.RATE_LIMIT_WINDOW_MS,
    MAX_REQUESTS: validated.RATE_LIMIT_MAX_REQUESTS
  },

  CRON: {
    MISSED_TASK_SCHEDULE: validated.MISSED_TASK_CRON_SCHEDULE,
    MISSED_TASK_ENABLED: validated.MISSED_TASK_JOB_ENABLED
  },

  EMAIL: {
    PROVIDER: validated.EMAIL_PROVIDER,
    GMAIL_USER: validated.GMAIL_USER,
    GMAIL_CLIENT_ID: validated.GMAIL_CLIENT_ID,
    GMAIL_CLIENT_SECRET: validated.GMAIL_CLIENT_SECRET,
    GMAIL_REFRESH_TOKEN: validated.GMAIL_REFRESH_TOKEN,
    SMTP_HOST: validated.SMTP_HOST,
    SMTP_PORT: validated.SMTP_PORT,
    SMTP_USER: validated.SMTP_USER,
    SMTP_PASS: validated.SMTP_PASS,
    EMAIL_FROM: validated.EMAIL_FROM
  },

  STORAGE: {
    PROVIDER: validated.STORAGE_PROVIDER,
    S3_BUCKET: validated.AWS_S3_BUCKET,
    S3_REGION: validated.AWS_REGION
  }
};
