import { createReplayBufferIntegration, ReplayBufferIntegration } from './eventReplayBufferIntegration';
import { PortEvent } from './changeDetector';

function makeEvent(port: number, overrides: Partial<PortEvent> = {}): PortEvent {
  return {
    type: 'opened',
    port,
    protocol: 'tcp',
    pid: 1000 + port,
    process: 'node',
    timestamp: Date.now(),
    ...overrides,
  };
}

describe('createReplayBufferIntegration', () => {
  let integration: ReplayBufferIntegration;

  beforeEach(() => {
    integration = createReplayBufferIntegration(10, 60_000);
  });

  afterEach(() => {
    integration.shutdown();
  });

  it('records and replays events', () => {
    const e1 = makeEvent(3000);
    const e2 = makeEvent(3001);
    integration.record(e1);
    integration.record(e2);
    const replayed = integration.replay();
    expect(replayed).toHaveLength(2);
    expect(replayed[0].port).toBe(3000);
    expect(replayed[1].port).toBe(3001);
  });

  it('replays events since a given timestamp', () => {
    const past = Date.now() - 5_000;
    const e1 = makeEvent(3000, { timestamp: past - 1000 });
    const e2 = makeEvent(3001, { timestamp: past + 1000 });
    integration.record(e1);
    integration.record(e2);
    const replayed = integration.replaySince(past);
    expect(replayed).toHaveLength(1);
    expect(replayed[0].port).toBe(3001);
  });

  it('clears all events', () => {
    integration.record(makeEvent(3000));
    integration.record(makeEvent(3001));
    integration.clear();
    expect(integration.replay()).toHaveLength(0);
  });

  it('respects maxSize by dropping oldest on overflow', () => {
    const small = createReplayBufferIntegration(3, 60_000);
    small.record(makeEvent(3000));
    small.record(makeEvent(3001));
    small.record(makeEvent(3002));
    small.record(makeEvent(3003));
    const replayed = small.replay();
    expect(replayed).toHaveLength(3);
    expect(replayed.map(e => e.port)).not.toContain(3000);
    small.shutdown();
  });

  it('returns empty array when buffer is empty', () => {
    expect(integration.replay()).toEqual([]);
    expect(integration.replaySince(Date.now() - 1000)).toEqual([]);
  });

  it('shutdown clears buffer and stops timer', () => {
    integration.record(makeEvent(3000));
    integration.shutdown();
    expect(integration.replay()).toHaveLength(0);
  });

  it('exposes the underlying buffer', () => {
    expect(integration.buffer).toBeDefined();
  });
});
