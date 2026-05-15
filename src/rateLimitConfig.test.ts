import {
  parseRateLimitConfig,
  mergeRateLimitDefaults,
  DEFAULT_RATE_LIMIT,
} from "./rateLimitConfig";

describe("parseRateLimitConfig", () => {
  it("returns defaults when given an empty object", () => {
    expect(parseRateLimitConfig({})).toEqual(DEFAULT_RATE_LIMIT);
  });

  it("uses provided valid values", () => {
    const result = parseRateLimitConfig({ windowMs: 30_000, maxEvents: 10 });
    expect(result).toEqual({ windowMs: 30_000, maxEvents: 10 });
  });

  it("falls back to default windowMs for non-positive value", () => {
    const result = parseRateLimitConfig({ windowMs: -1, maxEvents: 4 });
    expect(result.windowMs).toBe(DEFAULT_RATE_LIMIT.windowMs);
    expect(result.maxEvents).toBe(4);
  });

  it("falls back to default maxEvents for zero", () => {
    const result = parseRateLimitConfig({ windowMs: 5000, maxEvents: 0 });
    expect(result.maxEvents).toBe(DEFAULT_RATE_LIMIT.maxEvents);
    expect(result.windowMs).toBe(5000);
  });

  it("falls back to default maxEvents for non-integer", () => {
    const result = parseRateLimitConfig({ windowMs: 5000, maxEvents: 2.5 });
    expect(result.maxEvents).toBe(DEFAULT_RATE_LIMIT.maxEvents);
  });

  it("falls back when values are wrong types", () => {
    const result = parseRateLimitConfig({
      windowMs: "fast" as unknown as number,
      maxEvents: null as unknown as number,
    });
    expect(result).toEqual(DEFAULT_RATE_LIMIT);
  });
});

describe("mergeRateLimitDefaults", () => {
  it("fills in missing fields with defaults", () => {
    expect(mergeRateLimitDefaults({})).toEqual(DEFAULT_RATE_LIMIT);
  });

  it("preserves provided windowMs", () => {
    const result = mergeRateLimitDefaults({ windowMs: 2000 });
    expect(result.windowMs).toBe(2000);
    expect(result.maxEvents).toBe(DEFAULT_RATE_LIMIT.maxEvents);
  });

  it("preserves provided maxEvents", () => {
    const result = mergeRateLimitDefaults({ maxEvents: 20 });
    expect(result.maxEvents).toBe(20);
    expect(result.windowMs).toBe(DEFAULT_RATE_LIMIT.windowMs);
  });

  it("preserves both fields when both provided", () => {
    const result = mergeRateLimitDefaults({ windowMs: 1000, maxEvents: 1 });
    expect(result).toEqual({ windowMs: 1000, maxEvents: 1 });
  });
});
