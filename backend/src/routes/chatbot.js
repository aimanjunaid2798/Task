/**
 * Chatbot routes - token issuance and chat proxy (requires auth).
 */
import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate } from '../middlewares/auth.js';
import { getToken, chat } from '../controllers/chatbotController.js';
import { ValidationError } from '../utils/errors.js';

const router = Router();

const handleValidation = (req, _res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ValidationError('Invalid request body'));
  }
  next();
};

router.post('/token', authenticate, getToken);

router.post(
  '/chat',
  authenticate,
  [
    body('messages').isArray(),
    body('messages.*.role').isIn(['user', 'assistant', 'system']),
    body('messages.*.content').isString(),
    body('session_id').isString().notEmpty(),
  ],
  handleValidation,
  chat
);

export { router as chatbotRouter };
