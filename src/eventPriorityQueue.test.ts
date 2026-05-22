import {
  createPriorityQueue,
  assignPriority,
  enqueueEvent,
  dequeueEvent,
  drainQueue,
  queueSize,
  clearQueue,
} from './eventPriorityQueue';
import { PortEvent } from './changeDetector';

function makeEvent(type: PortEvent['type'], port = 8080): PortEvent {
  return {
    type,
    port,
    protocol: 'tcp',
    pid: 1234,
    process: 'node',
    timestamp: Date.now(),
  };
}

describe('assignPriority', () => {
  it('assigns high to closed events', () => {
    expect(assignPriority(makeEvent('closed'))).toBe('high');
  });

  it('assigns normal to opened events', () => {
    expect(assignPriority(makeEvent('opened'))).toBe('normal');
  });

  it('assigns low to changed events', () => {
    expect(assignPriority(makeEvent('changed'))).toBe('low');
  });
});

describe('enqueueEvent / dequeueEvent', () => {
  it('dequeues in priority order', () => {
    const store = createPriorityQueue();
    enqueueEvent(store, makeEvent('changed', 9000));
    enqueueEvent(store, makeEvent('opened', 8080));
    enqueueEvent(store, makeEvent('closed', 443));

    const first = dequeueEvent(store);
    expect(first?.priority).toBe('high');
    expect(first?.event.port).toBe(443);

    const second = dequeueEvent(store);
    expect(second?.priority).toBe('normal');

    const third = dequeueEvent(store);
    expect(third?.priority).toBe('low');
  });

  it('returns undefined when queue is empty', () => {
    const store = createPriorityQueue();
    expect(dequeueEvent(store)).toBeUndefined();
  });

  it('respects explicit priority override', () => {
    const store = createPriorityQueue();
    enqueueEvent(store, makeEvent('opened', 80), 'high');
    const item = dequeueEvent(store);
    expect(item?.priority).toBe('high');
  });
});

describe('drainQueue', () => {
  it('drains all events in priority order', () => {
    const store = createPriorityQueue();
    enqueueEvent(store, makeEvent('changed'));
    enqueueEvent(store, makeEvent('closed'));
    enqueueEvent(store, makeEvent('opened'));

    const drained = drainQueue(store);
    expect(drained).toHaveLength(3);
    expect(drained[0].priority).toBe('high');
    expect(drained[1].priority).toBe('normal');
    expect(drained[2].priority).toBe('low');
    expect(queueSize(store)).toBe(0);
  });

  it('respects limit parameter', () => {
    const store = createPriorityQueue();
    enqueueEvent(store, makeEvent('closed'));
    enqueueEvent(store, makeEvent('opened'));
    const drained = drainQueue(store, 1);
    expect(drained).toHaveLength(1);
    expect(queueSize(store)).toBe(1);
  });
});

describe('queueSize / clearQueue', () => {
  it('tracks size across buckets', () => {
    const store = createPriorityQueue();
    enqueueEvent(store, makeEvent('opened'));
    enqueueEvent(store, makeEvent('closed'));
    expect(queueSize(store)).toBe(2);
  });

  it('clears all buckets', () => {
    const store = createPriorityQueue();
    enqueueEvent(store, makeEvent('opened'));
    clearQueue(store);
    expect(queueSize(store)).toBe(0);
  });
});
