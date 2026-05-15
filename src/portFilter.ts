import { PortInfo } from './portScanner';

export interface PortRange {
  from: number;
  to: number;
}

export interface PortFilterOptions {
  includePorts?: number[];
  excludePorts?: number[];
  includeRanges?: PortRange[];
  excludeRanges?: PortRange[];
  includeProtocols?: string[];
  excludeProtocols?: string[];
  includePids?: number[];
  excludePids?: number[];
}

export function inRange(port: number, ranges: PortRange[]): boolean {
  return ranges.some((r) => port >= r.from && port <= r.to);
}

export function matchesPort(
  info: PortInfo,
  options: PortFilterOptions
): boolean {
  const { port, protocol, pid } = info;

  if (options.includeProtocols && options.includeProtocols.length > 0) {
    if (!options.includeProtocols.includes(protocol)) return false;
  }
  if (options.excludeProtocols && options.excludeProtocols.includes(protocol)) {
    return false;
  }

  if (options.includePorts && options.includePorts.length > 0) {
    const inList = options.includePorts.includes(port);
    const inRangeList = options.includeRanges
      ? inRange(port, options.includeRanges)
      : false;
    if (!inList && !inRangeList) return false;
  } else if (options.includeRanges && options.includeRanges.length > 0) {
    if (!inRange(port, options.includeRanges)) return false;
  }

  if (options.excludePorts && options.excludePorts.includes(port)) {
    return false;
  }
  if (options.excludeRanges && inRange(port, options.excludeRanges)) {
    return false;
  }

  if (options.includePids && options.includePids.length > 0) {
    if (pid === undefined || !options.includePids.includes(pid)) return false;
  }
  if (
    options.excludePids &&
    pid !== undefined &&
    options.excludePids.includes(pid)
  ) {
    return false;
  }

  return true;
}

export function applyPortFilter(
  ports: PortInfo[],
  options: PortFilterOptions
): PortInfo[] {
  return ports.filter((p) => matchesPort(p, options));
}
