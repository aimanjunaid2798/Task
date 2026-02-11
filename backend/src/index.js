/**
 * Entry point - mounts routes and starts server.
 * Middleware order: security → parsing → routes → error handler
 */
import express from 'express';
import cors from 'cors';
import { config } from '../config/index.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { requestLogger } from './middlewares/requestLogger.js';
import { rateLimiter } from './middlewares/rateLimiter.js';
import { authRouter } from './routes/auth.js';
import { chatbotRouter } from './routes/chatbot.js';

const app = express();

app.use(cors({ origin: config.nodeEnv === 'production' ? undefined : true }));
app.use(express.json());
app.use(requestLogger);
app.use(rateLimiter);

app.use('/api/auth', authRouter);
app.use('/api/chatbot', chatbotRouter);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`API listening on port ${config.port}`);
  if (config.database.useMemory) {
    console.log('Using in-memory auth (no database)');
  }
});
