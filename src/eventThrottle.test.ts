import {
  createThrottleStore,
  throttleKey,
  shouldThrottle,
  resetThrottleKey,
  pruneThrottleStore,
} from "./eventThrottle";

describe("createThrottleStore", () => {
  it("creates store with defaults", () => {
    const store = createThrottleStore();
    expect(store.windowMs).toBe(5000);
    expect(store.maxPerWindow).toBe(3);
    expect(store.counts.size).toBe(0);
  });

  it("accepts custom window and max", () => {
    const store = createThrottleStore(1000, 5);
    expect(store.windowMs).toBe(1000);
    expect(store.maxPerWindow).toBe(5);
  });
});

describe("throttleKey", () => {
  it("produces composite key", () => {
    expect(throttleKey(8080, 1234, "open")).toBe("8080:1234:open");
  });
});

describe("shouldThrottle", () => {
  it("allows first event", () => {
    const store = createThrottleStore(5000, 3);
    expect(shouldThrottle(store, "k", 0)).toBe(false);
  });

  it("allows up to maxPerWindow events", () => {
    const store = createThrottleStore(5000, 3);
    expect(shouldThrottle(store, "k", 0)).toBe(false);
    expect(shouldThrottle(store, "k", 100)).toBe(false);
    expect(shouldThrottle(store, "k", 200)).toBe(false);
  });

  it("throttles beyond maxPerWindow within window", () => {
    const store = createThrottleStore(5000, 3);
    shouldThrottle(store, "k", 0);
    shouldThrottle(store, "k", 100);
    shouldThrottle(store, "k", 200);
    expect(shouldThrottle(store, "k", 300)).toBe(true);
  });

  it("resets count after window expires", () => {
    const store = createThrottleStore(1000, 2);
    shouldThrottle(store, "k", 0);
    shouldThrottle(store, "k", 100);
    shouldThrottle(store, "k", 200); // throttled
    expect(shouldThrottle(store, "k", 2000)).toBe(false); // new window
  });

  it("tracks different keys independently", () => {
    const store = createThrottleStore(5000, 1);
    expect(shouldThrottle(store, "a", 0)).toBe(false);
    expect(shouldThrottle(store, "b", 0)).toBe(false);
  });
});

describe("resetThrottleKey", () => {
  it("removes the key from the store", () => {
    const store = createThrottleStore();
    shouldThrottle(store, "k", 0);
    resetThrottleKey(store, "k");
    expect(store.counts.has("k")).toBe(false);
  });
});

describe("pruneThrottleStore", () => {
  it("removes stale entries and returns count", () => {
    const store = createThrottleStore(1000, 3);
    shouldThrottle(store, "old", 0);
    shouldThrottle(store, "new", 5000);
    const pruned = pruneThrottleStore(store, 6000);
    expect(pruned).toBe(1);
    expect(store.counts.has("old")).toBe(false);
    expect(store.counts.has("new")).toBe(true);
  });

  it("returns 0 when nothing to prune", () => {
    const store = createThrottleStore(5000, 3);
    shouldThrottle(store, "k", 1000);
    expect(pruneThrottleStore(store, 1500)).toBe(0);
  });
});
