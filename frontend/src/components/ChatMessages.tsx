"use client";

import type { IChatMessage } from "@/hooks/types";
import { Bot } from "lucide-react";
import { memo, useEffect, useRef } from "react";
import { ChatMessage } from "./ChatMessage";

interface Props {
  messages: IChatMessage[];
  status: string;
}

export const ChatMessages = memo(function ChatMessages({
  messages,
  status,
}: Props) {
  const viewportRef = useRef<HTMLDivElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: messages change is the scroll trigger
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-5 select-none text-center px-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20 shadow-lg shadow-primary/10">
          <Bot className="h-8 w-8 text-primary" />
        </div>
        <div className="space-y-1.5">
          <p className="text-base font-semibold text-foreground">
            How can I help you today?
          </p>
          <p className="text-sm text-muted-foreground max-w-xs">
            Ask me anything — I&apos;ll stream the response in real time.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={viewportRef}
      className="flex-1 overflow-y-auto overscroll-contain"
    >
      <div className="mx-auto max-w-2xl flex flex-col gap-6 py-6 px-4 sm:px-6">
        {messages.map((message, index) => (
          <ChatMessage
            key={message.id}
            message={message}
            isLast={index === messages.length - 1}
            status={status}
          />
        ))}
      </div>
    </div>
  );
});
