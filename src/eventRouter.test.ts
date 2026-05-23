import {
  createRouterStore,
  registerSink,
  unregisterSink,
  routeEvents,
  routeToSink,
  listSinks,
  shutdownRouter,
  RouterEvent,
} from './eventRouter';

function makeEvent(port = 8080): RouterEvent {
  return { port, pid: 999, type: 'open', timestamp: Date.now() };
}

describe('eventRouter', () => {
  it('routes events to all registered sinks', () => {
    const store = createRouterStore();
    const received: RouterEvent[][] = [];
    registerSink(store, 'a', (evts) => received.push(evts));
    registerSink(store, 'b', (evts) => received.push(evts));
    routeEvents(store, [makeEvent()]);
    expect(received.length).toBe(2);
  });

  it('does not call removed sink', () => {
    const store = createRouterStore();
    let called = false;
    registerSink(store, 'x', () => { called = true; });
    unregisterSink(store, 'x');
    routeEvents(store, [makeEvent()]);
    expect(called).toBe(false);
  });

  it('routes to a specific named sink', () => {
    const store = createRouterStore();
    const log: number[] = [];
    registerSink(store, 'target', (evts) => evts.forEach(e => log.push(e.port)));
    registerSink(store, 'other', () => { throw new Error('should not be called'); });
    routeToSink(store, 'target', [makeEvent(3000)]);
    expect(log).toEqual([3000]);
  });

  it('lists registered sink names', () => {
    const store = createRouterStore();
    registerSink(store, 'alpha', () => {});
    registerSink(store, 'beta', () => {});
    expect(listSinks(store).sort()).toEqual(['alpha', 'beta']);
  });

  it('silently handles empty event array', () => {
    const store = createRouterStore();
    let called = false;
    registerSink(store, 's', () => { called = true; });
    routeEvents(store, []);
    expect(called).toBe(false);
  });

  it('isolates sink errors from other sinks', () => {
    const store = createRouterStore();
    const results: string[] = [];
    registerSink(store, 'bad', () => { throw new Error('boom'); });
    registerSink(store, 'good', () => results.push('ok'));
    expect(() => routeEvents(store, [makeEvent()])).not.toThrow();
    expect(results).toEqual(['ok']);
  });

  it('ignores new sinks after shutdown', () => {
    const store = createRouterStore();
    shutdownRouter(store);
    registerSink(store, 'z', () => {});
    expect(listSinks(store)).toEqual([]);
  });

  it('clears all sinks on shutdown', () => {
    const store = createRouterStore();
    registerSink(store, 'a', () => {});
    shutdownRouter(store);
    expect(listSinks(store)).toEqual([]);
  });
});
