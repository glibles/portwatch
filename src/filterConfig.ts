/**
 * filterConfig.ts
 * Loads and validates filter rules from the portwatch config.
 */

import { FilterRule } from './filterEngine';

export interface RawFilterConfig {
  ports?: unknown;
  excludePorts?: unknown;
  processNames?: unknown;
  excludeProcessNames?: unknown;
  protocols?: unknown;
}

function toNumberArray(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v) => typeof v === 'number') as number[];
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v) => typeof v === 'string') as string[];
}

function toProtocolArray(value: unknown): Array<'tcp' | 'udp'> {
  const arr = toStringArray(value);
  return arr.filter((v): v is 'tcp' | 'udp' => v === 'tcp' || v === 'udp');
}

/**
 * Parses a raw config object into a validated FilterRule.
 */
export function parseFilterConfig(raw: RawFilterConfig): FilterRule {
  return {
    ports: toNumberArray(raw.ports),
    excludePorts: toNumberArray(raw.excludePorts),
    processNames: toStringArray(raw.processNames),
    excludeProcessNames: toStringArray(raw.excludeProcessNames),
    protocols: toProtocolArray(raw.protocols),
  };
}

/**
 * Returns a no-op FilterRule (allows everything).
 */
export function defaultFilterRule(): FilterRule {
  return {
    ports: [],
    excludePorts: [],
    processNames: [],
    excludeProcessNames: [],
    protocols: [],
  };
}
