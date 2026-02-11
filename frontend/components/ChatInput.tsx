"use client";

import { useState, FormEvent } from "react";

interface ChatInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput("");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex gap-2 p-3 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
    >
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type a message..."
        disabled={disabled}
        className="flex-1 rounded-xl border-2 border-slate-200 dark:border-slate-600 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 dark:bg-slate-800 dark:focus:ring-violet-500"
      />
      <button
        type="submit"
        disabled={disabled || !input.trim()}
        className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-white font-medium hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50 shadow-md"
      >
        Send
      </button>
    </form>
  );
}
