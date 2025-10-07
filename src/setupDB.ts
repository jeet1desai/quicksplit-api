import mongoose from 'mongoose';
import Logger from 'bunyan';
import { config } from '@root/config';
import { ServerError } from '@shared/globals/helpers/error-handler';

const log: Logger = config.createLogger('Database');

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000;

class DatabaseConnection {
  private retryCount = 0;

  public async connect(): Promise<void> {
    try {
      if (!config.DATABASE_URL) {
        throw new ServerError('DATABASE_URL is not defined in config');
      }

      const options: mongoose.ConnectOptions = {
        serverSelectionTimeoutMS: 10000, // 10 seconds
        socketTimeoutMS: 45000, // 45 seconds
        connectTimeoutMS: 10000, // 10 seconds
        maxPoolSize: 10,
        retryWrites: true,
        w: 'majority'
      };

      const conn = await mongoose.connect(config.DATABASE_URL, options);
      this.retryCount = 0;
      log.info(`📊 MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
      this.retryCount++;

      if (this.retryCount <= MAX_RETRIES) {
        log.warn(`⚠️ Database connection attempt ${this.retryCount} failed. Retrying in ${RETRY_DELAY_MS / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
        return this.connect();
      }

      log.error('❌ Max retries reached. Could not connect to MongoDB:', error);
      process.exit(1);
    }
  }

  public isConnected(): boolean {
    return mongoose.connection.readyState === 1;
  }
}

export const databaseConnection = new DatabaseConnection();

export default async () => {
  await databaseConnection.connect();

  mongoose.connection.on('error', (err) => {
    log.error('❌ MongoDB connection error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    log.warn('⚠️ MongoDB disconnected. Attempting to reconnect...');
    databaseConnection.connect().catch((error) => {
      log.error('❌ Failed to reconnect to MongoDB:', error);
    });
  });

  process.on('SIGINT', async () => {
    await mongoose.connection.close();
    log.info('📊 MongoDB connection closed');
    process.exit(0);
  });
};
