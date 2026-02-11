/**
 * Auth routes - signup and login.
 * Validation via express-validator; controller handles response.
 */
import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { register, login } from '../controllers/authController.js';
import { ValidationError } from '../utils/errors.js';

const router = Router();

const handleValidation = (req, _res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ValidationError(errors.array().map((e) => e.msg).join(', ')));
  }
  next();
};

router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('fullName').optional().trim(),
  ],
  handleValidation,
  register
);

router.post(
  '/login',
  [body('email').isEmail().normalizeEmail(), body('password').notEmpty()],
  handleValidation,
  login
);

export { router as authRouter };
