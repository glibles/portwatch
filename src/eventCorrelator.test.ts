import {
  createCorrelatorStore,
  correlateEvent,
  correlateEvents,
  pruneCorrelator,
  getGroup,
  correlationKey,
} from "./eventCorrelator";
import { PortEvent } from "./changeDetector";

function makeEvent(overrides: Partial<PortEvent> = {}): PortEvent {
  return {
    type: "open",
    port: 3000,
    pid: 42,
    process: "node",
    protocol: "tcp",
    timestamp: Date.now(),
    ...overrides,
  } as PortEvent;
}

describe("createCorrelatorStore", () => {
  it("creates store with default window", () => {
    const store = createCorrelatorStore();
    expect(store.windowMs).toBe(5000);
    expect(store.groups.size).toBe(0);
  });

  it("accepts custom window", () => {
    const store = createCorrelatorStore(10000);
    expect(store.windowMs).toBe(10000);
  });
});

describe("correlationKey", () => {
  it("returns pid:protocol string", () => {
    const event = makeEvent({ pid: 99, protocol: "udp" });
    expect(correlationKey(event)).toBe("99:udp");
  });
});

describe("correlateEvent", () => {
  it("creates a new group for unseen key", () => {
    const store = createCorrelatorStore();
    const event = makeEvent();
    const group = correlateEvent(store, event);
    expect(group.events).toHaveLength(1);
    expect(group.key).toBe("42:tcp");
  });

  it("appends to existing group for same key", () => {
    const store = createCorrelatorStore();
    const e1 = makeEvent({ port: 3000 });
    const e2 = makeEvent({ port: 3001 });
    correlateEvent(store, e1);
    const group = correlateEvent(store, e2);
    expect(group.events).toHaveLength(2);
  });

  it("updates lastSeen on each event", () => {
    const store = createCorrelatorStore();
    const e1 = makeEvent({ timestamp: 1000 });
    const e2 = makeEvent({ timestamp: 2000 });
    correlateEvent(store, e1);
    const group = correlateEvent(store, e2);
    expect(group.firstSeen).toBe(1000);
    expect(group.lastSeen).toBe(2000);
  });
});

describe("correlateEvents", () => {
  it("returns touched groups", () => {
    const store = createCorrelatorStore();
    const events = [
      makeEvent({ pid: 1, protocol: "tcp" }),
      makeEvent({ pid: 2, protocol: "udp" }),
      makeEvent({ pid: 1, protocol: "tcp", port: 8080 }),
    ];
    const groups = correlateEvents(store, events);
    expect(groups).toHaveLength(2);
  });
});

describe("pruneCorrelator", () => {
  it("removes stale groups", () => {
    const store = createCorrelatorStore(1000);
    correlateEvent(store, makeEvent({ timestamp: 1000 }));
    const pruned = pruneCorrelator(store, 3000);
    expect(pruned).toBe(1);
    expect(store.groups.size).toBe(0);
  });

  it("keeps fresh groups", () => {
    const store = createCorrelatorStore(5000);
    const now = Date.now();
    correlateEvent(store, makeEvent({ timestamp: now }));
    const pruned = pruneCorrelator(store, now + 100);
    expect(pruned).toBe(0);
    expect(store.groups.size).toBe(1);
  });
});

describe("getGroup", () => {
  it("retrieves group by event key", () => {
    const store = createCorrelatorStore();
    const event = makeEvent();
    correlateEvent(store, event);
    const group = getGroup(store, event);
    expect(group).toBeDefined();
    expect(group!.events[0]).toBe(event);
  });

  it("returns undefined for unknown key", () => {
    const store = createCorrelatorStore();
    expect(getGroup(store, makeEvent())).toBeUndefined();
  });
});
