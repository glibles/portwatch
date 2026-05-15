/**
 * connectionTracker.ts
 * Tracks active connections per port/protocol, recording open/close timestamps
 * and computing current connection counts for reporting.
 */

export interface ConnectionEntry {
  port: number;
  protocol: string;
  pid: number;
  openedAt: number;
  closedAt?: number;
}

export interface ConnectionStore {
  active: Map<string, ConnectionEntry>;
  history: ConnectionEntry[];
}

export function createConnectionStore(): ConnectionStore {
  return { active: new Map(), history: [] };
}

function connKey(port: number, protocol: string, pid: number): string {
  return `${port}:${protocol}:${pid}`;
}

export function openConnection(
  store: ConnectionStore,
  port: number,
  protocol: string,
  pid: number,
  timestamp: number = Date.now()
): void {
  const key = connKey(port, protocol, pid);
  if (!store.active.has(key)) {
    store.active.set(key, { port, protocol, pid, openedAt: timestamp });
  }
}

export function closeConnection(
  store: ConnectionStore,
  port: number,
  protocol: string,
  pid: number,
  timestamp: number = Date.now()
): void {
  const key = connKey(port, protocol, pid);
  const entry = store.active.get(key);
  if (entry) {
    const closed = { ...entry, closedAt: timestamp };
    store.history.push(closed);
    store.active.delete(key);
  }
}

export function activeCount(store: ConnectionStore): number {
  return store.active.size;
}

export function activeForPort(
  store: ConnectionStore,
  port: number,
  protocol?: string
): ConnectionEntry[] {
  const results: ConnectionEntry[] = [];
  for (const entry of store.active.values()) {
    if (entry.port === port && (protocol === undefined || entry.protocol === protocol)) {
      results.push(entry);
    }
  }
  return results;
}

export function getHistory(
  store: ConnectionStore,
  port?: number
): ConnectionEntry[] {
  if (port === undefined) return [...store.history];
  return store.history.filter((e) => e.port === port);
}

export function clearConnections(store: ConnectionStore): void {
  store.active.clear();
  store.history.length = 0;
}
