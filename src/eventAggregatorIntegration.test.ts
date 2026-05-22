import {
  createAggregatorIntegration,
  ingestEvents,
  collectFlushed,
  pendingCount,
  shutdownAggregatorIntegration,
} from "./eventAggregatorIntegration";
import { PortEvent } from "./changeDetector";

function makeEvent(overrides: Partial<PortEvent> = {}): PortEvent {
  return {
    type: "open",
    port: 8080,
    protocol: "tcp",
    pid: 1234,
    process: "node",
    timestamp: Date.now(),
    ...overrides,
  };
}

describe("createAggregatorIntegration", () => {
  it("creates integration with store and timer", () => {
    const integration = createAggregatorIntegration(1000, 60000);
    expect(integration.store).toBeDefined();
    expect(integration.pruneTimer).not.toBeNull();
    shutdownAggregatorIntegration(integration);
  });
});

describe("ingestEvents", () => {
  it("adds events to the store", () => {
    const integration = createAggregatorIntegration(5000, 60000);
    ingestEvents(integration, [makeEvent({ port: 80 }), makeEvent({ port: 443 })]);
    expect(pendingCount(integration)).toBe(2);
    shutdownAggregatorIntegration(integration);
  });

  it("handles empty array gracefully", () => {
    const integration = createAggregatorIntegration();
    ingestEvents(integration, []);
    expect(pendingCount(integration)).toBe(0);
    shutdownAggregatorIntegration(integration);
  });
});

describe("collectFlushed", () => {
  it("flushes groups older than window", () => {
    const integration = createAggregatorIntegration(1000, 60000);
    ingestEvents(integration, [makeEvent({ timestamp: 100 })]);
    const groups = collectFlushed(integration, 5000);
    expect(groups).toHaveLength(1);
    expect(pendingCount(integration)).toBe(0);
    shutdownAggregatorIntegration(integration);
  });

  it("does not flush recent events", () => {
    const now = Date.now();
    const integration = createAggregatorIntegration(10000, 60000);
    ingestEvents(integration, [makeEvent({ timestamp: now })]);
    const groups = collectFlushed(integration, now);
    expect(groups).toHaveLength(0);
    expect(pendingCount(integration)).toBe(1);
    shutdownAggregatorIntegration(integration);
  });
});

describe("pendingCount", () => {
  it("reflects current number of groups", () => {
    const integration = createAggregatorIntegration();
    expect(pendingCount(integration)).toBe(0);
    ingestEvents(integration, [makeEvent({ port: 9000 })]);
    expect(pendingCount(integration)).toBe(1);
    shutdownAggregatorIntegration(integration);
  });
});

describe("shutdownAggregatorIntegration", () => {
  it("clears the prune timer", () => {
    const integration = createAggregatorIntegration(1000, 60000);
    shutdownAggregatorIntegration(integration);
    expect(integration.pruneTimer).toBeNull();
  });

  it("flushes all remaining groups on shutdown", () => {
    const integration = createAggregatorIntegration(5000, 60000);
    ingestEvents(integration, [
      makeEvent({ port: 80, timestamp: Date.now() }),
      makeEvent({ port: 443, timestamp: Date.now() }),
    ]);
    const flushed = shutdownAggregatorIntegration(integration);
    expect(flushed).toHaveLength(2);
  });

  it("is safe to call twice", () => {
    const integration = createAggregatorIntegration();
    shutdownAggregatorIntegration(integration);
    expect(() => shutdownAggregatorIntegration(integration)).not.toThrow();
  });
});
