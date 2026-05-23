/**
 * eventRouter — routes processed events to one or more named sinks.
 * Each sink is a callback that receives a batch of events.
 */

export type RouterEvent = { port: number; pid: number; type: string; timestamp: number };
export type SinkFn = (events: RouterEvent[]) => void;

export interface RouterStore {
  sinks: Map<string, SinkFn>;
  active: boolean;
}

export function createRouterStore(): RouterStore {
  return { sinks: new Map(), active: true };
}

export function registerSink(store: RouterStore, name: string, fn: SinkFn): void {
  if (!store.active) return;
  store.sinks.set(name, fn);
}

export function unregisterSink(store: RouterStore, name: string): void {
  store.sinks.delete(name);
}

export function routeEvents(store: RouterStore, events: RouterEvent[]): void {
  if (!store.active || events.length === 0) return;
  store.sinks.forEach((fn) => {
    try {
      fn(events);
    } catch {
      // individual sink errors must not block other sinks
    }
  });
}

export function routeToSink(
  store: RouterStore,
  name: string,
  events: RouterEvent[]
): void {
  if (!store.active) return;
  const fn = store.sinks.get(name);
  if (fn) fn(events);
}

export function listSinks(store: RouterStore): string[] {
  return Array.from(store.sinks.keys());
}

export function shutdownRouter(store: RouterStore): void {
  store.active = false;
  store.sinks.clear();
}
