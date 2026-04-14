"use client";

import { ChatInput } from "@/components/ChatInput";
import { ChatMessages } from "@/components/ChatMessages";
import { useSSEChat } from "@/hooks/useSSEChat";
import { type SubmitEvent, useState } from "react";

export default function ChatBox() {
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
    <div className="flex flex-col h-full border rounded-xl overflow-hidden shadow-lg bg-white">
      <header className="bg-blue-600 text-white px-4 py-3 font-semibold text-sm tracking-wide">
        Chatbot
      </header>

      <div className="relative flex min-h-0 flex-1 flex-col">
        <ChatMessages messages={messages} status={status} />
      </div>

      <ChatInput
        value={input}
        onChange={setInput}
        onSubmit={handleSubmit}
        status={status}
        onStop={stop}
      />
    </div>
  );
}
