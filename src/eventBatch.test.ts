import {
  createBatchStore,
  enqueue,
  shouldFlush,
  flushBatch,
  pendingCount,
  clearBatch,
} from './eventBatch';
import { PortEvent } from './changeDetector';

function makeEvent(port: number): PortEvent {
  return {
    type: 'open',
    port,
    protocol: 'tcp',
    pid: 1234,
    process: 'node',
    timestamp: Date.now(),
  };
}

describe('createBatchStore', () => {
  it('initializes with empty queue and defaults', () => {
    const store = createBatchStore();
    expect(store.queue).toEqual([]);
    expect(store.maxSize).toBe(50);
    expect(store.flushIntervalMs).toBe(2000);
  });

  it('accepts custom maxSize and interval', () => {
    const store = createBatchStore(10, 500);
    expect(store.maxSize).toBe(10);
    expect(store.flushIntervalMs).toBe(500);
  });
});

describe('enqueue', () => {
  it('adds events to the queue', () => {
    const store = createBatchStore();
    enqueue(store, makeEvent(8080));
    expect(store.queue).toHaveLength(1);
    expect(store.queue[0].port).toBe(8080);
  });
});

describe('shouldFlush', () => {
  it('returns false when queue is empty', () => {
    const store = createBatchStore();
    expect(shouldFlush(store)).toBe(false);
  });

  it('returns true when queue reaches maxSize', () => {
    const store = createBatchStore(2);
    enqueue(store, makeEvent(80));
    enqueue(store, makeEvent(443));
    expect(shouldFlush(store)).toBe(true);
  });

  it('returns true when flush interval has elapsed', () => {
    const store = createBatchStore(50, 0);
    enqueue(store, makeEvent(3000));
    store.lastFlush = Date.now() - 100;
    expect(shouldFlush(store)).toBe(true);
  });
});

describe('flushBatch', () => {
  it('returns all queued events and clears queue', () => {
    const store = createBatchStore();
    enqueue(store, makeEvent(80));
    enqueue(store, makeEvent(443));
    const events = flushBatch(store);
    expect(events).toHaveLength(2);
    expect(store.queue).toHaveLength(0);
  });

  it('updates lastFlush timestamp', () => {
    const store = createBatchStore();
    store.lastFlush = 0;
    enqueue(store, makeEvent(80));
    flushBatch(store);
    expect(store.lastFlush).toBeGreaterThan(0);
  });
});

describe('pendingCount', () => {
  it('returns the number of queued events', () => {
    const store = createBatchStore();
    expect(pendingCount(store)).toBe(0);
    enqueue(store, makeEvent(80));
    expect(pendingCount(store)).toBe(1);
  });
});

describe('clearBatch', () => {
  it('removes all events from the queue', () => {
    const store = createBatchStore();
    enqueue(store, makeEvent(80));
    clearBatch(store);
    expect(store.queue).toHaveLength(0);
  });
});
