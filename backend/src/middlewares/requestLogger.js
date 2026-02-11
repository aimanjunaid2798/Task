/**
 * Request logging - logs method, path, status, duration.
 * Composable; does not block request flow.
 */
import { logger } from '../utils/logger.js';

export function requestLogger(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    logger.info({
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: Date.now() - start,
    });
  });
  next();
}
