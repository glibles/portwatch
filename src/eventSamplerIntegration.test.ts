import { createSamplerIntegration, sample, stats, reset, shutdown } from './eventSamplerIntegration';

type PortEvent = { port: number; pid: number; type: string; timestamp: number };

function makeEvent(port = 8080, type = 'open'): PortEvent {
  return { port, pid: 1234, type, timestamp: Date.now() };
}

describe('eventSamplerIntegration', () => {
  let integration: ReturnType<typeof createSamplerIntegration>;

  beforeEach(() => {
    integration = createSamplerIntegration({ rate: 1.0 });
  });

  afterEach(() => {
    shutdown(integration);
  });

  it('passes all events when rate is 1.0', () => {
    const events = [makeEvent(80), makeEvent(443), makeEvent(8080)];
    const result = sample(integration, events);
    expect(result.length).toBe(3);
  });

  it('drops all events when rate is 0.0', () => {
    const zero = createSamplerIntegration({ rate: 0.0 });
    const events = [makeEvent(80), makeEvent(443)];
    const result = sample(zero, events);
    expect(result.length).toBe(0);
    shutdown(zero);
  });

  it('tracks accepted and rejected counts in stats', () => {
    const events = [makeEvent(80), makeEvent(443), makeEvent(8080)];
    sample(integration, events);
    const s = stats(integration);
    expect(s.accepted + s.rejected).toBe(3);
  });

  it('resets stats correctly', () => {
    sample(integration, [makeEvent(), makeEvent()]);
    reset(integration);
    const s = stats(integration);
    expect(s.accepted).toBe(0);
    expect(s.rejected).toBe(0);
  });

  it('respects partial sampling rate approximately', () => {
    const half = createSamplerIntegration({ rate: 0.5, seed: 42 });
    const events = Array.from({ length: 100 }, (_, i) => makeEvent(i));
    const result = sample(half, events);
    expect(result.length).toBeGreaterThan(20);
    expect(result.length).toBeLessThan(80);
    shutdown(half);
  });

  it('shutdown marks integration as inactive', () => {
    shutdown(integration);
    const s = stats(integration);
    expect(s).toBeDefined();
  });
});
