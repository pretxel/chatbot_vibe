"use client";

import { ChatInput } from "@/components/ChatInput";
import { ChatMessages } from "@/components/ChatMessages";
import { useSSEChat } from "@/hooks/useSSEChat";
import { Zap } from "lucide-react";
import { type SubmitEvent, useState } from "react";

export default function ChatPage() {
  const { messages, sendMessage, status, stop } = useSSEChat();
  const [input, setInput] = useState("");

  const isStreaming = status === "streaming" || status === "submitted";

  const handleSubmit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    const text = input;
    setInput("");
    sendMessage(text);
  };

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_80%_100%_at_50%_-20%,oklch(0.85_0.06_264/0.25),transparent)]" />

      <header className="relative z-10 shrink-0 border-b border-border/50 bg-background/70 px-4 py-3 backdrop-blur-md sm:px-6">
        <div className="mx-auto max-w-2xl flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 ring-1 ring-primary/20">
            <Zap className="h-4 w-4 text-primary" />
          </div>
          <span className="text-sm font-semibold tracking-tight">
            Vibe Streamer
          </span>
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1 flex-col">
        <ChatMessages messages={messages} status={status} />
      </div>

      <div className="relative z-10 shrink-0 px-4 pb-6 pt-3 sm:px-6">
        <div className="pointer-events-none absolute inset-x-0 -top-12 h-12 bg-gradient-to-t from-background to-transparent" />
        <div className="mx-auto max-w-2xl">
          <ChatInput
            value={input}
            onChange={setInput}
            onSubmit={handleSubmit}
            status={status}
            onStop={stop}
          />
        </div>
      </div>
    </div>
  );
}
