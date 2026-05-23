/**
 * eventSampler.ts
 * Probabilistic and rate-based sampling of port events to reduce noise
 * during high-volume periods.
 */

import { PortEvent } from './changeDetector';

export interface SamplerConfig {
  /** 0.0 – 1.0: fraction of events to keep */
  rate: number;
  /** If set, always keep events with these types regardless of rate */
  alwaysKeep?: Array<PortEvent['type']>;
}

export interface SamplerStore {
  config: SamplerConfig;
  kept: number;
  dropped: number;
}

export function createSamplerStore(config: SamplerConfig): SamplerStore {
  if (config.rate < 0 || config.rate > 1) {
    throw new RangeError(`Sampler rate must be between 0 and 1, got ${config.rate}`);
  }
  return { config, kept: 0, dropped: 0 };
}

export function shouldKeep(
  store: SamplerStore,
  event: PortEvent,
  random: () => number = Math.random
): boolean {
  const { alwaysKeep = [], rate } = store.config;
  if (alwaysKeep.includes(event.type)) {
    store.kept++;
    return true;
  }
  if (random() < rate) {
    store.kept++;
    return true;
  }
  store.dropped++;
  return false;
}

export function sampleEvents(
  store: SamplerStore,
  events: PortEvent[],
  random: () => number = Math.random
): PortEvent[] {
  return events.filter(e => shouldKeep(store, e, random));
}

export function getSamplerStats(
  store: SamplerStore
): { kept: number; dropped: number; total: number; effectiveRate: number } {
  const total = store.kept + store.dropped;
  return {
    kept: store.kept,
    dropped: store.dropped,
    total,
    effectiveRate: total === 0 ? store.config.rate : store.kept / total,
  };
}

export function resetSamplerStats(store: SamplerStore): void {
  store.kept = 0;
  store.dropped = 0;
}
