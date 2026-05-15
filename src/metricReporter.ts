import { Metrics } from './metricCollector';

export type ReportFormat = 'text' | 'json';

export interface ReportOptions {
  format: ReportFormat;
  includeProtocolBreakdown?: boolean;
}

export function formatMetricsAsText(metrics: Metrics, includeProtocolBreakdown = true): string {
  const lines: string[] = [
    `=== portwatch metrics ===`,
    `Uptime       : ${metrics.uptimeSeconds}s`,
    `Total scans  : ${metrics.totalScans}`,
    `Total changes: ${metrics.totalChanges}`,
    `Open ports   : ${metrics.openPorts}`,
    `Ports opened : ${metrics.newPorts}`,
    `Ports closed : ${metrics.closedPorts}`,
    `Last scan    : ${metrics.lastScanAt ? new Date(metrics.lastScanAt).toISOString() : 'never'}`,
  ];
  if (includeProtocolBreakdown) {
    const entries = Object.entries(metrics.changesByProtocol);
    if (entries.length > 0) {
      lines.push('Changes by protocol:');
      for (const [proto, count] of entries) {
        lines.push(`  ${proto}: ${count}`);
      }
    }
  }
  return lines.join('\n');
}

export function formatMetricsAsJson(metrics: Metrics): string {
  return JSON.stringify(metrics, null, 2);
}

export function reportMetrics(metrics: Metrics, options: ReportOptions): string {
  if (options.format === 'json') {
    return formatMetricsAsJson(metrics);
  }
  return formatMetricsAsText(metrics, options.includeProtocolBreakdown ?? true);
}
