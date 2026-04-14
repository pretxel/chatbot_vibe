import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ChatInput } from "../ChatInput";

function setup(
  overrides: Partial<React.ComponentProps<typeof ChatInput>> = {},
) {
  const props = {
    value: "",
    onChange: vi.fn(),
    onSubmit: vi.fn((e) => e.preventDefault?.()),
    status: "ready",
    onStop: vi.fn(),
    ...overrides,
  };
  const utils = render(<ChatInput {...props} />);
  return { ...utils, props };
}

describe("ChatInput", () => {
  it("renders textarea and send button in ready state", () => {
    setup();
    expect(screen.getByLabelText("Chat input")).toBeTruthy();
    expect(screen.getByLabelText("Send message")).toBeTruthy();
    expect(screen.queryByLabelText("Stop generating")).toBeNull();
  });

  it("Enter submits the form when canSend", () => {
    const onSubmit = vi.fn((e) => e.preventDefault());
    const { container } = render(
      <ChatInput
        value="hello"
        onChange={vi.fn()}
        onSubmit={onSubmit}
        status="ready"
        onStop={vi.fn()}
      />,
    );
    const textarea = container.querySelector("textarea");
    if (!textarea) throw new Error("textarea not found");
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("Enter is a no-op when value is empty", () => {
    const onSubmit = vi.fn((e) => e.preventDefault());
    const { container } = render(
      <ChatInput
        value=""
        onChange={vi.fn()}
        onSubmit={onSubmit}
        status="ready"
        onStop={vi.fn()}
      />,
    );
    const textarea = container.querySelector("textarea");
    if (!textarea) throw new Error("textarea not found");
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("Shift+Enter does not submit (newline behaviour)", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onSubmit = vi.fn((e) => e.preventDefault());
    render(
      <ChatInput
        value="line1"
        onChange={onChange}
        onSubmit={onSubmit}
        status="ready"
        onStop={vi.fn()}
      />,
    );
    const textarea = screen.getByLabelText("Chat input");
    textarea.focus();
    await user.keyboard("{Shift>}{Enter}{/Shift}");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("disables the textarea while streaming and shows the stop button", () => {
    setup({ value: "hi", status: "streaming" });
    const textarea = screen.getByLabelText("Chat input") as HTMLTextAreaElement;
    expect(textarea.disabled).toBe(true);
    expect(screen.getByLabelText("Stop generating")).toBeTruthy();
    expect(screen.queryByLabelText("Send message")).toBeNull();
  });

  it("disables the textarea and shows stop while submitted", () => {
    setup({ value: "hi", status: "submitted" });
    const textarea = screen.getByLabelText("Chat input") as HTMLTextAreaElement;
    expect(textarea.disabled).toBe(true);
    expect(screen.getByLabelText("Stop generating")).toBeTruthy();
  });

  it("clicking stop calls onStop", () => {
    const onStop = vi.fn();
    setup({ value: "hi", status: "streaming", onStop });
    fireEvent.click(screen.getByLabelText("Stop generating"));
    expect(onStop).toHaveBeenCalledTimes(1);
  });

  it("send button is disabled when value is only whitespace", () => {
    setup({ value: "   " });
    const btn = screen.getByLabelText("Send message") as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it("forwards onChange from the textarea", () => {
    const onChange = vi.fn();
    setup({ onChange });
    const textarea = screen.getByLabelText("Chat input");
    fireEvent.change(textarea, { target: { value: "typed" } });
    expect(onChange).toHaveBeenCalledWith("typed");
  });
});
