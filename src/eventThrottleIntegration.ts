/**
 * eventThrottleIntegration.ts
 * Wires the throttle store into the daemon event pipeline.
 */

import type { ChangeEvent } from "./changeDetector";
import {
  createThrottleStore,
  throttleKey,
  shouldThrottle,
  pruneThrottleStore,
  type ThrottleStore,
} from "./eventThrottle";

export interface ThrottleIntegration {
  store: ThrottleStore;
  pruneIntervalId: ReturnType<typeof setInterval> | null;
}

export function createThrottleIntegration(
  windowMs = 5000,
  maxPerWindow = 3,
  pruneIntervalMs = 30_000
): ThrottleIntegration {
  const store = createThrottleStore(windowMs, maxPerWindow);
  const pruneIntervalId = setInterval(
    () => pruneThrottleStore(store),
    pruneIntervalMs
  );
  if (pruneIntervalId.unref) pruneIntervalId.unref();
  return { store, pruneIntervalId };
}

export function filterThrottledEvents(
  integration: ThrottleIntegration,
  events: ChangeEvent[],
  now = Date.now()
): ChangeEvent[] {
  return events.filter((event) => {
    const key = throttleKey(
      event.port,
      event.pid ?? 0,
      event.type
    );
    return !shouldThrottle(integration.store, key, now);
  });
}

export function shutdownThrottleIntegration(
  integration: ThrottleIntegration
): void {
  if (integration.pruneIntervalId !== null) {
    clearInterval(integration.pruneIntervalId);
    integration.pruneIntervalId = null;
  }
}
