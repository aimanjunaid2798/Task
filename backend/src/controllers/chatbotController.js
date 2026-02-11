/**
 * Chatbot controller - thin layer: auth context → service → response.
 */
import { useMemoryDb } from '../utils/db.js';
import { issueChatbotToken, proxyChat } from '../services/chatbotService.js';
import { persistChatTurn } from '../services/chatService.js';

export async function getToken(req, res, next) {
  try {
    const { id, email } = req.user;
    const token = await issueChatbotToken(id, email);
    res.json({ token, expiresIn: '1h' });
  } catch (err) {
    next(err);
  }
}

export async function chat(req, res, next) {
  try {
    const { id, email } = req.user;
    const token = await issueChatbotToken(id, email);
    const { messages, session_id } = req.body;
    const result = await proxyChat(token, messages, session_id);
    if (!useMemoryDb && session_id) {
      const lastUser = [...(messages || [])].reverse().find((m) => m.role === 'user');
      const userContent = lastUser?.content ?? '';
      const assistantContent = result?.reply ?? '';
      if (userContent || assistantContent) {
        persistChatTurn(id, session_id, userContent, assistantContent).catch(() => {});
      }
    }
    res.json(result);
  } catch (err) {
    next(err);
  }
}
