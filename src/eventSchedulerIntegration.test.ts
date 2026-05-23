import { createSchedulerIntegration } from "./eventSchedulerIntegration";

describe("createSchedulerIntegration", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should create integration with default options", () => {
    const integration = createSchedulerIntegration({ intervalMs: 100 });
    expect(integration).toBeDefined();
    expect(typeof integration.start).toBe("function");
    expect(typeof integration.stop).toBe("function");
    expect(typeof integration.getStats).toBe("function");
    expect(typeof integration.isRunning).toBe("function");
  });

  it("should not be running before start", () => {
    const integration = createSchedulerIntegration({ intervalMs: 100 });
    expect(integration.isRunning()).toBe(false);
  });

  it("should be running after start", () => {
    const cb = jest.fn();
    const integration = createSchedulerIntegration({ intervalMs: 100 });
    integration.start(cb);
    expect(integration.isRunning()).toBe(true);
    integration.stop();
  });

  it("should invoke callback on tick", () => {
    const cb = jest.fn();
    const integration = createSchedulerIntegration({ intervalMs: 100 });
    integration.start(cb);
    jest.advanceTimersByTime(100);
    expect(cb).toHaveBeenCalledTimes(1);
    integration.stop();
  });

  it("should invoke callback multiple times", () => {
    const cb = jest.fn();
    const integration = createSchedulerIntegration({ intervalMs: 50 });
    integration.start(cb);
    jest.advanceTimersByTime(200);
    expect(cb.mock.calls.length).toBeGreaterThanOrEqual(3);
    integration.stop();
  });

  it("should stop invoking callback after stop", () => {
    const cb = jest.fn();
    const integration = createSchedulerIntegration({ intervalMs: 100 });
    integration.start(cb);
    jest.advanceTimersByTime(100);
    integration.stop();
    jest.advanceTimersByTime(300);
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it("should not be running after stop", () => {
    const cb = jest.fn();
    const integration = createSchedulerIntegration({ intervalMs: 100 });
    integration.start(cb);
    integration.stop();
    expect(integration.isRunning()).toBe(false);
  });

  it("should track tick count in stats", () => {
    const cb = jest.fn();
    const integration = createSchedulerIntegration({ intervalMs: 100 });
    integration.start(cb);
    jest.advanceTimersByTime(300);
    const stats = integration.getStats();
    expect(stats.ticks).toBeGreaterThanOrEqual(2);
    integration.stop();
  });

  it("should reset tick count between runs", () => {
    const cb = jest.fn();
    const integration = createSchedulerIntegration({ intervalMs: 100 });
    integration.start(cb);
    jest.advanceTimersByTime(300);
    integration.stop();
    integration.start(cb);
    jest.advanceTimersByTime(100);
    const stats = integration.getStats();
    expect(stats.ticks).toBe(1);
    integration.stop();
  });

  it("should allow restart after stop", () => {
    const cb = jest.fn();
    const integration = createSchedulerIntegration({ intervalMs: 100 });
    integration.start(cb);
    jest.advanceTimersByTime(100);
    integration.stop();
    integration.start(cb);
    jest.advanceTimersByTime(100);
    expect(cb).toHaveBeenCalledTimes(2);
    integration.stop();
  });
});
