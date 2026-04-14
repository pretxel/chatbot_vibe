export interface IChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  isError?: boolean;
}

export type ChatStatus = "ready" | "submitted" | "streaming" | "error";

export interface IUseSSEChatReturn {
  messages: IChatMessage[];
  status: ChatStatus;
  sendMessage: (text: string) => void;
  stop: () => void;
}
