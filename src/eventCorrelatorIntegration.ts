/**
 * eventCorrelatorIntegration.ts
 * Integrates the event correlator into the portwatch pipeline lifecycle.
 */

import { PortEvent } from "./changeDetector";
import {
  CorrelatorStore,
  CorrelationGroup,
  createCorrelatorStore,
  correlateEvents,
  pruneCorrelator,
} from "./eventCorrelator";

export interface CorrelatorIntegration {
  store: CorrelatorStore;
  pruneIntervalId: ReturnType<typeof setInterval> | null;
}

export function createCorrelatorIntegration(
  windowMs = 5000,
  pruneIntervalMs = 10000
): CorrelatorIntegration {
  const store = createCorrelatorStore(windowMs);
  const pruneIntervalId = setInterval(() => {
    pruneCorrelator(store);
  }, pruneIntervalMs);

  if (pruneIntervalId.unref) {
    pruneIntervalId.unref();
  }

  return { store, pruneIntervalId };
}

export function correlate(
  integration: CorrelatorIntegration,
  events: PortEvent[]
): CorrelationGroup[] {
  if (events.length === 0) return [];
  return correlateEvents(integration.store, events);
}

export function flushCorrelations(
  integration: CorrelatorIntegration
): CorrelationGroup[] {
  const groups = Array.from(integration.store.groups.values());
  integration.store.groups.clear();
  return groups;
}

export function shutdownCorrelatorIntegration(
  integration: CorrelatorIntegration
): void {
  if (integration.pruneIntervalId !== null) {
    clearInterval(integration.pruneIntervalId);
    integration.pruneIntervalId = null;
  }
}
