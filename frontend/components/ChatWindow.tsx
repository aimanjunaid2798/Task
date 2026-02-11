"use client";

import { useRef, useEffect } from "react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import type { Message } from "@/types";

interface ChatWindowProps {
  messages: Message[];
  onSend: (content: string) => void;
  isLoading?: boolean;
  error?: string | null;
}

export function ChatWindow({ messages, onSend, isLoading, error }: ChatWindowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  return (
    <div className="flex flex-col min-h-[420px] rounded-2xl border-2 border-slate-200/80 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 shadow-xl overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-slate-50/80 to-white dark:from-slate-900/80 dark:to-slate-900" ref={scrollRef}>
        {messages.length === 0 && (
          <p className="text-slate-500 dark:text-slate-400 text-center py-10 text-sm">
            Start a conversation. Try: <span className="text-violet-600 dark:text-violet-400 font-medium">I would like to book an appointment</span>
          </p>
        )}
        {messages.map((m) => (
          <ChatMessage key={m.id} message={m} onSuggestionClick={onSend} />
        ))}
        {isLoading && (
          <div className="flex justify-start mb-3">
            <div className="rounded-2xl rounded-bl-md px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow">
              <span className="animate-pulse text-sm text-slate-500">Thinking...</span>
            </div>
          </div>
        )}
      </div>
      {error && (
        <p className="text-red-600 dark:text-red-400 text-sm px-4 py-2 bg-red-50 dark:bg-red-900/20 border-t border-red-100 dark:border-red-900/50">
          {error}
        </p>
      )}
      <ChatInput onSend={onSend} disabled={isLoading} />
    </div>
  );
}
