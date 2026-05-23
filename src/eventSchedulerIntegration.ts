/**
 * eventSchedulerIntegration.ts
 * High-level integration wrapper for the event scheduler.
 */

import {
  SchedulerStore,
  createSchedulerStore,
  startScheduler,
  stopScheduler,
  getSchedulerStats,
} from "./eventScheduler";

export interface SchedulerIntegration {
  store: SchedulerStore;
  start: (task: () => void | Promise<void>) => void;
  stop: () => void;
  stats: () => { running: boolean; tickCount: number; lastTickAt: number | null };
  isRunning: () => boolean;
}

export function createSchedulerIntegration(
  intervalMs: number,
  jitterMs = 0
): SchedulerIntegration {
  const store = createSchedulerStore(intervalMs, jitterMs);

  return {
    store,
    start(task) {
      startScheduler(store, task);
    },
    stop() {
      stopScheduler(store);
    },
    stats() {
      return getSchedulerStats(store);
    },
    isRunning() {
      return store.running;
    },
  };
}
