import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from './logger.js';

let isConnected = false;

export async function connectDatabase(uri = env.MONGODB_URI, maxRetries = 5, retryDelayMs = 2000) {
  if (isConnected) {
    logger.info('Using existing database connection');
    return mongoose.connection;
  }

  const options = {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000
  };

  let attempt = 0;
  while (attempt < maxRetries) {
    attempt++;
    try {
      logger.info(`Connecting to MongoDB (attempt ${attempt}/${maxRetries})...`);
      const conn = await mongoose.connect(uri, options);
      isConnected = true;
      logger.info(`MongoDB connected successfully to: ${conn.connection.host}/${conn.connection.name}`);

      mongoose.connection.on('error', (err) => {
        logger.error('MongoDB runtime connection error', err);
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected. Retrying...');
        isConnected = false;
      });

      return conn.connection;
    } catch (error) {
      logger.warn(`MongoDB connection attempt ${attempt}/${maxRetries} failed: ${error.message}`);
      if (attempt < maxRetries) {
        const backoff = retryDelayMs * Math.pow(1.5, attempt - 1);
        logger.info(`Waiting ${Math.round(backoff)}ms before retrying database connection...`);
        await new Promise((res) => setTimeout(res, backoff));
      } else {
        logger.error('MongoDB all initial connection retries exhausted', error);
        throw error;
      }
    }
  }
}

export async function disconnectDatabase() {
  if (!isConnected) return;
  try {
    await mongoose.disconnect();
    isConnected = false;
    logger.info('MongoDB disconnected cleanly');
  } catch (error) {
    logger.error('Error during MongoDB disconnect', error);
  }
}
