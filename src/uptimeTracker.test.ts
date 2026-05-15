import {
  createUptimeStore,
  recordOpen,
  recordClose,
  tickUptime,
  getUptime,
  uptimeKey,
} from './uptimeTracker';
import { PortEvent } from './changeDetector';

const makeEvent = (port: number, pid: number, type: 'open' | 'close' = 'open'): PortEvent => ({
  type,
  port,
  protocol: 'tcp',
  pid,
  process: 'node',
  timestamp: Date.now(),
});

describe('uptimeKey', () => {
  it('produces a deterministic key', () => {
    expect(uptimeKey(3000, 'tcp', 42)).toBe('tcp:3000:42');
  });
});

describe('recordOpen', () => {
  it('adds a new entry to the store', () => {
    const store = createUptimeStore();
    recordOpen(store, makeEvent(3000, 1), 1000);
    expect(store.size).toBe(1);
    const entry = getUptime(store)[0];
    expect(entry.port).toBe(3000);
    expect(entry.firstSeen).toBe(1000);
    expect(entry.durationMs).toBe(0);
  });

  it('does not overwrite an existing entry', () => {
    const store = createUptimeStore();
    recordOpen(store, makeEvent(3000, 1), 1000);
    recordOpen(store, makeEvent(3000, 1), 2000);
    expect(getUptime(store)[0].firstSeen).toBe(1000);
  });
});

describe('recordClose', () => {
  it('returns undefined for unknown key', () => {
    const store = createUptimeStore();
    const result = recordClose(store, makeEvent(3000, 1, 'close'), 2000);
    expect(result).toBeUndefined();
  });

  it('removes entry and returns final uptime', () => {
    const store = createUptimeStore();
    recordOpen(store, makeEvent(3000, 1), 1000);
    const entry = recordClose(store, makeEvent(3000, 1, 'close'), 3000);
    expect(store.size).toBe(0);
    expect(entry?.durationMs).toBe(2000);
    expect(entry?.lastSeen).toBe(3000);
  });
});

describe('tickUptime', () => {
  it('updates durationMs for all active entries', () => {
    const store = createUptimeStore();
    recordOpen(store, makeEvent(3000, 1), 1000);
    recordOpen(store, makeEvent(4000, 2), 1000);
    tickUptime(store, 5000);
    for (const entry of getUptime(store)) {
      expect(entry.durationMs).toBe(4000);
      expect(entry.lastSeen).toBe(5000);
    }
  });
});

describe('getUptime', () => {
  it('returns empty array for empty store', () => {
    expect(getUptime(createUptimeStore())).toEqual([]);
  });

  it('returns all active entries', () => {
    const store = createUptimeStore();
    recordOpen(store, makeEvent(3000, 1), 1000);
    recordOpen(store, makeEvent(4000, 2), 1000);
    expect(getUptime(store)).toHaveLength(2);
  });
});
