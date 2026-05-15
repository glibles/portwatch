import {
  createStore,
  isAllowed,
  resetKey,
  pruneStore,
  RateLimitConfig,
} from "./rateLimit";

const config: RateLimitConfig = { windowMs: 10_000, maxEvents: 3 };

describe("createStore", () => {
  it("returns an empty Map", () => {
    const store = createStore();
    expect(store.size).toBe(0);
  });
});

describe("isAllowed", () => {
  it("allows events below the limit", () => {
    const store = createStore();
    expect(isAllowed(store, "port:3000", config, 1000)).toBe(true);
    expect(isAllowed(store, "port:3000", config, 2000)).toBe(true);
    expect(isAllowed(store, "port:3000", config, 3000)).toBe(true);
  });

  it("blocks the event that exceeds the limit", () => {
    const store = createStore();
    isAllowed(store, "port:8080", config, 1000);
    isAllowed(store, "port:8080", config, 2000);
    isAllowed(store, "port:8080", config, 3000);
    expect(isAllowed(store, "port:8080", config, 4000)).toBe(false);
  });

  it("allows again after the window expires", () => {
    const store = createStore();
    isAllowed(store, "port:9000", config, 1000);
    isAllowed(store, "port:9000", config, 2000);
    isAllowed(store, "port:9000", config, 3000);
    // 15 seconds later — all previous timestamps are outside the 10s window
    expect(isAllowed(store, "port:9000", config, 16_000)).toBe(true);
  });

  it("tracks different keys independently", () => {
    const store = createStore();
    isAllowed(store, "port:1111", config, 1000);
    isAllowed(store, "port:1111", config, 2000);
    isAllowed(store, "port:1111", config, 3000);
    expect(isAllowed(store, "port:1111", config, 4000)).toBe(false);
    expect(isAllowed(store, "port:2222", config, 4000)).toBe(true);
  });
});

describe("resetKey", () => {
  it("clears rate limit state for a key", () => {
    const store = createStore();
    isAllowed(store, "port:3000", config, 1000);
    isAllowed(store, "port:3000", config, 2000);
    isAllowed(store, "port:3000", config, 3000);
    resetKey(store, "port:3000");
    expect(isAllowed(store, "port:3000", config, 4000)).toBe(true);
  });
});

describe("pruneStore", () => {
  it("removes keys with no recent timestamps", () => {
    const store = createStore();
    isAllowed(store, "port:5000", config, 1000);
    isAllowed(store, "port:6000", config, 1000);
    pruneStore(store, config.windowMs, 20_000);
    expect(store.size).toBe(0);
  });

  it("retains keys that still have recent timestamps", () => {
    const store = createStore();
    isAllowed(store, "port:7000", config, 1000);
    isAllowed(store, "port:8000", config, 15_000);
    pruneStore(store, config.windowMs, 20_000);
    expect(store.has("port:7000")).toBe(false);
    expect(store.has("port:8000")).toBe(true);
  });
});
