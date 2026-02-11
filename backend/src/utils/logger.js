/**
 * Pino logger - structured logs for production, pretty for dev.
 * Use child loggers per module for traceability.
 */
import pino from 'pino';
import { config } from '../../config/index.js';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  transport:
    config.nodeEnv === 'development'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
});
