/**
 * eventRouterIntegration — wires the event router into the portwatch pipeline,
 * providing convenience helpers for common sink registrations.
 */

import {
  createRouterStore,
  registerSink,
  unregisterSink,
  routeEvents,
  listSinks,
  shutdownRouter,
  RouterStore,
  RouterEvent,
  SinkFn,
} from './eventRouter';

export interface RouterIntegration {
  store: RouterStore;
}

export function createRouterIntegration(): RouterIntegration {
  return { store: createRouterStore() };
}

export function addSink(
  integration: RouterIntegration,
  name: string,
  fn: SinkFn
): void {
  registerSink(integration.store, name, fn);
}

export function removeSink(integration: RouterIntegration, name: string): void {
  unregisterSink(integration.store, name);
}

export function dispatch(
  integration: RouterIntegration,
  events: RouterEvent[]
): void {
  routeEvents(integration.store, events);
}

export function activeSinks(integration: RouterIntegration): string[] {
  return listSinks(integration.store);
}

export function shutdownRouterIntegration(integration: RouterIntegration): void {
  shutdownRouter(integration.store);
}
