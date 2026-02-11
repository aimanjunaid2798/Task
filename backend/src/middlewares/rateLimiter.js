/**
 * Rate limiting - protects against abuse.
 * Per-IP limits; configurable via env.
 */
import rateLimit from 'express-rate-limit';
import { config } from '../../config/index.js';

export const rateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: { error: 'Too many requests' },
});
