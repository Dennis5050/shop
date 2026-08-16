import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const env = process.env.NODE_ENV || 'development';
const isProduction = env === 'production';

export const config = {
  server: {
    port: parseInt(process.env.PORT || '5000', 10),
    env,
    isProduction,
    clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  },
  db: {
    uri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nexus_chat',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'nexus_default_jwt_secret_dev_key_2026',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    cookieSecret: process.env.COOKIE_SECRET || 'nexus_cookie_secret_dev',
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 mins
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '300', 10),
  },
  media: {
    maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10),
    uploadDir: path.resolve(process.env.UPLOAD_DIR || './uploads'),
  },
};

export default config;
