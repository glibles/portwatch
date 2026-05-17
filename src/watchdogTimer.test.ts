import {
  createWatchdogStore,
  tickWatchdog,
  checkWatchdog,
  resetWatchdog,
  isHealthy,
} from "./watchdogTimer";

describe("createWatchdogStore", () => {
  it("initialises with null lastTickAt and zero missed ticks", () => {
    const store = createWatchdogStore(1000);
    expect(store.lastTickAt).toBeNull();
    expect(store.missedTicks).toBe(0);
    expect(store.intervalMs).toBe(1000);
    expect(store.maxMissedTicks).toBe(3);
  });

  it("accepts custom maxMissedTicks", () => {
    const store = createWatchdogStore(500, 5);
    expect(store.maxMissedTicks).toBe(5);
  });
});

describe("tickWatchdog", () => {
  it("sets lastTickAt and resets missedTicks", () => {
    const store = createWatchdogStore(1000);
    store.missedTicks = 2;
    tickWatchdog(store, 5000);
    expect(store.lastTickAt).toBe(5000);
    expect(store.missedTicks).toBe(0);
  });
});

describe("checkWatchdog", () => {
  it("returns not stalled when no tick has occurred", () => {
    const store = createWatchdogStore(1000);
    const result = checkWatchdog(store, 9000);
    expect(result.stalled).toBe(false);
    expect(result.missedTicks).toBe(0);
  });

  it("detects missed ticks", () => {
    const store = createWatchdogStore(1000);
    tickWatchdog(store, 0);
    const result = checkWatchdog(store, 2500);
    expect(result.missedTicks).toBe(2);
    expect(result.stalled).toBe(false);
  });

  it("marks stalled when missed ticks reach threshold", () => {
    const store = createWatchdogStore(1000, 3);
    tickWatchdog(store, 0);
    const result = checkWatchdog(store, 3500);
    expect(result.stalled).toBe(true);
    expect(result.missedTicks).toBeGreaterThanOrEqual(3);
  });
});

describe("resetWatchdog", () => {
  it("clears state", () => {
    const store = createWatchdogStore(1000);
    tickWatchdog(store, 1000);
    store.missedTicks = 2;
    resetWatchdog(store);
    expect(store.lastTickAt).toBeNull();
    expect(store.missedTicks).toBe(0);
  });
});

describe("isHealthy", () => {
  it("returns true before first tick", () => {
    const store = createWatchdogStore(1000);
    expect(isHealthy(store, 5000)).toBe(true);
  });

  it("returns false when stalled", () => {
    const store = createWatchdogStore(1000, 2);
    tickWatchdog(store, 0);
    expect(isHealthy(store, 3000)).toBe(false);
  });

  it("returns true when ticks are on time", () => {
    const store = createWatchdogStore(1000, 3);
    tickWatchdog(store, 0);
    expect(isHealthy(store, 500)).toBe(true);
  });
});
