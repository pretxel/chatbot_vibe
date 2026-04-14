"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { IChatMessage } from "@/hooks/types";
import { AlertCircle, Bot } from "lucide-react";
import { memo } from "react";

interface Props {
  message: IChatMessage;
  isLast: boolean;
  status: string;
}

export const ChatMessage = memo(function ChatMessage({
  message,
  isLast,
  status,
}: Props) {
  const isUser = message.role === "user";
  const isStreaming =
    isLast && !isUser && (status === "streaming" || status === "submitted");

  const text = message.content;

  if (message.isError) {
    return (
      <div className="flex gap-3 px-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-200">
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-destructive/10 ring-1 ring-destructive/20">
          <AlertCircle className="h-3.5 w-3.5 text-destructive" />
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          <p className="mb-1 text-xs font-medium text-destructive/70">Error</p>
          <p className="text-sm leading-relaxed text-destructive whitespace-pre-wrap">
            {message.content}
          </p>
        </div>
      </div>
    );
  }

  if (isUser) {
    return (
      <div className="flex justify-end gap-3 px-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-200">
        <div className="max-w-[75%] rounded-2xl rounded-tr-sm bg-primary px-4 py-3 text-sm text-primary-foreground leading-relaxed shadow-sm">
          {text}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 px-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-200">
      <Avatar className="mt-0.5 h-7 w-7 shrink-0">
        <AvatarFallback className="bg-primary/10 text-primary ring-1 ring-primary/20">
          <Bot className="h-3.5 w-3.5" />
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0 pt-0.5">
        {!text && isStreaming ? (
          <div className="flex items-center gap-1 h-5">
            {[0, 0.2, 0.4].map((delay) => (
              <span
                key={delay}
                className="typing-dot inline-block h-1.5 w-1.5 rounded-full bg-muted-foreground"
                style={{ animationDelay: `${delay}s` }}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
            {text}
            {isStreaming && (
              <span className="ml-0.5 inline-block w-0.5 h-[1.1em] bg-primary align-middle animate-pulse" />
            )}
          </p>
        )}
      </div>
    </div>
  );
});
