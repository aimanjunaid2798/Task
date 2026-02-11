import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Appointment Booking Chatbot",
  description: "Book appointments with an AI assistant",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        {children}
      </body>
    </html>
  );
}
