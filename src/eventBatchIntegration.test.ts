import {
  createBatchIntegration,
  addEventToBatch,
  shutdownBatchIntegration,
  FlushCallback,
} from './eventBatchIntegration';
import { PortEvent } from './changeDetector';

function makeEvent(port: number): PortEvent {
  return {
    type: 'open',
    port,
    protocol: 'tcp',
    pid: 42,
    process: 'test',
    timestamp: Date.now(),
  };
}

describe('createBatchIntegration', () => {
  it('creates integration with a store and timer', () => {
    const onFlush = jest.fn();
    const integration = createBatchIntegration(onFlush, 10, 5000);
    expect(integration.store).toBeDefined();
    expect(integration.timer).not.toBeNull();
    shutdownBatchIntegration(integration, onFlush);
  });
});

describe('addEventToBatch', () => {
  it('adds events without flushing when below maxSize', () => {
    const onFlush = jest.fn();
    const integration = createBatchIntegration(onFlush, 10, 5000);
    addEventToBatch(integration, makeEvent(80), onFlush);
    expect(onFlush).not.toHaveBeenCalled();
    expect(integration.store.queue).toHaveLength(1);
    shutdownBatchIntegration(integration, onFlush);
  });

  it('flushes automatically when maxSize is reached', () => {
    const flushed: PortEvent[][] = [];
    const onFlush: FlushCallback = (events) => flushed.push(events);
    const integration = createBatchIntegration(onFlush, 2, 5000);

    addEventToBatch(integration, makeEvent(80), onFlush);
    addEventToBatch(integration, makeEvent(443), onFlush);

    expect(flushed.length).toBe(1);
    expect(flushed[0]).toHaveLength(2);
    expect(integration.store.queue).toHaveLength(0);
    shutdownBatchIntegration(integration, onFlush);
  });
});

describe('shutdownBatchIntegration', () => {
  it('clears the timer on shutdown', () => {
    const onFlush = jest.fn();
    const integration = createBatchIntegration(onFlush, 10, 5000);
    shutdownBatchIntegration(integration, onFlush);
    expect(integration.timer).toBeNull();
  });

  it('flushes remaining events on shutdown', () => {
    const flushed: PortEvent[][] = [];
    const onFlush: FlushCallback = (events) => flushed.push(events);
    const integration = createBatchIntegration(onFlush, 10, 5000);

    addEventToBatch(integration, makeEvent(3000), onFlush);
    shutdownBatchIntegration(integration, onFlush);

    expect(flushed.length).toBe(1);
    expect(flushed[0][0].port).toBe(3000);
    expect(integration.store.queue).toHaveLength(0);
  });

  it('does not call onFlush if queue is empty on shutdown', () => {
    const onFlush = jest.fn();
    const integration = createBatchIntegration(onFlush, 10, 5000);
    shutdownBatchIntegration(integration, onFlush);
    expect(onFlush).not.toHaveBeenCalled();
  });
});
