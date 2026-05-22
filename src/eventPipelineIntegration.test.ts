import { createPipelineIntegration } from './eventPipelineIntegration';
import type { ChangeEvent } from './changeDetector';

function makeEvent(port: number, pid: number, type: ChangeEvent['type'] = 'opened'): ChangeEvent {
  return {
    type,
    port,
    protocol: 'tcp',
    pid,
    processName: `proc-${pid}`,
    timestamp: Date.now(),
  };
}

describe('createPipelineIntegration', () => {
  it('calls onFlush with processed events', (done) => {
    const integration = createPipelineIntegration({
      batchSize: 2,
      batchFlushMs: 50,
      onFlush: (events) => {
        expect(events.length).toBeGreaterThan(0);
        integration.shutdown();
        done();
      },
    });

    integration.process([makeEvent(3000, 1), makeEvent(3001, 2)]);
  });

  it('deduplicates identical events within window', (done) => {
    const received: ChangeEvent[] = [];
    const integration = createPipelineIntegration({
      dedupeWindowMs: 5000,
      batchSize: 10,
      batchFlushMs: 50,
      onFlush: (events) => {
        received.push(...events);
      },
    });

    const event = makeEvent(4000, 99);
    integration.process([event, event, event]);

    setTimeout(() => {
      expect(received.filter((e) => e.port === 4000)).toHaveLength(1);
      integration.shutdown();
      done();
    }, 100);
  });

  it('throttles high-frequency events from same source', (done) => {
    const received: ChangeEvent[] = [];
    const integration = createPipelineIntegration({
      throttleWindowMs: 5000,
      throttleMaxEvents: 2,
      dedupeWindowMs: 0,
      batchSize: 10,
      batchFlushMs: 50,
      onFlush: (events) => {
        received.push(...events);
      },
    });

    for (let i = 0; i < 5; i++) {
      integration.process([makeEvent(5000, 42)]);
    }

    setTimeout(() => {
      expect(received.filter((e) => e.port === 5000).length).toBeLessThanOrEqual(2);
      integration.shutdown();
      done();
    }, 100);
  });

  it('shutdown does not throw', () => {
    const integration = createPipelineIntegration({
      onFlush: () => {},
    });
    expect(() => integration.shutdown()).not.toThrow();
  });
});
