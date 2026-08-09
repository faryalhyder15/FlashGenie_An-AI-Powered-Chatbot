import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FlashGenie — AI-Powered Study Flashcards",
  description:
    "Turn your notes into study flashcards in seconds with AI. Sign up free and start learning smarter.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans">{children}</body>
    </html>
  );
}
