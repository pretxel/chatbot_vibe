"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import type { ChatStatus, IChatMessage, IUseSSEChatReturn } from "./types";
const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

function generateId(): string {
  return uuidv4();
}

export function useSSEChat(): IUseSSEChatReturn {
  const [messages, setMessages] = useState<IChatMessage[]>([]);
  const [status, setStatus] = useState<ChatStatus>("ready");

  const messagesRef = useRef<IChatMessage[]>([]);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const abortControllerRef = useRef<AbortController | null>(null);

  const stop = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setStatus("ready");
  }, []);

  const sendMessage = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMessage: IChatMessage = {
      id: generateId(),
      role: "user",
      content: trimmed,
    };

    const assistantId = generateId();
    const assistantMessage: IChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
    };

    const payload = [
      ...messagesRef.current.map((message) => ({
        role: message.role,
        content: message.content,
      })),
      { role: "user" as const, content: trimmed },
    ];

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setStatus("submitted");

    const controller = new AbortController();
    abortControllerRef.current = controller;

    void (async () => {
      try {
        const response = await fetch(`${BASE_URL}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: payload }),
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          let errorText = `Request failed (${response.status})`;
          try {
            const body = await response.json();
            if (typeof body?.detail === "string") errorText = body.detail;
            else if (typeof body?.message === "string")
              errorText = body.message;
          } catch {
            // body wasn't JSON — keep the default message
          }
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: errorText, isError: true }
                : m,
            ),
          );
          setStatus("ready");
          return;
        }

        setStatus("streaming");

        const reader: ReadableStreamDefaultReader<Uint8Array> =
          response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6);
            if (data === "[DONE]") {
              setStatus("ready");
              return;
            }
            const chunk = data.replace(/\\n/g, "\n");

            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, content: m.content + chunk } : m,
              ),
            );
          }
        }

        setStatus("ready");
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        const errorText =
          err instanceof Error
            ? err.message
            : "Network error — please try again";
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: errorText, isError: true }
              : m,
          ),
        );
        setStatus("ready");
      }
    })();
  }, []);

  return { messages, status, sendMessage, stop };
}
