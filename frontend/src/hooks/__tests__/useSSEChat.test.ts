import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useSSEChat } from "../useSSEChat";

function makeStreamResponse(lines: string[]) {
  const encoder = new TextEncoder();
  let i = 0;
  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (i < lines.length) {
        controller.enqueue(encoder.encode(lines[i]));
        i += 1;
      } else {
        controller.close();
      }
    },
  });
  return new Response(stream, {
    status: 200,
    headers: { "Content-Type": "text/event-stream" },
  });
}

describe("useSSEChat", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("starts in ready state with no messages", () => {
    const { result } = renderHook(() => useSSEChat());
    expect(result.current.status).toBe("ready");
    expect(result.current.messages).toEqual([]);
  });

  it("ignores empty/whitespace input", () => {
    const { result } = renderHook(() => useSSEChat());
    act(() => {
      result.current.sendMessage("   ");
    });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.current.messages).toEqual([]);
    expect(result.current.status).toBe("ready");
  });

  it("transitions ready → submitted → streaming → ready and parses SSE chunks", async () => {
    fetchMock.mockResolvedValueOnce(
      makeStreamResponse(["data: Hello\n", "data: world\n", "data: [DONE]\n"]),
    );

    const { result } = renderHook(() => useSSEChat());

    act(() => {
      result.current.sendMessage("hi");
    });

    expect(result.current.status).toBe("submitted");
    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[0]).toMatchObject({
      role: "user",
      content: "hi",
    });
    expect(result.current.messages[1]).toMatchObject({
      role: "assistant",
      content: "",
    });

    await waitFor(() => {
      expect(result.current.status).toBe("ready");
    });

    const assistant = result.current.messages[1];
    expect(assistant.content).toContain("Hello");
    expect(assistant.content).toContain("world");
    expect(assistant.isError).toBeUndefined();
  });

  it("decodes escaped newlines in SSE chunks", async () => {
    fetchMock.mockResolvedValueOnce(
      makeStreamResponse(["data: line1\\nline2\n", "data: [DONE]\n"]),
    );

    const { result } = renderHook(() => useSSEChat());
    act(() => {
      result.current.sendMessage("hi");
    });

    await waitFor(() => {
      expect(result.current.status).toBe("ready");
    });

    expect(result.current.messages[1].content).toContain("line1\nline2");
  });

  it("returns to ready and marks assistant message as error on non-ok response", async () => {
    fetchMock.mockResolvedValueOnce(new Response("boom", { status: 500 }));

    const { result } = renderHook(() => useSSEChat());
    act(() => {
      result.current.sendMessage("hi");
    });

    await waitFor(() => {
      expect(result.current.status).toBe("ready");
    });

    const assistant = result.current.messages[1];
    expect(assistant.isError).toBe(true);
    expect(assistant.content).toContain("500");
  });

  it("uses detail field from JSON error body when available", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ detail: "Provider unavailable" }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const { result } = renderHook(() => useSSEChat());
    act(() => {
      result.current.sendMessage("hi");
    });

    await waitFor(() => {
      expect(result.current.status).toBe("ready");
    });

    const assistant = result.current.messages[1];
    expect(assistant.isError).toBe(true);
    expect(assistant.content).toBe("Provider unavailable");
  });

  it("returns to ready and marks assistant as error when fetch rejects (non-abort)", async () => {
    fetchMock.mockRejectedValueOnce(new Error("network down"));

    const { result } = renderHook(() => useSSEChat());
    act(() => {
      result.current.sendMessage("hi");
    });

    await waitFor(() => {
      expect(result.current.status).toBe("ready");
    });

    const assistant = result.current.messages[1];
    expect(assistant.isError).toBe(true);
    expect(assistant.content).toBe("network down");
  });

  it("stop() aborts the in-flight request and resets status to ready", async () => {
    let abortedSignal: AbortSignal | undefined;
    fetchMock.mockImplementationOnce(
      (_url, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          abortedSignal = init.signal ?? undefined;
          init.signal?.addEventListener("abort", () => {
            reject(
              new DOMException("The user aborted a request.", "AbortError"),
            );
          });
        }),
    );

    const { result } = renderHook(() => useSSEChat());

    act(() => {
      result.current.sendMessage("hi");
    });
    expect(result.current.status).toBe("submitted");

    act(() => {
      result.current.stop();
    });

    expect(abortedSignal?.aborted).toBe(true);
    // stop() immediately resets to ready; the abort rejection is swallowed.
    await waitFor(() => {
      expect(result.current.status).toBe("ready");
    });
    // Abort must NOT produce an error message
    expect(result.current.messages[1].isError).toBeUndefined();
  });

  it("only sends prior history + new user turn to the backend (no empty assistant)", async () => {
    fetchMock.mockResolvedValueOnce(
      makeStreamResponse(["data: ok\n", "data: [DONE]\n"]),
    );

    const { result } = renderHook(() => useSSEChat());
    act(() => {
      result.current.sendMessage("hi");
    });

    await waitFor(() => {
      expect(result.current.status).toBe("ready");
    });

    const call = fetchMock.mock.calls[0];
    const body = JSON.parse((call[1] as RequestInit).body as string);
    expect(body.messages).toEqual([{ role: "user", content: "hi" }]);
  });
});
