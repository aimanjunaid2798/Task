"use client";

import { useState, FormEvent } from "react";

interface LoginFormProps {
  onLogin: (email: string, password: string) => Promise<boolean>;
  onRegister: (email: string, password: string, fullName?: string) => Promise<boolean>;
  error: string | null;
}

export function LoginForm({ onLogin, onRegister, error }: LoginFormProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isRegister) {
      await onRegister(email, password, fullName || undefined);
    } else {
      await onLogin(email, password);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
      {isRegister && (
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
            Full Name
          </label>
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-600 px-3 py-2.5 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 dark:bg-slate-800"
          />
        </div>
      )}
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-600 px-3 py-2.5 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 dark:bg-slate-800"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-600 px-3 py-2.5 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 dark:bg-slate-800"
        />
      </div>
      {error && <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>}
      <button
        type="submit"
        className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-white font-medium hover:from-violet-700 hover:to-indigo-700 shadow-md"
      >
        {isRegister ? "Sign Up" : "Sign In"}
      </button>
      <button
        type="button"
        onClick={() => setIsRegister(!isRegister)}
        className="w-full text-sm text-slate-500 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
      >
        {isRegister ? "Already have an account? Sign in" : "Need an account? Sign up"}
      </button>
    </form>
  );
}
