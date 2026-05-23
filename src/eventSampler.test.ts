import {
  createSamplerStore,
  shouldKeep,
  sampleEvents,
  getSamplerStats,
  resetSamplerStats,
} from './eventSampler';
import { createSamplerIntegration } from './eventSamplerIntegration';
import { PortEvent } from './changeDetector';

function makeEvent(type: PortEvent['type'] = 'open', port = 3000): PortEvent {
  return { type, port, protocol: 'tcp', pid: 1234, process: 'node', timestamp: Date.now() };
}

describe('createSamplerStore', () => {
  it('creates store with given rate', () => {
    const store = createSamplerStore({ rate: 0.5 });
    expect(store.config.rate).toBe(0.5);
    expect(store.kept).toBe(0);
    expect(store.dropped).toBe(0);
  });

  it('throws on invalid rate', () => {
    expect(() => createSamplerStore({ rate: 1.5 })).toThrow(RangeError);
    expect(() => createSamplerStore({ rate: -0.1 })).toThrow(RangeError);
  });
});

describe('shouldKeep', () => {
  it('always keeps alwaysKeep event types', () => {
    const store = createSamplerStore({ rate: 0, alwaysKeep: ['open'] });
    const kept = shouldKeep(store, makeEvent('open'), () => 0.99);
    expect(kept).toBe(true);
    expect(store.kept).toBe(1);
  });

  it('drops events when random exceeds rate', () => {
    const store = createSamplerStore({ rate: 0.3 });
    const kept = shouldKeep(store, makeEvent('change'), () => 0.9);
    expect(kept).toBe(false);
    expect(store.dropped).toBe(1);
  });

  it('keeps events when random is below rate', () => {
    const store = createSamplerStore({ rate: 0.8 });
    const kept = shouldKeep(store, makeEvent('change'), () => 0.1);
    expect(kept).toBe(true);
    expect(store.kept).toBe(1);
  });
});

describe('sampleEvents', () => {
  it('filters list based on rate', () => {
    const store = createSamplerStore({ rate: 0.5, alwaysKeep: [] });
    let toggle = false;
    const events = Array.from({ length: 10 }, () => makeEvent('change'));
    const result = sampleEvents(store, events, () => { toggle = !toggle; return toggle ? 0.1 : 0.9; });
    expect(result.length).toBe(5);
  });

  it('returns all events at rate 1', () => {
    const store = createSamplerStore({ rate: 1 });
    const events = [makeEvent('open'), makeEvent('close'), makeEvent('change')];
    expect(sampleEvents(store, events)).toHaveLength(3);
  });
});

describe('getSamplerStats', () => {
  it('reports correct effective rate', () => {
    const store = createSamplerStore({ rate: 0.5, alwaysKeep: [] });
    store.kept = 3;
    store.dropped = 7;
    const stats = getSamplerStats(store);
    expect(stats.total).toBe(10);
    expect(stats.effectiveRate).toBeCloseTo(0.3);
  });

  it('returns configured rate when no events processed', () => {
    const store = createSamplerStore({ rate: 0.7 });
    expect(getSamplerStats(store).effectiveRate).toBe(0.7);
  });
});

describe('resetSamplerStats', () => {
  it('zeroes counters', () => {
    const store = createSamplerStore({ rate: 1 });
    store.kept = 5; store.dropped = 3;
    resetSamplerStats(store);
    expect(store.kept).toBe(0);
    expect(store.dropped).toBe(0);
  });
});

describe('createSamplerIntegration', () => {
  it('uses defaults when no config provided', () => {
    const integration = createSamplerIntegration();
    const events = [makeEvent('open'), makeEvent('close')];
    expect(integration.sample(events)).toHaveLength(2);
  });

  it('passes all events through after shutdown', () => {
    const integration = createSamplerIntegration({ rate: 0 });
    integration.shutdown();
    const events = [makeEvent('change'), makeEvent('change')];
    expect(integration.sample(events)).toHaveLength(2);
  });

  it('resets stats', () => {
    const integration = createSamplerIntegration({ rate: 1 });
    integration.sample([makeEvent('open')]);
    integration.reset();
    expect(integration.stats().kept).toBe(0);
  });
});
