/**
 * Chatbot service - token issuance and AI proxy.
 */
import { createChatbotToken } from './authService.js';
import { config } from '../../config/index.js';

export async function issueChatbotToken(userId, email) {
  return createChatbotToken(userId, email);
}

export async function proxyChat(chatbotToken, messages, sessionId) {
  const res = await fetch(`${config.aiService.url}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${chatbotToken}`,
    },
    body: JSON.stringify({ messages, session_id: sessionId }),
    signal: AbortSignal.timeout(config.aiService.timeout),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? res.statusText);
  }
  return res.json();
}
