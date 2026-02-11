/**
 * Centralized configuration - single source of truth.
 * Load .env from backend root so it works regardless of process cwd.
 */
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env'), override: true });

export const config = {
  port: parseInt(process.env.PORT ?? '3001', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  jwt: {
    secret: process.env.JWT_SECRET ?? 'dev-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
    chatbotTokenExpiresIn: process.env.CHATBOT_TOKEN_EXPIRES_IN ?? '1h',
  },
  database: {
    useMemory: process.env.USE_MEMORY_DB === 'true',
    // Explicit params (no URL parsing – avoids ENOTFOUND when password has : or @)
    host: process.env.DB_HOST,
    port: process.env.DB_PORT != null ? parseInt(process.env.DB_PORT, 10) : 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionString: process.env.DATABASE_URL?.trim(),
  },
  aiService: {
    url: process.env.AI_SERVICE_URL ?? 'http://localhost:8000',
    timeout: parseInt(process.env.AI_SERVICE_TIMEOUT ?? '30000', 10),
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '60000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX ?? '100', 10),
  },
};
