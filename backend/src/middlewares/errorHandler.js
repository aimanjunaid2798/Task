/**
 * Centralized error handling - catches all thrown errors.
 * Returns consistent JSON shape; logs stack in non-production.
 */
import { logger } from '../utils/logger.js';
import { config } from '../../config/index.js';

export function errorHandler(err, _req, res, _next) {
  const status = err.statusCode ?? 500;
  const message = err.message ?? 'Internal server error';

  if (status >= 500) {
    logger.error({ err, stack: err.stack }, 'Unhandled error');
  }

  res.status(status).json({
    error: message,
    ...(config.nodeEnv === 'development' && { stack: err.stack }),
  });
}
