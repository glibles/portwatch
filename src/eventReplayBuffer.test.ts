import {
  createReplayBuffer,
  pushEvent,
  replayEvents,
  replaySince,
  clearReplayBuffer,
  bufferSize,
} from './eventReplayBuffer';
import { PortEvent } from './changeDetector';

function makeEvent(port: number, ts: number): PortEvent {
  return {
    type: 'opened',
    port,
    protocol: 'tcp',
    pid: 1000 + port,
    process: 'test',
    timestamp: ts,
  } as unknown as PortEvent;
}

describe('createReplayBuffer', () => {
  it('creates an empty buffer with given maxSize', () => {
    const store = createReplayBuffer(10);
    expect(store.maxSize).toBe(10);
    expect(bufferSize(store)).toBe(0);
  });

  it('defaults to maxSize 100', () => {
    const store = createReplayBuffer();
    expect(store.maxSize).toBe(100);
  });
});

describe('pushEvent / replayEvents', () => {
  it('returns events in insertion order', () => {
    const store = createReplayBuffer(5);
    pushEvent(store, makeEvent(80, 1000));
    pushEvent(store, makeEvent(443, 2000));
    const events = replayEvents(store);
    expect(events).toHaveLength(2);
    expect(events[0].port).toBe(80);
    expect(events[1].port).toBe(443);
  });

  it('overwrites oldest events when buffer is full', () => {
    const store = createReplayBuffer(3);
    pushEvent(store, makeEvent(1, 100));
    pushEvent(store, makeEvent(2, 200));
    pushEvent(store, makeEvent(3, 300));
    pushEvent(store, makeEvent(4, 400)); // evicts port 1
    const events = replayEvents(store);
    expect(events).toHaveLength(3);
    const ports = events.map(e => e.port);
    expect(ports).toContain(2);
    expect(ports).toContain(3);
    expect(ports).toContain(4);
    expect(ports).not.toContain(1);
  });
});

describe('replaySince', () => {
  it('filters events by timestamp', () => {
    const store = createReplayBuffer(10);
    pushEvent(store, makeEvent(80, 1000));
    pushEvent(store, makeEvent(443, 2000));
    pushEvent(store, makeEvent(8080, 3000));
    const events = replaySince(store, 2000);
    expect(events).toHaveLength(2);
    expect(events.map(e => e.port)).toEqual([443, 8080]);
  });

  it('returns empty array when no events match', () => {
    const store = createReplayBuffer(5);
    pushEvent(store, makeEvent(80, 500));
    expect(replaySince(store, 9999)).toHaveLength(0);
  });
});

describe('clearReplayBuffer', () => {
  it('resets the buffer to empty', () => {
    const store = createReplayBuffer(5);
    pushEvent(store, makeEvent(80, 1000));
    clearReplayBuffer(store);
    expect(bufferSize(store)).toBe(0);
    expect(replayEvents(store)).toHaveLength(0);
  });
});

describe('bufferSize', () => {
  it('reports correct size up to maxSize', () => {
    const store = createReplayBuffer(3);
    expect(bufferSize(store)).toBe(0);
    pushEvent(store, makeEvent(1, 1));
    expect(bufferSize(store)).toBe(1);
    pushEvent(store, makeEvent(2, 2));
    pushEvent(store, makeEvent(3, 3));
    pushEvent(store, makeEvent(4, 4));
    expect(bufferSize(store)).toBe(3);
  });
});
