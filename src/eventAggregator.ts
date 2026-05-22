import { PortEvent } from "./changeDetector";

export interface AggregatedGroup {
  key: string;
  events: PortEvent[];
  count: number;
  firstSeen: number;
  lastSeen: number;
}

export interface AggregatorStore {
  groups: Map<string, AggregatedGroup>;
  windowMs: number;
}

export function createAggregatorStore(windowMs = 5000): AggregatorStore {
  return { groups: new Map(), windowMs };
}

export function aggregationKey(event: PortEvent): string {
  return `${event.type}:${event.port}:${event.protocol}`;
}

export function aggregateEvent(
  store: AggregatorStore,
  event: PortEvent
): void {
  const key = aggregationKey(event);
  const existing = store.groups.get(key);
  if (existing) {
    existing.events.push(event);
    existing.count += 1;
    existing.lastSeen = event.timestamp;
  } else {
    store.groups.set(key, {
      key,
      events: [event],
      count: 1,
      firstSeen: event.timestamp,
      lastSeen: event.timestamp,
    });
  }
}

export function aggregateEvents(
  store: AggregatorStore,
  events: PortEvent[]
): void {
  for (const event of events) {
    aggregateEvent(store, event);
  }
}

export function flushAggregator(
  store: AggregatorStore,
  now = Date.now()
): AggregatedGroup[] {
  const cutoff = now - store.windowMs;
  const flushed: AggregatedGroup[] = [];
  for (const [key, group] of store.groups) {
    if (group.lastSeen <= cutoff) {
      flushed.push(group);
      store.groups.delete(key);
    }
  }
  return flushed;
}

export function pruneAggregator(
  store: AggregatorStore,
  now = Date.now()
): number {
  const cutoff = now - store.windowMs * 2;
  let pruned = 0;
  for (const [key, group] of store.groups) {
    if (group.lastSeen < cutoff) {
      store.groups.delete(key);
      pruned++;
    }
  }
  return pruned;
}

export function pendingGroupCount(store: AggregatorStore): number {
  return store.groups.size;
}
