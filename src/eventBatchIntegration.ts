import { PortEvent } from './changeDetector';
import {
  BatchStore,
  createBatchStore,
  enqueue,
  shouldFlush,
  flushBatch,
  clearBatch,
} from './eventBatch';

export interface BatchIntegration {
  store: BatchStore;
  timer: ReturnType<typeof setInterval> | null;
}

export type FlushCallback = (events: PortEvent[]) => void;

export function createBatchIntegration(
  onFlush: FlushCallback,
  maxSize = 50,
  flushIntervalMs = 2000
): BatchIntegration {
  const store = createBatchStore(maxSize, flushIntervalMs);
  const timer = setInterval(() => {
    if (shouldFlush(store)) {
      const events = flushBatch(store);
      onFlush(events);
    }
  }, Math.min(flushIntervalMs, 500));

  return { store, timer };
}

export function addEventToBatch(
  integration: BatchIntegration,
  event: PortEvent,
  onFlush: FlushCallback
): void {
  enqueue(integration.store, event);
  if (shouldFlush(integration.store)) {
    const events = flushBatch(integration.store);
    onFlush(events);
  }
}

export function shutdownBatchIntegration(
  integration: BatchIntegration,
  onFlush: FlushCallback
): void {
  if (integration.timer !== null) {
    clearInterval(integration.timer);
    integration.timer = null;
  }
  const remaining = flushBatch(integration.store);
  if (remaining.length > 0) {
    onFlush(remaining);
  }
  clearBatch(integration.store);
}
