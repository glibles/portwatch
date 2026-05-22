import {
  createAggregatorStore,
  aggregationKey,
  aggregateEvent,
  aggregateEvents,
  flushAggregator,
  pruneAggregator,
  pendingGroupCount,
} from "./eventAggregator";
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

describe("createAggregatorStore", () => {
  it("creates store with default window", () => {
    const store = createAggregatorStore();
    expect(store.windowMs).toBe(5000);
    expect(store.groups.size).toBe(0);
  });

  it("accepts custom window", () => {
    const store = createAggregatorStore(2000);
    expect(store.windowMs).toBe(2000);
  });
});

describe("aggregationKey", () => {
  it("produces stable key from event fields", () => {
    const event = makeEvent({ type: "open", port: 3000, protocol: "tcp" });
    expect(aggregationKey(event)).toBe("open:3000:tcp");
  });
});

describe("aggregateEvent", () => {
  it("creates a new group for first event", () => {
    const store = createAggregatorStore();
    const event = makeEvent();
    aggregateEvent(store, event);
    expect(store.groups.size).toBe(1);
    const group = store.groups.get(aggregationKey(event))!;
    expect(group.count).toBe(1);
    expect(group.events).toHaveLength(1);
  });

  it("merges subsequent events with same key", () => {
    const store = createAggregatorStore();
    const e1 = makeEvent({ timestamp: 1000 });
    const e2 = makeEvent({ timestamp: 2000 });
    aggregateEvent(store, e1);
    aggregateEvent(store, e2);
    expect(store.groups.size).toBe(1);
    const group = store.groups.get(aggregationKey(e1))!;
    expect(group.count).toBe(2);
    expect(group.firstSeen).toBe(1000);
    expect(group.lastSeen).toBe(2000);
  });

  it("creates separate groups for different keys", () => {
    const store = createAggregatorStore();
    aggregateEvent(store, makeEvent({ port: 80 }));
    aggregateEvent(store, makeEvent({ port: 443 }));
    expect(store.groups.size).toBe(2);
  });
});

describe("aggregateEvents", () => {
  it("aggregates a batch of events", () => {
    const store = createAggregatorStore();
    aggregateEvents(store, [
      makeEvent({ port: 80 }),
      makeEvent({ port: 80 }),
      makeEvent({ port: 443 }),
    ]);
    expect(store.groups.size).toBe(2);
  });
});

describe("flushAggregator", () => {
  it("returns groups older than window", () => {
    const store = createAggregatorStore(1000);
    aggregateEvent(store, makeEvent({ timestamp: 1000 }));
    const flushed = flushAggregator(store, 3000);
    expect(flushed).toHaveLength(1);
    expect(store.groups.size).toBe(0);
  });

  it("does not flush recent groups", () => {
    const store = createAggregatorStore(5000);
    aggregateEvent(store, makeEvent({ timestamp: Date.now() }));
    const flushed = flushAggregator(store, Date.now());
    expect(flushed).toHaveLength(0);
    expect(store.groups.size).toBe(1);
  });
});

describe("pruneAggregator", () => {
  it("removes stale groups beyond 2x window", () => {
    const store = createAggregatorStore(1000);
    aggregateEvent(store, makeEvent({ timestamp: 0 }));
    const pruned = pruneAggregator(store, 10000);
    expect(pruned).toBe(1);
    expect(store.groups.size).toBe(0);
  });
});

describe("pendingGroupCount", () => {
  it("returns number of active groups", () => {
    const store = createAggregatorStore();
    expect(pendingGroupCount(store)).toBe(0);
    aggregateEvent(store, makeEvent());
    expect(pendingGroupCount(store)).toBe(1);
  });
});
