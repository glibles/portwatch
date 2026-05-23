/**
 * eventScheduler.ts
 * Schedules periodic tasks (e.g. scans, flushes) with jitter and backoff support.
 */

export interface SchedulerStore {
  intervalMs: number;
  jitterMs: number;
  timerId: ReturnType<typeof setTimeout> | null;
  running: boolean;
  tickCount: number;
  lastTickAt: number | null;
}

export function createSchedulerStore(
  intervalMs: number,
  jitterMs = 0
): SchedulerStore {
  return {
    intervalMs,
    jitterMs,
    timerId: null,
    running: false,
    tickCount: 0,
    lastTickAt: null,
  };
}

export function calcNextDelay(store: SchedulerStore): number {
  const jitter = store.jitterMs > 0
    ? Math.floor(Math.random() * store.jitterMs)
    : 0;
  return store.intervalMs + jitter;
}

export function startScheduler(
  store: SchedulerStore,
  task: () => void | Promise<void>
): void {
  if (store.running) return;
  store.running = true;

  const schedule = () => {
    const delay = calcNextDelay(store);
    store.timerId = setTimeout(async () => {
      if (!store.running) return;
      store.tickCount += 1;
      store.lastTickAt = Date.now();
      try {
        await task();
      } catch (_) {
        // swallow task errors; caller responsible for handling
      }
      if (store.running) schedule();
    }, delay);
  };

  schedule();
}

export function stopScheduler(store: SchedulerStore): void {
  store.running = false;
  if (store.timerId !== null) {
    clearTimeout(store.timerId);
    store.timerId = null;
  }
}

export function getSchedulerStats(store: SchedulerStore): {
  running: boolean;
  tickCount: number;
  lastTickAt: number | null;
} {
  return {
    running: store.running,
    tickCount: store.tickCount,
    lastTickAt: store.lastTickAt,
  };
}
