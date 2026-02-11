/**
 * Chat persistence - store sessions and messages in Supabase.
 * Only used when USE_MEMORY_DB=false (real DB).
 */
import { pool } from '../utils/db.js';

/**
 * Get or create chat_session by user_id and client_session_id (stored in metadata).
 * Returns { sessionId }.
 */
export async function getOrCreateSession(userId, clientSessionId) {
  const existing = await pool.query(
    `SELECT id FROM chat_sessions WHERE user_id = $1 AND metadata->>'client_session_id' = $2 LIMIT 1`,
    [userId, clientSessionId]
  );
  if (existing.rows.length > 0) {
    return { sessionId: existing.rows[0].id };
  }
  const insert = await pool.query(
    `INSERT INTO chat_sessions (user_id, metadata) VALUES ($1, $2) RETURNING id`,
    [userId, JSON.stringify({ client_session_id: clientSessionId })]
  );
  return { sessionId: insert.rows[0].id };
}

/**
 * Insert a single message into chat_messages.
 */
export async function insertMessage(sessionId, role, content) {
  await pool.query(
    `INSERT INTO chat_messages (session_id, role, content) VALUES ($1, $2, $3)`,
    [sessionId, role, content]
  );
}

/**
 * Persist user message and assistant reply for a chat turn.
 */
export async function persistChatTurn(userId, clientSessionId, userContent, assistantContent) {
  const { sessionId } = await getOrCreateSession(userId, clientSessionId);
  await insertMessage(sessionId, 'user', userContent);
  await insertMessage(sessionId, 'assistant', assistantContent);
  return sessionId;
}
