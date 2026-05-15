import { UptimeEntry } from './uptimeTracker';

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

export function formatUptimeAsText(entries: UptimeEntry[]): string {
  if (entries.length === 0) return 'No active port sessions.';
  const lines = entries.map(
    (e) =>
      `${e.protocol.toUpperCase()}:${e.port}\tpid=${e.pid}\tprocess=${e.process ?? '?'}\tuptime=${formatDuration(e.durationMs)}`
  );
  return lines.join('\n');
}

export function formatUptimeAsJson(entries: UptimeEntry[]): string {
  return JSON.stringify(
    entries.map((e) => ({
      port: e.port,
      protocol: e.protocol,
      pid: e.pid,
      firstSeen: e.firstSeen,
      lastSeen: e.lastSeen,
      durationMs: e.durationMs,
      durationHuman: formatDuration(e.durationMs),
    })),
    null,
    2
  );
}

export function reportUptime(
  entries: UptimeEntry[],
  format: 'text' | 'json' = 'text'
): string {
  return format === 'json'
    ? formatUptimeAsJson(entries)
    : formatUptimeAsText(entries);
}
