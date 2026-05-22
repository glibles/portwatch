import { PortEvent } from './changeDetector';

export type Priority = 'high' | 'normal' | 'low';

export interface PrioritizedEvent {
  event: PortEvent;
  priority: Priority;
  enqueuedAt: number;
}

export interface PriorityQueueStore {
  high: PrioritizedEvent[];
  normal: PrioritizedEvent[];
  low: PrioritizedEvent[];
}

const PRIORITY_ORDER: Priority[] = ['high', 'normal', 'low'];

export function createPriorityQueue(): PriorityQueueStore {
  return { high: [], normal: [], low: [] };
}

export function assignPriority(event: PortEvent): Priority {
  if (event.type === 'closed') return 'high';
  if (event.type === 'opened') return 'normal';
  return 'low';
}

export function enqueueEvent(
  store: PriorityQueueStore,
  event: PortEvent,
  priority?: Priority
): void {
  const p = priority ?? assignPriority(event);
  store[p].push({ event, priority: p, enqueuedAt: Date.now() });
}

export function dequeueEvent(
  store: PriorityQueueStore
): PrioritizedEvent | undefined {
  for (const p of PRIORITY_ORDER) {
    if (store[p].length > 0) {
      return store[p].shift();
    }
  }
  return undefined;
}

export function drainQueue(
  store: PriorityQueueStore,
  limit?: number
): PrioritizedEvent[] {
  const results: PrioritizedEvent[] = [];
  const max = limit ?? Infinity;
  while (results.length < max) {
    const item = dequeueEvent(store);
    if (!item) break;
    results.push(item);
  }
  return results;
}

export function queueSize(store: PriorityQueueStore): number {
  return store.high.length + store.normal.length + store.low.length;
}

export function clearQueue(store: PriorityQueueStore): void {
  store.high = [];
  store.normal = [];
  store.low = [];
}
