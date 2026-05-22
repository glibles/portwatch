/**
 * eventReplayBuffer.ts
 * Maintains a bounded circular buffer of recent events for replay/recovery.
 */

import { PortEvent } from './changeDetector';

export interface ReplayBuffer {
  buffer: PortEvent[];
  maxSize: number;
  cursor: number;
  total: number;
}

export function createReplayBuffer(maxSize: number = 100): ReplayBuffer {
  return { buffer: new Array(maxSize), maxSize, cursor: 0, total: 0 };
}

export function pushEvent(store: ReplayBuffer, event: PortEvent): void {
  store.buffer[store.cursor % store.maxSize] = event;
  store.cursor++;
  store.total++;
}

export function replayEvents(store: ReplayBuffer): PortEvent[] {
  const count = Math.min(store.total, store.maxSize);
  if (count === 0) return [];

  const result: PortEvent[] = [];
  const start = store.total > store.maxSize
    ? store.cursor % store.maxSize
    : 0;

  for (let i = 0; i < count; i++) {
    const idx = (start + i) % store.maxSize;
    const ev = store.buffer[idx];
    if (ev !== undefined) result.push(ev);
  }
  return result;
}

export function replaySince(store: ReplayBuffer, since: number): PortEvent[] {
  return replayEvents(store).filter(e => e.timestamp >= since);
}

export function clearReplayBuffer(store: ReplayBuffer): void {
  store.buffer = new Array(store.maxSize);
  store.cursor = 0;
  store.total = 0;
}

export function bufferSize(store: ReplayBuffer): number {
  return Math.min(store.total, store.maxSize);
}
