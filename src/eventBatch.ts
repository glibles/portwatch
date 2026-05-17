import { PortEvent } from './changeDetector';

export interface BatchStore {
  queue: PortEvent[];
  lastFlush: number;
  maxSize: number;
  flushIntervalMs: number;
}

export function createBatchStore(
  maxSize = 50,
  flushIntervalMs = 2000
): BatchStore {
  return {
    queue: [],
    lastFlush: Date.now(),
    maxSize,
    flushIntervalMs,
  };
}

export function enqueue(store: BatchStore, event: PortEvent): void {
  store.queue.push(event);
}

export function shouldFlush(store: BatchStore): boolean {
  if (store.queue.length === 0) return false;
  if (store.queue.length >= store.maxSize) return true;
  return Date.now() - store.lastFlush >= store.flushIntervalMs;
}

export function flushBatch(store: BatchStore): PortEvent[] {
  const events = store.queue.splice(0);
  store.lastFlush = Date.now();
  return events;
}

export function pendingCount(store: BatchStore): number {
  return store.queue.length;
}

export function clearBatch(store: BatchStore): void {
  store.queue = [];
  store.lastFlush = Date.now();
}
