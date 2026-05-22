import { PortEvent } from "./changeDetector";
import {
  AggregatedGroup,
  AggregatorStore,
  createAggregatorStore,
  aggregateEvents,
  flushAggregator,
  pruneAggregator,
  pendingGroupCount,
} from "./eventAggregator";

export interface AggregatorIntegration {
  store: AggregatorStore;
  pruneTimer: ReturnType<typeof setInterval> | null;
}

export function createAggregatorIntegration(
  windowMs = 5000,
  pruneIntervalMs = 30000
): AggregatorIntegration {
  const store = createAggregatorStore(windowMs);
  const pruneTimer = setInterval(() => {
    pruneAggregator(store);
  }, pruneIntervalMs);
  if (pruneTimer.unref) pruneTimer.unref();
  return { store, pruneTimer };
}

export function ingestEvents(
  integration: AggregatorIntegration,
  events: PortEvent[]
): void {
  aggregateEvents(integration.store, events);
}

export function collectFlushed(
  integration: AggregatorIntegration,
  now = Date.now()
): AggregatedGroup[] {
  return flushAggregator(integration.store, now);
}

export function pendingCount(integration: AggregatorIntegration): number {
  return pendingGroupCount(integration.store);
}

export function shutdownAggregatorIntegration(
  integration: AggregatorIntegration
): AggregatedGroup[] {
  if (integration.pruneTimer !== null) {
    clearInterval(integration.pruneTimer);
    integration.pruneTimer = null;
  }
  return flushAggregator(integration.store, Date.now() + integration.store.windowMs);
}
