import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  notifyConsole,
  notifyDesktop,
  notifyWebhook,
  dispatchAlert,
} from "./notifier";
import type { AlertEvent } from "./alertManager";

const mockAlert: AlertEvent = {
  timestamp: 1700000000000,
  message: "Port 8080 opened by node (pid 1234)",
  port: 8080,
  protocol: "tcp",
};

describe("notifyConsole", () => {
  it("logs a warning with timestamp and message", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    notifyConsole(mockAlert);
    expect(spy).toHaveBeenCalledOnce();
    const output = spy.mock.calls[0][0] as string;
    expect(output).toContain("[ALERT");
    expect(output).toContain(mockAlert.message);
    spy.mockRestore();
  });
});

describe("notifyDesktop", () => {
  it("does not throw on unsupported platforms", () => {
    // execSync may fail in CI; notifyDesktop swallows errors
    expect(() => notifyDesktop(mockAlert)).not.toThrow();
  });
});

describe("notifyWebhook", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts JSON payload to the webhook URL", async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValue({ ok: true } as Response);

    await notifyWebhook(mockAlert, "https://example.com/hook");

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe("https://example.com/hook");
    expect(options?.method).toBe("POST");
    const body = JSON.parse(options?.body as string);
    expect(body.port).toBe(8080);
    expect(body.message).toBe(mockAlert.message);
  });

  it("throws when the webhook responds with an error status", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    } as Response);

    await expect(
      notifyWebhook(mockAlert, "https://example.com/hook")
    ).rejects.toThrow("Webhook delivery failed: 500");
  });
});

describe("dispatchAlert", () => {
  it("calls console notify for console channel", async () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    await dispatchAlert(mockAlert, { channels: ["console"] });
    expect(spy).toHaveBeenCalledOnce();
    spy.mockRestore();
  });

  it("skips webhook when no webhookUrl is configured", async () => {
    vi.stubGlobal("fetch", vi.fn());
    await dispatchAlert(mockAlert, { channels: ["webhook"] });
    expect(fetch).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
