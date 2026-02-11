/**
 * Auth controller - thin layer: validation → service → response.
 * No business logic; delegates to authService.
 */
import { register as registerUser, login as loginUser } from '../services/authService.js';

export async function register(req, res, next) {
  try {
    const { email, password, fullName } = req.body;
    const token = await registerUser(email, password, fullName);
    res.status(201).json({ token });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const token = await loginUser(email, password);
    res.json({ token });
  } catch (err) {
    next(err);
  }
}
