"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ArrowUp, Square } from "lucide-react";
import { type SubmitEvent, memo, useEffect, useRef } from "react";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSubmit: (e: SubmitEvent<HTMLFormElement>) => void;
  status: string;
  onStop: () => void;
}

export const ChatInput = memo(function ChatInput({
  value,
  onChange,
  onSubmit,
  status,
  onStop,
}: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const isStreaming = status === "streaming" || status === "submitted";
  const canSend = value.trim().length > 0 && !isStreaming;

  useEffect(() => {
    if (status === "ready") ref.current?.focus();
  }, [status]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: value change drives textarea resize
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!canSend) return;
      e.currentTarget.form?.requestSubmit();
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      className={cn(
        "flex flex-col rounded-2xl border bg-card shadow-lg shadow-black/30",
        "transition-colors duration-150",
        isStreaming
          ? "border-primary/30"
          : "border-border focus-within:border-ring/50",
      )}
    >
      <Textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isStreaming}
        placeholder="Message Vibe Streamer…"
        rows={1}
        aria-label="Chat input"
        className={cn(
          "resize-none border-0 bg-transparent px-4 pt-4 pb-2",
          "text-sm text-foreground placeholder:text-muted-foreground/60",
          "focus-visible:outline-none focus-visible:ring-0",
          "min-h-[52px] max-h-[200px] leading-relaxed",
          "disabled:cursor-not-allowed disabled:opacity-60",
        )}
      />

      <div className="flex items-center justify-between px-3 pb-3 pt-1">
        <span className="select-none text-xs text-muted-foreground/50">
          {isStreaming ? (
            <span className="flex items-center gap-1.5 text-primary/70">
              <span className="typing-dot inline-block h-1.5 w-1.5 rounded-full bg-primary" />
              Generating…
            </span>
          ) : (
            <span>
              <kbd className="rounded border border-border/60 bg-muted px-1 py-0.5 font-mono text-[10px]">
                Enter
              </kbd>{" "}
              to send ·{" "}
              <kbd className="rounded border border-border/60 bg-muted px-1 py-0.5 font-mono text-[10px]">
                Shift+Enter
              </kbd>{" "}
              for new line
            </span>
          )}
        </span>

        {isStreaming ? (
          <Button
            type="button"
            size="icon"
            variant="secondary"
            onClick={onStop}
            aria-label="Stop generating"
            className="h-8 w-8 rounded-full"
          >
            <Square className="h-3 w-3 fill-current" />
          </Button>
        ) : (
          <Button
            type="submit"
            size="icon"
            disabled={!canSend}
            aria-label="Send message"
            className={cn(
              "h-8 w-8 rounded-full transition-all duration-150",
              canSend
                ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-primary/20 hover:shadow-md"
                : "bg-muted text-muted-foreground",
            )}
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        )}
      </div>
    </form>
  );
});
