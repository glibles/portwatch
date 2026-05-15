import { PortInfo } from './portScanner';
import { PortEvent } from './processLogger';

export type PortSnapshot = Map<string, PortInfo>;

function makeKey(info: PortInfo): string {
  return `${info.port}/${info.protocol}`;
}

function infoToEvent(
  info: PortInfo,
  eventType: PortEvent['event'],
  timestamp: string
): PortEvent {
  return {
    timestamp,
    port: info.port,
    protocol: info.protocol,
    pid: info.pid,
    processName: info.processName,
    state: info.state,
    event: eventType,
  };
}

export function detectChanges(
  previous: PortSnapshot,
  current: PortSnapshot,
  timestamp: string = new Date().toISOString()
): PortEvent[] {
  const events: PortEvent[] = [];

  for (const [key, info] of current) {
    if (!previous.has(key)) {
      events.push(infoToEvent(info, 'opened', timestamp));
    } else {
      const prev = previous.get(key)!;
      if (prev.pid !== info.pid || prev.processName !== info.processName) {
        events.push(infoToEvent(info, 'changed', timestamp));
      }
    }
  }

  for (const [key, info] of previous) {
    if (!current.has(key)) {
      events.push(infoToEvent(info, 'closed', timestamp));
    }
  }

  return events;
}

export function buildSnapshot(ports: PortInfo[]): PortSnapshot {
  const snapshot: PortSnapshot = new Map();
  for (const info of ports) {
    snapshot.set(makeKey(info), info);
  }
  return snapshot;
}
