/**
 * Auth business logic - registration, login, token creation.
 * Supports PostgreSQL or in-memory store (for local dev when Supabase fails).
 */
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { pool, useMemoryDb } from '../utils/db.js';
import { config } from '../../config/index.js';
import { UnauthorizedError, ValidationError } from '../utils/errors.js';

const SALT_ROUNDS = 10;

async function registerWithDb(email, password, fullName) {
  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    throw new ValidationError('Email already registered');
  }
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const id = uuidv4();
  await pool.query(
    'INSERT INTO users (id, email, password_hash, full_name) VALUES ($1, $2, $3, $4)',
    [id, email, passwordHash, fullName ?? null]
  );
  return createAccessToken({ id, email });
}

async function loginWithDb(email, password) {
  const result = await pool.query(
    'SELECT id, email, password_hash FROM users WHERE email = $1',
    [email]
  );
  const user = result.rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    throw new UnauthorizedError('Invalid email or password');
  }
  return createAccessToken({ id: user.id, email: user.email });
}

// In-memory store for local dev when Supabase/Postgres unavailable
const memoryUsers = new Map();

async function registerWithMemory(email, password, fullName) {
  if (memoryUsers.has(email.toLowerCase())) {
    throw new ValidationError('Email already registered');
  }
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const id = uuidv4();
  memoryUsers.set(email.toLowerCase(), { id, email, passwordHash, fullName: fullName ?? null });
  return createAccessToken({ id, email });
}

async function loginWithMemory(email, password) {
  const user = memoryUsers.get(email.toLowerCase());
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new UnauthorizedError('Invalid email or password');
  }
  return createAccessToken({ id: user.id, email: user.email });
}

export async function register(email, password, fullName) {
  return useMemoryDb ? registerWithMemory(email, password, fullName) : registerWithDb(email, password, fullName);
}

export async function login(email, password) {
  return useMemoryDb ? loginWithMemory(email, password) : loginWithDb(email, password);
}

export function createChatbotToken(userId, email) {
  return jwt.sign(
    { sub: userId, email, purpose: 'chatbot' },
    config.jwt.secret,
    { expiresIn: config.jwt.chatbotTokenExpiresIn }
  );
}

function createAccessToken({ id, email }) {
  return jwt.sign(
    { sub: id, email },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
}
