import {
  createTagStore,
  addTagRule,
  removeTagRule,
  tagEvent,
  tagEvents,
  hasTag,
  filterByTag,
} from "./eventTagging";

const makeEvent = (port: number, protocol = "tcp", process?: string) => ({
  port,
  protocol,
  process,
  type: "open" as const,
  timestamp: Date.now(),
});

describe("createTagStore", () => {
  it("creates an empty store", () => {
    const store = createTagStore();
    expect(store.rules).toHaveLength(0);
  });
});

describe("addTagRule / removeTagRule", () => {
  it("adds a rule to the store", () => {
    const store = createTagStore();
    addTagRule(store, { tag: "web", match: (e) => e.port === 80 });
    expect(store.rules).toHaveLength(1);
  });

  it("removes rules by tag name", () => {
    const store = createTagStore();
    addTagRule(store, { tag: "web", match: (e) => e.port === 80 });
    addTagRule(store, { tag: "db", match: (e) => e.port === 5432 });
    removeTagRule(store, "web");
    expect(store.rules).toHaveLength(1);
    expect(store.rules[0].tag).toBe("db");
  });
});

describe("tagEvent", () => {
  it("applies matching tags to an event", () => {
    const store = createTagStore();
    addTagRule(store, { tag: "web", match: (e) => e.port === 80 });
    addTagRule(store, { tag: "http", match: (e) => e.protocol === "tcp" });
    const result = tagEvent(store, makeEvent(80));
    expect(result.tags).toContain("web");
    expect(result.tags).toContain("http");
  });

  it("returns empty tags when no rules match", () => {
    const store = createTagStore();
    addTagRule(store, { tag: "db", match: (e) => e.port === 5432 });
    const result = tagEvent(store, makeEvent(80));
    expect(result.tags).toHaveLength(0);
  });

  it("does not mutate the original event", () => {
    const store = createTagStore();
    addTagRule(store, { tag: "web", match: (e) => e.port === 80 });
    const event = makeEvent(80);
    tagEvent(store, event);
    expect((event as any).tags).toBeUndefined();
  });
});

describe("tagEvents", () => {
  it("tags all events in the array", () => {
    const store = createTagStore();
    addTagRule(store, { tag: "privileged", match: (e) => e.port < 1024 });
    const events = [makeEvent(80), makeEvent(443), makeEvent(3000)];
    const tagged = tagEvents(store, events);
    expect(tagged[0].tags).toContain("privileged");
    expect(tagged[1].tags).toContain("privileged");
    expect(tagged[2].tags).not.toContain("privileged");
  });
});

describe("hasTag", () => {
  it("returns true when tag is present", () => {
    expect(hasTag({ tags: ["web", "http"] }, "web")).toBe(true);
  });

  it("returns false when tag is absent", () => {
    expect(hasTag({ tags: ["web"] }, "db")).toBe(false);
  });

  it("returns false when tags is undefined", () => {
    expect(hasTag({}, "web")).toBe(false);
  });
});

describe("filterByTag", () => {
  it("filters events that have the given tag", () => {
    const events = [
      { port: 80, tags: ["web"] },
      { port: 5432, tags: ["db"] },
      { port: 443, tags: ["web", "tls"] },
    ];
    const result = filterByTag(events, "web");
    expect(result).toHaveLength(2);
    expect(result.map((e) => e.port)).toEqual([80, 443]);
  });
});
