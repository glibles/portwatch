import {
  createDeduplicatorStore,
  dedupeKey,
  isDuplicate,
  deduplicateEvents,
  pruneDeduplicatorStore,
  resetDeduplicatorStore,
} from './eventDeduplicator';
import { PortEvent } from './changeDetector';

const makeEvent = (port: number, type: 'open' | 'close' | 'change' = 'open'): PortEvent => ({
  type,
  port,
  protocol: 'tcp',
  pid: 1234,
  process: 'node',
  timestamp: Date.now(),
});

describe('dedupeKey', () => {
  it('produces a stable string key', () => {
    const e = makeEvent(3000);
    expect(dedupeKey(e)).toBe('tcp:3000:1234:open');
  });
});

describe('isDuplicate', () => {
  it('returns false on first occurrence', () => {
    const store = createDeduplicatorStore(1000);
    expect(isDuplicate(store, makeEvent(3000), 0)).toBe(false);
  });

  it('returns true within window', () => {
    const store = createDeduplicatorStore(1000);
    isDuplicate(store, makeEvent(3000), 0);
    expect(isDuplicate(store, makeEvent(3000), 500)).toBe(true);
  });

  it('returns false after window expires', () => {
    const store = createDeduplicatorStore(1000);
    isDuplicate(store, makeEvent(3000), 0);
    expect(isDuplicate(store, makeEvent(3000), 1001)).toBe(false);
  });

  it('treats different types as different keys', () => {
    const store = createDeduplicatorStore(1000);
    isDuplicate(store, makeEvent(3000, 'open'), 0);
    expect(isDuplicate(store, makeEvent(3000, 'close'), 0)).toBe(false);
  });
});

describe('deduplicateEvents', () => {
  it('filters duplicate events in the same batch', () => {
    const store = createDeduplicatorStore(1000);
    const events = [makeEvent(3000), makeEvent(3000), makeEvent(4000)];
    const result = deduplicateEvents(store, events, 0);
    expect(result).toHaveLength(2);
  });

  it('returns all events when none are duplicates', () => {
    const store = createDeduplicatorStore(1000);
    const events = [makeEvent(3000), makeEvent(4000), makeEvent(5000)];
    expect(deduplicateEvents(store, events, 0)).toHaveLength(3);
  });
});

describe('pruneDeduplicatorStore', () => {
  it('removes expired entries', () => {
    const store = createDeduplicatorStore(500);
    isDuplicate(store, makeEvent(3000), 0);
    pruneDeduplicatorStore(store, 600);
    expect(store.seen.size).toBe(0);
  });

  it('keeps entries still within window', () => {
    const store = createDeduplicatorStore(1000);
    isDuplicate(store, makeEvent(3000), 0);
    pruneDeduplicatorStore(store, 400);
    expect(store.seen.size).toBe(1);
  });
});

describe('resetDeduplicatorStore', () => {
  it('clears all entries', () => {
    const store = createDeduplicatorStore(1000);
    isDuplicate(store, makeEvent(3000), 0);
    resetDeduplicatorStore(store);
    expect(store.seen.size).toBe(0);
  });
});
