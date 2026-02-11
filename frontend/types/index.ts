/**
 * Shared type definitions.
 * Keeps API contracts and UI models in sync.
 */

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface ChatSession {
  id: string;
  messages: Message[];
  isLoading?: boolean;
}

export interface User {
  id: string;
  email: string;
  fullName?: string;
}

export interface AppointmentState {
  draft?: Record<string, unknown>;
  step?: string;
}
