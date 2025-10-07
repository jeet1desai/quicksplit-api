import mongoose from 'mongoose';
import Logger from 'bunyan';

import { config } from '@root/config';

const log: Logger = config.createLogger('Database');

export default async () => {
  const connect = async () => {
    try {
      const conn = await mongoose.connect(config.DATABASE_URL!);

      log.info(`📊 MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
      log.error('❌ Database connection failed:', error);
      process.exit(1);
    }
  };

  await connect();

  // Handle connection events
  mongoose.connection.on('error', (err) => {
    log.error('❌ MongoDB connection error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    log.warn('⚠️ MongoDB disconnected');
  });

  // Graceful shutdown
  process.on('SIGINT', async () => {
    await mongoose.connection.close();
    log.info('📊 MongoDB connection closed');
    process.exit(0);
  });
};
