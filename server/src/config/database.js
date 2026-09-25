import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from './logger.js';

let isConnected = false;

export async function connectDatabase(uri = env.MONGODB_URI) {
  if (isConnected) {
    logger.info('Using existing database connection');
    return mongoose.connection;
  }

  const options = {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000
  };

  try {
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
    logger.error('MongoDB initial connection failed', error);
    throw error;
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
