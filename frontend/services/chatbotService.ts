/**
 * Chatbot API - token issuance, chat (via backend proxy).
 * All API logic lives here; components only consume via hooks.
 */

import { apiFetch } from "@/lib/api-client";

export interface ChatbotTokenResponse {
  token: string;
  expiresIn: string;
}

export async function getChatbotToken(accessToken: string): Promise<ChatbotTokenResponse> {
  return apiFetch<ChatbotTokenResponse>("/api/chatbot/token", {
    method: "POST",
    token: accessToken,
  });
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatResponse {
  reply: string;
  appointment_state?: Record<string, unknown>;
  appointment_booked?: boolean;
}

export async function sendChat(
  accessToken: string,
  messages: ChatMessage[],
  sessionId: string
): Promise<ChatResponse> {
  return apiFetch<ChatResponse>("/api/chatbot/chat", {
    method: "POST",
    token: accessToken,
    body: JSON.stringify({ messages, session_id: sessionId }),
  });
}
