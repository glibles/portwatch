/**
 * filterEngine.ts
 * Provides filtering logic to include/exclude ports and processes
 * based on user-defined rules in the config.
 */

import { PortInfo } from './portScanner';

export interface FilterRule {
  ports?: number[];
  excludePorts?: number[];
  processNames?: string[];
  excludeProcessNames?: string[];
  protocols?: Array<'tcp' | 'udp'>;
}

/**
 * Returns true if the given PortInfo passes all filter rules.
 */
export function passesFilter(info: PortInfo, rule: FilterRule): boolean {
  if (rule.protocols && rule.protocols.length > 0) {
    if (!rule.protocols.includes(info.protocol as 'tcp' | 'udp')) {
      return false;
    }
  }

  if (rule.ports && rule.ports.length > 0) {
    if (!rule.ports.includes(info.port)) {
      return false;
    }
  }

  if (rule.excludePorts && rule.excludePorts.length > 0) {
    if (rule.excludePorts.includes(info.port)) {
      return false;
    }
  }

  if (rule.processNames && rule.processNames.length > 0) {
    const name = info.processName ?? '';
    if (!rule.processNames.some((n) => name.includes(n))) {
      return false;
    }
  }

  if (rule.excludeProcessNames && rule.excludeProcessNames.length > 0) {
    const name = info.processName ?? '';
    if (rule.excludeProcessNames.some((n) => name.includes(n))) {
      return false;
    }
  }

  return true;
}

/**
 * Filters an array of PortInfo entries using the provided rule.
 */
export function applyFilter(infos: PortInfo[], rule: FilterRule): PortInfo[] {
  return infos.filter((info) => passesFilter(info, rule));
}
