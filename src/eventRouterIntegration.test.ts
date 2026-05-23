import { createRouterIntegration, addSink, removeSink, dispatch, activeSinks } from './eventRouterIntegration';

type TestEvent = { type: string; port: number; ts: number };

function makeEvent(port = 3000, type = 'open'): TestEvent {
  return { type, port, ts: Date.now() };
}

describe('createRouterIntegration', () => {
  it('returns an integration object with expected methods', () => {
    const ri = createRouterIntegration<TestEvent>();
    expect(typeof ri.addSink).toBe('function');
    expect(typeof ri.removeSink).toBe('function');
    expect(typeof ri.dispatch).toBe('function');
    expect(typeof ri.activeSinks).toBe('function');
    expect(typeof ri.shutdown).toBe('function');
  });
});

describe('addSink / activeSinks', () => {
  it('registers a sink and reflects it in activeSinks', () => {
    const ri = createRouterIntegration<TestEvent>();
    expect(ri.activeSinks()).toBe(0);
    ri.addSink('console', () => {});
    expect(ri.activeSinks()).toBe(1);
  });

  it('does not double-register the same sink id', () => {
    const ri = createRouterIntegration<TestEvent>();
    ri.addSink('console', () => {});
    ri.addSink('console', () => {});
    expect(ri.activeSinks()).toBe(1);
  });
});

describe('removeSink', () => {
  it('unregisters a sink', () => {
    const ri = createRouterIntegration<TestEvent>();
    ri.addSink('file', () => {});
    ri.removeSink('file');
    expect(ri.activeSinks()).toBe(0);
  });

  it('is a no-op for unknown sink id', () => {
    const ri = createRouterIntegration<TestEvent>();
    expect(() => ri.removeSink('ghost')).not.toThrow();
  });
});

describe('dispatch', () => {
  it('routes events to all registered sinks', () => {
    const ri = createRouterIntegration<TestEvent>();
    const received: TestEvent[][] = [[], []];
    ri.addSink('a', (evts) => received[0].push(...evts));
    ri.addSink('b', (evts) => received[1].push(...evts));
    const events = [makeEvent(80), makeEvent(443, 'close')];
    ri.dispatch(events);
    expect(received[0]).toHaveLength(2);
    expect(received[1]).toHaveLength(2);
  });

  it('does nothing when no sinks are registered', () => {
    const ri = createRouterIntegration<TestEvent>();
    expect(() => ri.dispatch([makeEvent()])).not.toThrow();
  });

  it('continues routing to other sinks if one throws', () => {
    const ri = createRouterIntegration<TestEvent>();
    const good: TestEvent[] = [];
    ri.addSink('bad', () => { throw new Error('sink error'); });
    ri.addSink('good', (evts) => good.push(...evts));
    expect(() => ri.dispatch([makeEvent()])).not.toThrow();
    expect(good).toHaveLength(1);
  });
});

describe('shutdown', () => {
  it('removes all sinks', () => {
    const ri = createRouterIntegration<TestEvent>();
    ri.addSink('x', () => {});
    ri.addSink('y', () => {});
    ri.shutdown();
    expect(ri.activeSinks()).toBe(0);
  });
});
