/**
 * eventCorrelator.ts
 * Groups related port events into correlated sequences by process or port.
 */

import { PortEvent } from "./changeDetector";

export interface CorrelationGroup {
  key: string;
  events: PortEvent[];
  firstSeen: number;
  lastSeen: number;
}

export interface CorrelatorStore {
  groups: Map<string, CorrelationGroup>;
  windowMs: number;
}

export function createCorrelatorStore(windowMs = 5000): CorrelatorStore {
  return { groups: new Map(), windowMs };
}

export function correlationKey(event: PortEvent): string {
  return `${event.pid}:${event.protocol}`;
}

export function correlateEvent(
  store: CorrelatorStore,
  event: PortEvent
): CorrelationGroup {
  const key = correlationKey(event);
  const now = event.timestamp ?? Date.now();
  const existing = store.groups.get(key);

  if (existing) {
    existing.events.push(event);
    existing.lastSeen = now;
    return existing;
  }

  const group: CorrelationGroup = {
    key,
    events: [event],
    firstSeen: now,
    lastSeen: now,
  };
  store.groups.set(key, group);
  return group;
}

export function correlateEvents(
  store: CorrelatorStore,
  events: PortEvent[]
): CorrelationGroup[] {
  const touched = new Set<string>();
  for (const event of events) {
    correlateEvent(store, event);
    touched.add(correlationKey(event));
  }
  return Array.from(touched).map((k) => store.groups.get(k)!);
}

export function pruneCorrelator(store: CorrelatorStore, now = Date.now()): number {
  let pruned = 0;
  for (const [key, group] of store.groups) {
    if (now - group.lastSeen > store.windowMs) {
      store.groups.delete(key);
      pruned++;
    }
  }
  return pruned;
}

export function getGroup(
  store: CorrelatorStore,
  event: PortEvent
): CorrelationGroup | undefined {
  return store.groups.get(correlationKey(event));
}
