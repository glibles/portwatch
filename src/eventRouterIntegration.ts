import { createRouterStore, registerSink, unregisterSink, routeEvents } from './eventRouter';

export interface RouterIntegration<T> {
  addSink: (id: string, handler: (events: T[]) => void) => void;
  removeSink: (id: string) => void;
  dispatch: (events: T[]) => void;
  activeSinks: () => number;
  shutdown: () => void;
}

export function createRouterIntegration<T>(): RouterIntegration<T> {
  const store = createRouterStore<T>();

  function addSink(id: string, handler: (events: T[]) => void): void {
    registerSink(store, id, handler);
  }

  function removeSink(id: string): void {
    unregisterSink(store, id);
  }

  function dispatch(events: T[]): void {
    if (events.length === 0) return;
    routeEvents(store, events);
  }

  function activeSinks(): number {
    return store.sinks.size;
  }

  function shutdown(): void {
    for (const id of Array.from(store.sinks.keys())) {
      unregisterSink(store, id);
    }
  }

  return { addSink, removeSink, dispatch, activeSinks, shutdown };
}

// Convenience module-level wrappers using a default integration instance
const _default = createRouterIntegration<unknown>();

export const addSink = _default.addSink;
export const removeSink = _default.removeSink;
export const dispatch = _default.dispatch;
export const activeSinks = _default.activeSinks;
