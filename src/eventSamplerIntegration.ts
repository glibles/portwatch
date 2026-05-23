/**
 * eventSamplerIntegration.ts
 * Wires the event sampler into the portwatch pipeline, reading sampler
 * config from the main config object and exposing a clean integration API.
 */

import { PortEvent } from './changeDetector';
import {
  SamplerStore,
  SamplerConfig,
  createSamplerStore,
  sampleEvents,
  getSamplerStats,
  resetSamplerStats,
} from './eventSampler';

export interface SamplerIntegration {
  sample: (events: PortEvent[]) => PortEvent[];
  stats: () => ReturnType<typeof getSamplerStats>;
  reset: () => void;
  shutdown: () => void;
}

export function createSamplerIntegration(
  config: Partial<SamplerConfig> = {}
): SamplerIntegration {
  const resolved: SamplerConfig = {
    rate: config.rate ?? 1.0,
    alwaysKeep: config.alwaysKeep ?? ['open', 'close'],
  };

  const store: SamplerStore = createSamplerStore(resolved);
  let active = true;

  function sample(events: PortEvent[]): PortEvent[] {
    if (!active) return events;
    return sampleEvents(store, events);
  }

  function stats() {
    return getSamplerStats(store);
  }

  function reset() {
    resetSamplerStats(store);
  }

  function shutdown() {
    active = false;
  }

  return { sample, stats, reset, shutdown };
}
