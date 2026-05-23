import {
  createSchedulerStore,
  calcNextDelay,
  startScheduler,
  stopScheduler,
  getSchedulerStats,
} from "./eventScheduler";
import { createSchedulerIntegration } from "./eventSchedulerIntegration";

describe("createSchedulerStore", () => {
  it("initialises with correct defaults", () => {
    const store = createSchedulerStore(1000);
    expect(store.intervalMs).toBe(1000);
    expect(store.jitterMs).toBe(0);
    expect(store.running).toBe(false);
    expect(store.tickCount).toBe(0);
    expect(store.lastTickAt).toBeNull();
    expect(store.timerId).toBeNull();
  });

  it("stores jitter value", () => {
    const store = createSchedulerStore(500, 100);
    expect(store.jitterMs).toBe(100);
  });
});

describe("calcNextDelay", () => {
  it("returns exact intervalMs when jitter is 0", () => {
    const store = createSchedulerStore(2000, 0);
    expect(calcNextDelay(store)).toBe(2000);
  });

  it("returns value within [intervalMs, intervalMs + jitterMs)", () => {
    const store = createSchedulerStore(1000, 200);
    for (let i = 0; i < 20; i++) {
      const d = calcNextDelay(store);
      expect(d).toBeGreaterThanOrEqual(1000);
      expect(d).toBeLessThan(1200);
    }
  });
});

describe("startScheduler / stopScheduler", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("calls task after interval", () => {
    const store = createSchedulerStore(100);
    const task = jest.fn();
    startScheduler(store, task);
    expect(task).not.toHaveBeenCalled();
    jest.advanceTimersByTime(100);
    expect(task).toHaveBeenCalledTimes(1);
    stopScheduler(store);
  });

  it("increments tickCount on each tick", () => {
    const store = createSchedulerStore(50);
    startScheduler(store, jest.fn());
    jest.advanceTimersByTime(150);
    stopScheduler(store);
    expect(store.tickCount).toBeGreaterThanOrEqual(2);
  });

  it("stops firing after stopScheduler", () => {
    const store = createSchedulerStore(100);
    const task = jest.fn();
    startScheduler(store, task);
    jest.advanceTimersByTime(100);
    stopScheduler(store);
    jest.advanceTimersByTime(300);
    expect(task).toHaveBeenCalledTimes(1);
  });

  it("does not double-start", () => {
    const store = createSchedulerStore(100);
    const task = jest.fn();
    startScheduler(store, task);
    startScheduler(store, task);
    jest.advanceTimersByTime(100);
    stopScheduler(store);
    expect(task).toHaveBeenCalledTimes(1);
  });
});

describe("getSchedulerStats", () => {
  it("reflects current state", () => {
    const store = createSchedulerStore(100);
    const stats = getSchedulerStats(store);
    expect(stats.running).toBe(false);
    expect(stats.tickCount).toBe(0);
    expect(stats.lastTickAt).toBeNull();
  });
});

describe("createSchedulerIntegration", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("isRunning reflects state", () => {
    const integration = createSchedulerIntegration(100);
    expect(integration.isRunning()).toBe(false);
    integration.start(jest.fn());
    expect(integration.isRunning()).toBe(true);
    integration.stop();
    expect(integration.isRunning()).toBe(false);
  });

  it("stats returns scheduler stats", () => {
    const integration = createSchedulerIntegration(100);
    const task = jest.fn();
    integration.start(task);
    jest.advanceTimersByTime(100);
    integration.stop();
    expect(integration.stats().tickCount).toBeGreaterThanOrEqual(1);
  });
});
