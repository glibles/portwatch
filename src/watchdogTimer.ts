/**
 * watchdogTimer.ts
 * Tracks scan cycle health and detects stalled or delayed scans.
 */

export interface WatchdogStore {
  lastTickAt: number | null;
  intervalMs: number;
  missedTicks: number;
  maxMissedTicks: number;
}

export function createWatchdogStore(
  intervalMs: number,
  maxMissedTicks = 3
): WatchdogStore {
  return {
    lastTickAt: null,
    intervalMs,
    missedTicks: 0,
    maxMissedTicks,
  };
}

export function tickWatchdog(store: WatchdogStore, now = Date.now()): void {
  store.lastTickAt = now;
  store.missedTicks = 0;
}

export function checkWatchdog(
  store: WatchdogStore,
  now = Date.now()
): { stalled: boolean; missedTicks: number } {
  if (store.lastTickAt === null) {
    return { stalled: false, missedTicks: 0 };
  }
  const elapsed = now - store.lastTickAt;
  const missed = Math.floor(elapsed / store.intervalMs);
  if (missed > 0) {
    store.missedTicks = missed;
  }
  const stalled = store.missedTicks >= store.maxMissedTicks;
  return { stalled, missedTicks: store.missedTicks };
}

export function resetWatchdog(store: WatchdogStore): void {
  store.lastTickAt = null;
  store.missedTicks = 0;
}

export function isHealthy(store: WatchdogStore, now = Date.now()): boolean {
  const { stalled } = checkWatchdog(store, now);
  return !stalled;
}
