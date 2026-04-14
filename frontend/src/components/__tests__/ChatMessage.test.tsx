import type { IChatMessage } from "@/hooks/types";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ChatMessage } from "../ChatMessage";

function userMsg(content = "hello"): IChatMessage {
  return { id: "u1", role: "user", content };
}

function botMsg(content = ""): IChatMessage {
  return { id: "a1", role: "assistant", content };
}

function errMsg(content = "Something went wrong"): IChatMessage {
  return { id: "e1", role: "assistant", content, isError: true };
}

describe("ChatMessage", () => {
  it("renders user message right-aligned with content", () => {
    const { container } = render(
      <ChatMessage message={userMsg("hi there")} isLast status="ready" />,
    );
    expect(screen.getByText("hi there")).toBeTruthy();
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.className).toContain("justify-end");
  });

  it("renders assistant message with avatar (Bot icon)", () => {
    const { container } = render(
      <ChatMessage message={botMsg("hello")} isLast={false} status="ready" />,
    );
    expect(screen.getByText("hello")).toBeTruthy();
    expect(container.querySelector("svg")).not.toBeNull();
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.className).not.toContain("justify-end");
  });

  it("shows typing dots when bot message is empty and is last + streaming", () => {
    const { container } = render(
      <ChatMessage message={botMsg("")} isLast status="streaming" />,
    );
    const dots = container.querySelectorAll(".typing-dot");
    expect(dots.length).toBe(3);
  });

  it("shows typing dots when status is submitted (before any token arrives)", () => {
    const { container } = render(
      <ChatMessage message={botMsg("")} isLast status="submitted" />,
    );
    const dots = container.querySelectorAll(".typing-dot");
    expect(dots.length).toBe(3);
  });

  it("shows streaming cursor when bot has partial content and is still streaming", () => {
    const { container } = render(
      <ChatMessage message={botMsg("part")} isLast status="streaming" />,
    );
    expect(screen.getByText("part")).toBeTruthy();
    const cursor = container.querySelector("p > span.animate-pulse");
    expect(cursor).not.toBeNull();
  });

  it("does not show streaming cursor once status is ready", () => {
    const { container } = render(
      <ChatMessage message={botMsg("done")} isLast status="ready" />,
    );
    expect(container.querySelector("p > span.animate-pulse")).toBeNull();
  });

  it("does not show streaming cursor when message is not the last", () => {
    const { container } = render(
      <ChatMessage
        message={botMsg("earlier")}
        isLast={false}
        status="streaming"
      />,
    );
    expect(container.querySelector("p > span.animate-pulse")).toBeNull();
  });

  it("user messages never render typing indicator or cursor even while streaming", () => {
    const { container } = render(
      <ChatMessage message={userMsg("hi")} isLast status="streaming" />,
    );
    expect(container.querySelector(".typing-dot")).toBeNull();
    expect(container.querySelector(".animate-pulse")).toBeNull();
  });

  // --- error bubble ---

  it("renders error bubble with Error label and message content", () => {
    render(
      <ChatMessage
        message={errMsg("Request failed (500)")}
        isLast
        status="ready"
      />,
    );
    expect(screen.getByText("Error")).toBeTruthy();
    expect(screen.getByText("Request failed (500)")).toBeTruthy();
  });

  it("error bubble renders an icon (svg)", () => {
    const { container } = render(
      <ChatMessage message={errMsg()} isLast status="ready" />,
    );
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("error bubble is not right-aligned", () => {
    const { container } = render(
      <ChatMessage message={errMsg()} isLast status="ready" />,
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.className).not.toContain("justify-end");
  });

  it("error bubble shows no typing dots", () => {
    const { container } = render(
      <ChatMessage message={errMsg()} isLast status="streaming" />,
    );
    expect(container.querySelectorAll(".typing-dot").length).toBe(0);
  });

  it("error bubble shows no streaming cursor", () => {
    const { container } = render(
      <ChatMessage message={errMsg()} isLast status="streaming" />,
    );
    expect(container.querySelector(".animate-pulse")).toBeNull();
  });

  it("shows network error message from fetch rejection", () => {
    render(
      <ChatMessage message={errMsg("network down")} isLast status="ready" />,
    );
    expect(screen.getByText("network down")).toBeTruthy();
  });
});
