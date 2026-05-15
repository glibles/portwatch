import { withRetry, calcDelay, defaultRetryOptions, RetryOptions } from "./retryHandler";

describe("calcDelay", () => {
  const opts: RetryOptions = {
    maxAttempts: 5,
    initialDelayMs: 100,
    backoffFactor: 2,
    maxDelayMs: 1000,
  };

  it("returns initialDelayMs on first attempt", () => {
    expect(calcDelay(1, opts)).toBe(100);
  });

  it("doubles delay on each subsequent attempt", () => {
    expect(calcDelay(2, opts)).toBe(200);
    expect(calcDelay(3, opts)).toBe(400);
  });

  it("caps delay at maxDelayMs", () => {
    expect(calcDelay(5, opts)).toBe(1000);
    expect(calcDelay(10, opts)).toBe(1000);
  });
});

describe("withRetry", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("resolves immediately when fn succeeds on first try", async () => {
    const fn = jest.fn().mockResolvedValue("ok");
    const result = await withRetry(fn, { maxAttempts: 3, initialDelayMs: 0, backoffFactor: 1, maxDelayMs: 0 });
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries on failure and resolves when fn eventually succeeds", async () => {
    let calls = 0;
    const fn = jest.fn().mockImplementation(() => {
      calls++;
      if (calls < 3) return Promise.reject(new Error("fail"));
      return Promise.resolve("success");
    });

    const promise = withRetry(fn, { maxAttempts: 5, initialDelayMs: 0, backoffFactor: 1, maxDelayMs: 0 });
    await jest.runAllTimersAsync();
    const result = await promise;

    expect(result).toBe("success");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("throws after exhausting all attempts", async () => {
    const fn = jest.fn().mockRejectedValue(new Error("persistent error"));

    const promise = withRetry(fn, { maxAttempts: 3, initialDelayMs: 0, backoffFactor: 1, maxDelayMs: 0 });
    await jest.runAllTimersAsync();

    await expect(promise).rejects.toThrow("persistent error");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("calls onRetry callback with attempt number and error", async () => {
    const onRetry = jest.fn();
    const fn = jest.fn().mockRejectedValue(new Error("oops"));

    const promise = withRetry(fn, { maxAttempts: 3, initialDelayMs: 0, backoffFactor: 1, maxDelayMs: 0, onRetry });
    await jest.runAllTimersAsync();
    await promise.catch(() => {});

    expect(onRetry).toHaveBeenCalledTimes(2);
    expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error));
    expect(onRetry).toHaveBeenCalledWith(2, expect.any(Error));
  });

  it("uses defaultRetryOptions when no options provided", () => {
    expect(defaultRetryOptions.maxAttempts).toBe(3);
    expect(defaultRetryOptions.initialDelayMs).toBe(200);
    expect(defaultRetryOptions.backoffFactor).toBe(2);
  });
});
