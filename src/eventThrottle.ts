/**
 * eventThrottle.ts
 * Suppresses duplicate or high-frequency events within a sliding window.
 */

export interface ThrottleStore {
  windowMs: number;
  maxPerWindow: number;
  counts: Map<string, { count: number; windowStart: number }>;
}

export function createThrottleStore(
  windowMs = 5000,
  maxPerWindow = 3
): ThrottleStore {
  return { windowMs, maxPerWindow, counts: new Map() };
}

export function throttleKey(port: number, pid: number, type: string): string {
  return `${port}:${pid}:${type}`;
}

export function shouldThrottle(
  store: ThrottleStore,
  key: string,
  now = Date.now()
): boolean {
  const entry = store.counts.get(key);
  if (!entry) {
    store.counts.set(key, { count: 1, windowStart: now });
    return false;
  }

  const elapsed = now - entry.windowStart;
  if (elapsed > store.windowMs) {
    store.counts.set(key, { count: 1, windowStart: now });
    return false;
  }

  entry.count += 1;
  if (entry.count > store.maxPerWindow) {
    return true;
  }
  return false;
}

export function resetThrottleKey(store: ThrottleStore, key: string): void {
  store.counts.delete(key);
}

export function pruneThrottleStore(
  store: ThrottleStore,
  now = Date.now()
): number {
  let pruned = 0;
  for (const [key, entry] of store.counts.entries()) {
    if (now - entry.windowStart > store.windowMs) {
      store.counts.delete(key);
      pruned++;
    }
  }
  return pruned;
}
