import { PortEvent } from './processLogger';

export type OutputFormat = 'text' | 'json' | 'csv';

export interface FormatterOptions {
  format: OutputFormat;
  includeTimestamp?: boolean;
  colorize?: boolean;
}

const RESET = '\x1b[0m';
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';

function colorForEvent(type: PortEvent['type'], colorize: boolean): string {
  if (!colorize) return '';
  switch (type) {
    case 'open': return GREEN;
    case 'close': return RED;
    case 'change': return YELLOW;
    default: return CYAN;
  }
}

export function formatAsText(event: PortEvent, options: FormatterOptions): string {
  const color = colorForEvent(event.type, options.colorize ?? false);
  const reset = options.colorize ? RESET : '';
  const ts = options.includeTimestamp !== false
    ? `[${new Date(event.timestamp).toISOString()}] `
    : '';
  return `${ts}${color}${event.type.toUpperCase()}${reset} port=${event.port} pid=${event.pid ?? '-'} process=${event.processName ?? 'unknown'}`;
}

export function formatAsJson(event: PortEvent, options: FormatterOptions): string {
  const payload: Record<string, unknown> = { ...event };
  if (options.includeTimestamp === false) {
    delete payload['timestamp'];
  }
  return JSON.stringify(payload);
}

export function formatAsCsv(event: PortEvent, options: FormatterOptions): string {
  const ts = options.includeTimestamp !== false ? new Date(event.timestamp).toISOString() : '';
  return [
    ts,
    event.type,
    event.port,
    event.pid ?? '',
    event.processName ?? ''
  ].join(',');
}

export function csvHeader(): string {
  return 'timestamp,type,port,pid,processName';
}

export function formatEvent(event: PortEvent, options: FormatterOptions): string {
  switch (options.format) {
    case 'json': return formatAsJson(event, options);
    case 'csv': return formatAsCsv(event, options);
    case 'text':
    default: return formatAsText(event, options);
  }
}
