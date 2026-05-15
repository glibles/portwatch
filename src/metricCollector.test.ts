import {
  createMetricStore,
  recordScan,
  recordEvents,
  getMetrics,
  resetMetrics,
} from './metricCollector';
import { PortInfo } from './portScanner';
import { PortEvent } from './changeDetector';

const mockPort = (port: number, protocol: 'tcp' | 'udp' = 'tcp'): PortInfo => ({
  port,
  protocol,
  pid: 1234,
  process: 'node',
  address: '127.0.0.1',
});

const mockEvent = (type: 'opened' | 'closed' | 'changed', protocol: 'tcp' | 'udp' = 'tcp'): PortEvent => ({
  type,
  timestamp: Date.now(),
  info: mockPort(3000, protocol),
  previous: undefined,
});

describe('metricCollector', () => {
  it('creates a store with zero metrics', () => {
    const store = createMetricStore();
    expect(store.metrics.totalScans).toBe(0);
    expect(store.metrics.totalChanges).toBe(0);
    expect(store.metrics.openPorts).toBe(0);
  });

  it('recordScan increments totalScans and sets openPorts', () => {
    const store = createMetricStore();
    recordScan(store, [mockPort(3000), mockPort(8080)]);
    expect(store.metrics.totalScans).toBe(1);
    expect(store.metrics.openPorts).toBe(2);
    expect(store.metrics.lastScanAt).not.toBeNull();
  });

  it('recordEvents increments totalChanges and counters', () => {
    const store = createMetricStore();
    recordEvents(store, [mockEvent('opened'), mockEvent('closed')]);
    expect(store.metrics.totalChanges).toBe(2);
    expect(store.metrics.newPorts).toBe(1);
    expect(store.metrics.closedPorts).toBe(1);
  });

  it('tracks changesByProtocol', () => {
    const store = createMetricStore();
    recordEvents(store, [mockEvent('opened', 'tcp'), mockEvent('opened', 'udp'), mockEvent('closed', 'tcp')]);
    expect(store.metrics.changesByProtocol['tcp']).toBe(2);
    expect(store.metrics.changesByProtocol['udp']).toBe(1);
  });

  it('getMetrics returns a snapshot with current uptime', () => {
    const store = createMetricStore();
    const m = getMetrics(store);
    expect(m.uptimeSeconds).toBeGreaterThanOrEqual(0);
  });

  it('resetMetrics zeroes counters but preserves startedAt', () => {
    const store = createMetricStore();
    recordScan(store, [mockPort(3000)]);
    recordEvents(store, [mockEvent('opened')]);
    const originalStart = store.startedAt;
    resetMetrics(store);
    expect(store.metrics.totalScans).toBe(0);
    expect(store.metrics.totalChanges).toBe(0);
    expect(store.startedAt).toBe(originalStart);
  });
});
