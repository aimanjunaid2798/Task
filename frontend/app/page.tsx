"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
import { ChatWindow } from "@/components/ChatWindow";
import { useAuth } from "@/hooks/useAuth";
import { useChat } from "@/hooks/useChat";

function generateSessionId(): string {
  return "session-" + Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export default function HomePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const { login, register, logout, error, isAuthenticated } = useAuth();
  const { messages, sendMessage, isLoading, error: chatError, appointmentBooked } = useChat(sessionId);

  useEffect(() => {
    setMounted(true);
    setSessionId(generateSessionId());
  }, []);

  useEffect(() => {
    if (mounted && isAuthenticated) {
      router.refresh();
    }
  }, [mounted, isAuthenticated, router]);

  const handleLogout = () => {
    logout();
    router.refresh();
  };

  if (!mounted) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-violet-50 via-slate-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="text-slate-500 font-medium">Loading...</div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-violet-50 via-slate-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="w-full max-w-md rounded-2xl border-2 border-slate-200/80 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 p-8 shadow-xl">
          <h1 className="mb-6 text-xl font-semibold text-slate-800 dark:text-slate-100">Sign in to use the chatbot</h1>
          <LoginForm onLogin={login} onRegister={register} error={error} />
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-4 bg-gradient-to-br from-violet-50 via-slate-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {appointmentBooked && (
        <div
          className="fixed top-4 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 px-5 py-2.5 text-white font-medium shadow-lg border border-emerald-400/50"
          role="alert"
        >
          Appointment booked
        </div>
      )}
      <header className="mb-4 flex w-full max-w-2xl items-center justify-between rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur border border-slate-200/80 dark:border-slate-700 px-4 py-3 shadow-md">
        <h1 className="text-xl font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">Appointment Booking</h1>
        <button
          onClick={handleLogout}
          className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
        >
          Logout
        </button>
      </header>
      <div className="w-full max-w-2xl">
        {sessionId && (
          <ChatWindow
            messages={messages}
            onSend={sendMessage}
            isLoading={isLoading}
            error={chatError}
          />
        )}
      </div>
    </main>
  );
}
