import {
  createSchedulerStore,
  startScheduler,
  stopScheduler,
  getSchedulerStats,
} from "./eventScheduler";

export interface SchedulerIntegrationOptions {
  intervalMs: number;
  jitterMs?: number;
  maxDrift?: number;
}

export interface SchedulerIntegration {
  start: (callback: () => void) => void;
  stop: () => void;
  isRunning: () => boolean;
  getStats: () => { ticks: number; lastTickAt: number | null };
}

export function createSchedulerIntegration(
  options: SchedulerIntegrationOptions
): SchedulerIntegration {
  const store = createSchedulerStore({
    intervalMs: options.intervalMs,
    jitterMs: options.jitterMs ?? 0,
    maxDrift: options.maxDrift ?? 0,
  });

  function start(callback: () => void): void {
    if (store.running) {
      return;
    }
    startScheduler(store, callback);
  }

  function stop(): void {
    stopScheduler(store);
  }

  function isRunning(): boolean {
    return store.running;
  }

  function getStats(): { ticks: number; lastTickAt: number | null } {
    const raw = getSchedulerStats(store);
    return {
      ticks: raw.ticks,
      lastTickAt: raw.lastTickAt,
    };
  }

  return { start, stop, isRunning, getStats };
}
