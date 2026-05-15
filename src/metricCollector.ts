import { PortInfo } from './portScanner';
import { PortEvent } from './changeDetector';

export interface Metrics {
  totalScans: number;
  totalChanges: number;
  openPorts: number;
  closedPorts: number;
  newPorts: number;
  uptimeSeconds: number;
  lastScanAt: number | null;
  changesByProtocol: Record<string, number>;
}

export interface MetricStore {
  metrics: Metrics;
  startedAt: number;
}

export function createMetricStore(): MetricStore {
  return {
    startedAt: Date.now(),
    metrics: {
      totalScans: 0,
      totalChanges: 0,
      openPorts: 0,
      closedPorts: 0,
      newPorts: 0,
      uptimeSeconds: 0,
      lastScanAt: null,
      changesByProtocol: {},
    },
  };
}

export function recordScan(store: MetricStore, ports: PortInfo[]): void {
  store.metrics.totalScans += 1;
  store.metrics.lastScanAt = Date.now();
  store.metrics.openPorts = ports.length;
  store.metrics.uptimeSeconds = Math.floor(
    (Date.now() - store.startedAt) / 1000
  );
}

export function recordEvents(store: MetricStore, events: PortEvent[]): void {
  for (const event of events) {
    store.metrics.totalChanges += 1;
    if (event.type === 'closed') store.metrics.closedPorts += 1;
    if (event.type === 'opened') store.metrics.newPorts += 1;
    const proto = event.info.protocol;
    store.metrics.changesByProtocol[proto] =
      (store.metrics.changesByProtocol[proto] ?? 0) + 1;
  }
}

export function getMetrics(store: MetricStore): Metrics {
  return {
    ...store.metrics,
    uptimeSeconds: Math.floor((Date.now() - store.startedAt) / 1000),
  };
}

export function resetMetrics(store: MetricStore): void {
  const fresh = createMetricStore();
  fresh.startedAt = store.startedAt;
  store.metrics = fresh.metrics;
}
