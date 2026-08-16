import mongoose from 'mongoose';
import config from './index.js';
import { logger } from '../utils/logger.js';

let isConnected = false;

export async function connectDatabase() {
  if (isConnected) {
    return mongoose.connection;
  }

  try {
    const conn = await mongoose.connect(config.db.uri, {
      serverSelectionTimeoutMS: 5000,
    });

    isConnected = true;
    logger.info(`MongoDB Connected successfully to host: ${conn.connection.host}`);

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Attempting reconnection...');
      isConnected = false;
    });

    return conn;
  } catch (error) {
    logger.warn(`MongoDB direct connection unavailable (${error.message}). Repositories will utilize memory-backed fallback stores where applicable.`);
    return null;
  }
}

export async function disconnectDatabase() {
  if (isConnected) {
    await mongoose.disconnect();
    isConnected = false;
    logger.info('MongoDB disconnected gracefully');
  }
}

export default {
  connectDatabase,
  disconnectDatabase,
};
