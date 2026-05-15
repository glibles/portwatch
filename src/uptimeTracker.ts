import { PortEvent } from './changeDetector';

export interface UptimeEntry {
  port: number;
  protocol: string;
  pid: number;
  firstSeen: number;
  lastSeen: number;
  durationMs: number;
}

export type UptimeStore = Map<string, UptimeEntry>;

export function createUptimeStore(): UptimeStore {
  return new Map();
}

export function uptimeKey(port: number, protocol: string, pid: number): string {
  return `${protocol}:${port}:${pid}`;
}

export function recordOpen(
  store: UptimeStore,
  event: PortEvent,
  now: number = Date.now()
): void {
  const key = uptimeKey(event.port, event.protocol, event.pid);
  if (!store.has(key)) {
    store.set(key, {
      port: event.port,
      protocol: event.protocol,
      pid: event.pid,
      firstSeen: now,
      lastSeen: now,
      durationMs: 0,
    });
  }
}

export function recordClose(
  store: UptimeStore,
  event: PortEvent,
  now: number = Date.now()
): UptimeEntry | undefined {
  const key = uptimeKey(event.port, event.protocol, event.pid);
  const entry = store.get(key);
  if (!entry) return undefined;
  const closed: UptimeEntry = {
    ...entry,
    lastSeen: now,
    durationMs: now - entry.firstSeen,
  };
  store.delete(key);
  return closed;
}

export function tickUptime(
  store: UptimeStore,
  now: number = Date.now()
): void {
  for (const [key, entry] of store) {
    store.set(key, {
      ...entry,
      lastSeen: now,
      durationMs: now - entry.firstSeen,
    });
  }
}

export function getUptime(store: UptimeStore): UptimeEntry[] {
  return Array.from(store.values());
}
