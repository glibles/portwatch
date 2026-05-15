import { ConnectionStore, listActive } from './connectionTracker';

export interface SessionSummaryEntry {
  key: string;
  protocol: string;
  address: string;
  port: number;
  pid: number;
  process: string;
  uid: string;
  durationMs: number;
}

export interface SessionSummary {
  totalActive: number;
  entries: SessionSummaryEntry[];
  generatedAt: number;
}

export function buildSessionSummary(store: ConnectionStore): SessionSummary {
  const now = Date.now();
  const active = listActive(store);

  const entries: SessionSummaryEntry[] = active.map((conn) => ({
    key: conn.key,
    protocol: conn.protocol,
    address: conn.address,
    port: conn.port,
    pid: conn.pid,
    process: conn.process,
    uid: conn.uid,
    durationMs: now - conn.openedAt,
  }));

  entries.sort((a, b) => b.durationMs - a.durationMs);

  return {
    totalActive: entries.length,
    entries,
    generatedAt: now,
  };
}

export function formatSummaryAsText(summary: SessionSummary): string {
  if (summary.totalActive === 0) {
    return 'No active connections.';
  }
  const lines = [
    `Active connections: ${summary.totalActive}`,
    '',
    ...summary.entries.map(
      (e) =>
        `  [${e.protocol.toUpperCase()}] ${e.address}:${e.port} — pid=${e.pid} process=${e.process} uid=${e.uid} uptime=${e.durationMs}ms`
    ),
  ];
  return lines.join('\n');
}

export function formatSummaryAsJson(summary: SessionSummary): string {
  return JSON.stringify(summary, null, 2);
}
