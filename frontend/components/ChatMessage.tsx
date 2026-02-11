"use client";

import { getSuggestionsFromMessage } from "@/lib/chatSuggestions";
import type { Message } from "@/types";

interface ChatMessageProps {
  message: Message;
  onSuggestionClick?: (value: string) => void;
}

export function ChatMessage({ message, onSuggestionClick }: ChatMessageProps) {
  const isUser = message.role === "user";
  const suggestions = !isUser && onSuggestionClick ? getSuggestionsFromMessage(message.content) : [];

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`} data-role={message.role}>
      <div className="max-w-[85%] flex flex-col items-start gap-2">
        <div
          className={
            isUser
              ? "rounded-2xl rounded-br-md px-4 py-2.5 bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-md"
              : "rounded-2xl rounded-bl-md px-4 py-2.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-md border border-slate-200 dark:border-slate-700"
          }
        >
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>
        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {suggestions.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => onSuggestionClick(value)}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-500 hover:bg-emerald-600 text-white shadow hover:shadow-md transition-all border border-emerald-600/50"
              >
                {value}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
