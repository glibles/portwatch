import { detectChanges, buildSnapshot, PortSnapshot } from './changeDetector';
import { PortInfo } from './portScanner';

const makePort = (overrides: Partial<PortInfo> = {}): PortInfo => ({
  port: 8080,
  protocol: 'tcp',
  pid: 100,
  processName: 'node',
  state: 'LISTEN',
  ...overrides,
});

const TS = '2024-01-15T10:00:00.000Z';

describe('buildSnapshot', () => {
  it('creates a map keyed by port/protocol', () => {
    const ports = [makePort({ port: 3000 }), makePort({ port: 5432, protocol: 'tcp' })];
    const snap = buildSnapshot(ports);
    expect(snap.has('3000/tcp')).toBe(true);
    expect(snap.has('5432/tcp')).toBe(true);
    expect(snap.size).toBe(2);
  });

  it('returns empty map for empty input', () => {
    expect(buildSnapshot([]).size).toBe(0);
  });
});

describe('detectChanges', () => {
  it('detects newly opened ports', () => {
    const prev: PortSnapshot = new Map();
    const curr = buildSnapshot([makePort({ port: 9000 })]);
    const events = detectChanges(prev, curr, TS);
    expect(events).toHaveLength(1);
    expect(events[0].event).toBe('opened');
    expect(events[0].port).toBe(9000);
  });

  it('detects closed ports', () => {
    const prev = buildSnapshot([makePort({ port: 9000 })]);
    const curr: PortSnapshot = new Map();
    const events = detectChanges(prev, curr, TS);
    expect(events).toHaveLength(1);
    expect(events[0].event).toBe('closed');
  });

  it('detects pid change as changed event', () => {
    const prev = buildSnapshot([makePort({ pid: 100 })]);
    const curr = buildSnapshot([makePort({ pid: 200 })]);
    const events = detectChanges(prev, curr, TS);
    expect(events).toHaveLength(1);
    expect(events[0].event).toBe('changed');
    expect(events[0].pid).toBe(200);
  });

  it('detects processName change as changed event', () => {
    const prev = buildSnapshot([makePort({ processName: 'node' })]);
    const curr = buildSnapshot([makePort({ processName: 'python' })]);
    const events = detectChanges(prev, curr, TS);
    expect(events).toHaveLength(1);
    expect(events[0].event).toBe('changed');
  });

  it('returns no events when nothing changed', () => {
    const snap = buildSnapshot([makePort()]);
    const events = detectChanges(snap, snap, TS);
    expect(events).toHaveLength(0);
  });

  it('attaches correct timestamp to events', () => {
    const prev: PortSnapshot = new Map();
    const curr = buildSnapshot([makePort()]);
    const events = detectChanges(prev, curr, TS);
    expect(events[0].timestamp).toBe(TS);
  });
});
