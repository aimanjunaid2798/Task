/**
 * JWT authentication middleware - verifies token, attaches user to req.
 * Composable: use only on routes that need protection.
 */
import jwt from 'jsonwebtoken';
import { config } from '../../config/index.js';
import { UnauthorizedError } from '../utils/errors.js';

export function authenticate(req, _res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return next(new UnauthorizedError('Missing or invalid authorization header'));
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = { id: decoded.sub, email: decoded.email };
    next();
  } catch {
    next(new UnauthorizedError('Invalid or expired token'));
  }
}
