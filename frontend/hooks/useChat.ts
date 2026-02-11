/**
 * Chat hook - manages messages, sends to AI service.
 * Central state; uses chatbotService for API calls.
 */

"use client";

import { useState, useCallback, useEffect } from "react";
import { getToken } from "@/lib/auth";
import * as chatbotService from "@/services/chatbotService";
import type { Message } from "@/types";

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function useChat(sessionId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appointmentBooked, setAppointmentBooked] = useState(false);

  useEffect(() => {
    if (!appointmentBooked) return;
    const t = setTimeout(() => setAppointmentBooked(false), 4000);
    return () => clearTimeout(t);
  }, [appointmentBooked]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      const accessToken = getToken();
      if (!accessToken) {
        setError("Not authenticated");
        return;
      }

      const userMsg: Message = {
        id: generateId(),
        role: "user",
        content: content.trim(),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);
      setError(null);

      try {
        const chatMessages = [
          ...messages.map((m) => ({ role: m.role, content: m.content })),
          { role: "user" as const, content: content.trim() },
        ];
        const { reply, appointment_booked } = await chatbotService.sendChat(
          accessToken,
          chatMessages,
          sessionId
        );

        const assistantMsg: Message = {
          id: generateId(),
          role: "assistant",
          content: reply,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
        if (appointment_booked) setAppointmentBooked(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to send message");
      } finally {
        setIsLoading(false);
      }
    },
    [messages, sessionId]
  );

  return { messages, sendMessage, isLoading, error, appointmentBooked };
}
