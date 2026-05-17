/**
 * eventDeduplicator.ts
 * Deduplicates port events within a configurable time window to avoid
 * redundant notifications for rapidly toggling ports.
 */

import { PortEvent } from './changeDetector';

export interface DeduplicatorStore {
  seen: Map<string, number>;
  windowMs: number;
}

export function createDeduplicatorStore(windowMs = 2000): DeduplicatorStore {
  return { seen: new Map(), windowMs };
}

export function dedupeKey(event: PortEvent): string {
  return `${event.protocol}:${event.port}:${event.pid}:${event.type}`;
}

export function isDuplicate(
  store: DeduplicatorStore,
  event: PortEvent,
  now = Date.now()
): boolean {
  const key = dedupeKey(event);
  const last = store.seen.get(key);
  if (last !== undefined && now - last < store.windowMs) {
    return true;
  }
  store.seen.set(key, now);
  return false;
}

export function deduplicateEvents(
  store: DeduplicatorStore,
  events: PortEvent[],
  now = Date.now()
): PortEvent[] {
  return events.filter((e) => !isDuplicate(store, e, now));
}

export function pruneDeduplicatorStore(
  store: DeduplicatorStore,
  now = Date.now()
): void {
  for (const [key, ts] of store.seen.entries()) {
    if (now - ts >= store.windowMs) {
      store.seen.delete(key);
    }
  }
}

export function resetDeduplicatorStore(store: DeduplicatorStore): void {
  store.seen.clear();
}
