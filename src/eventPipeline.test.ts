import { createPipeline, PipelineOptions } from './eventPipeline';
import { PortEvent } from './changeDetector';

jest.mock('./eventDeduplicatorIntegration', () => ({
  filterDuplicateEvents: (events: PortEvent[]) =>
    events.filter((_, i) => i % 2 === 0),
}));

jest.mock('./eventThrottleIntegration', () => ({
  filterThrottledEvents: (events: PortEvent[]) =>
    events.filter((_, i) => i !== 1),
}));

jest.mock('./eventBatchIntegration', () => ({
  addEventToBatch: jest.fn(),
}));

jest.mock('./filterEngine', () => ({
  applyFilter: (_event: PortEvent, _rule: unknown) => true,
}));

function makeEvent(port: number, type: PortEvent['type'] = 'open'): PortEvent {
  return {
    type,
    port,
    protocol: 'tcp',
    pid: 1000 + port,
    process: 'node',
    timestamp: Date.now(),
  };
}

describe('createPipeline', () => {
  it('returns a function', () => {
    const pipeline = createPipeline();
    expect(typeof pipeline).toBe('function');
  });

  it('passes events through with defaults', () => {
    const pipeline = createPipeline({ dedupeEnabled: false, throttleEnabled: false });
    const events = [makeEvent(3000), makeEvent(3001)];
    const result = pipeline(events);
    expect(result.passed).toHaveLength(2);
    expect(result.dedupedCount).toBe(0);
    expect(result.throttledCount).toBe(0);
    expect(result.batchedCount).toBe(0);
  });

  it('counts deduped events', () => {
    const pipeline = createPipeline({ dedupeEnabled: true, throttleEnabled: false });
    const events = [makeEvent(3000), makeEvent(3001), makeEvent(3002), makeEvent(3003)];
    const result = pipeline(events);
    // mock keeps even indices: 0,2 => 2 events pass, 2 deduped
    expect(result.dedupedCount).toBe(2);
  });

  it('counts throttled events', () => {
    const pipeline = createPipeline({ dedupeEnabled: false, throttleEnabled: true });
    const events = [makeEvent(3000), makeEvent(3001), makeEvent(3002)];
    const result = pipeline(events);
    // mock removes index 1 => 2 pass, 1 throttled
    expect(result.throttledCount).toBe(1);
    expect(result.passed).toHaveLength(2);
  });

  it('batches events when batchEnabled is true', () => {
    const { addEventToBatch } = require('./eventBatchIntegration');
    const pipeline = createPipeline({ dedupeEnabled: false, throttleEnabled: false, batchEnabled: true });
    const events = [makeEvent(4000), makeEvent(4001)];
    const result = pipeline(events);
    expect(result.batchedCount).toBe(2);
    expect(result.passed).toHaveLength(0);
    expect(addEventToBatch).toHaveBeenCalledTimes(2);
  });

  it('applies filterRule when provided', () => {
    const applyFilter = require('./filterEngine').applyFilter as jest.Mock;
    applyFilter.mockImplementation((_e: PortEvent, _r: unknown) => false);
    const pipeline = createPipeline({ filterRule: {} as any, dedupeEnabled: false, throttleEnabled: false });
    const result = pipeline([makeEvent(5000)]);
    expect(result.passed).toHaveLength(0);
  });
});
