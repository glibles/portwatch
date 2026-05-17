/**
 * eventDeduplicatorIntegration.ts
 * Integrates the event deduplicator into the daemon scan pipeline,
 * providing lifecycle management and per-scan deduplication.
 */

import { PortEvent } from './changeDetector';
import {
  DeduplicatorStore,
  createDeduplicatorStore,
  deduplicateEvents,
  pruneDeduplicatorStore,
  resetDeduplicatorStore,
} from './eventDeduplicator';

export interface DeduplicatorIntegration {
  store: DeduplicatorStore;
  pruneIntervalId: ReturnType<typeof setInterval> | null;
}

export function createDeduplicatorIntegration(
  windowMs = 2000,
  pruneIntervalMs = 10000
): DeduplicatorIntegration {
  const store = createDeduplicatorStore(windowMs);
  const pruneIntervalId = setInterval(
    () => pruneDeduplicatorStore(store),
    pruneIntervalMs
  );
  if (pruneIntervalId.unref) pruneIntervalId.unref();
  return { store, pruneIntervalId };
}

export function filterDuplicateEvents(
  integration: DeduplicatorIntegration,
  events: PortEvent[],
  now = Date.now()
): PortEvent[] {
  return deduplicateEvents(integration.store, events, now);
}

export function shutdownDeduplicatorIntegration(
  integration: DeduplicatorIntegration
): void {
  if (integration.pruneIntervalId !== null) {
    clearInterval(integration.pruneIntervalId);
    integration.pruneIntervalId = null;
  }
  resetDeduplicatorStore(integration.store);
}
