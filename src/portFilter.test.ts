import { applyPortFilter, inRange, matchesPort } from './portFilter';
import { PortInfo } from './portScanner';

const makePort = (overrides: Partial<PortInfo> = {}): PortInfo => ({
  port: 8080,
  protocol: 'tcp',
  pid: 1234,
  process: 'node',
  address: '0.0.0.0',
  ...overrides,
});

describe('inRange', () => {
  it('returns true when port is within a range', () => {
    expect(inRange(443, [{ from: 400, to: 500 }])).toBe(true);
  });

  it('returns false when port is outside all ranges', () => {
    expect(inRange(80, [{ from: 400, to: 500 }])).toBe(false);
  });

  it('returns true for boundary values', () => {
    expect(inRange(400, [{ from: 400, to: 500 }])).toBe(true);
    expect(inRange(500, [{ from: 400, to: 500 }])).toBe(true);
  });

  it('returns false for empty ranges array', () => {
    expect(inRange(80, [])).toBe(false);
  });
});

describe('matchesPort', () => {
  it('passes when no filters are set', () => {
    expect(matchesPort(makePort(), {})).toBe(true);
  });

  it('filters by includeProtocols', () => {
    expect(matchesPort(makePort({ protocol: 'udp' }), { includeProtocols: ['tcp'] })).toBe(false);
    expect(matchesPort(makePort({ protocol: 'tcp' }), { includeProtocols: ['tcp'] })).toBe(true);
  });

  it('filters by excludeProtocols', () => {
    expect(matchesPort(makePort({ protocol: 'tcp' }), { excludeProtocols: ['tcp'] })).toBe(false);
    expect(matchesPort(makePort({ protocol: 'udp' }), { excludeProtocols: ['tcp'] })).toBe(true);
  });

  it('filters by includePorts', () => {
    expect(matchesPort(makePort({ port: 80 }), { includePorts: [443, 8080] })).toBe(false);
    expect(matchesPort(makePort({ port: 8080 }), { includePorts: [443, 8080] })).toBe(true);
  });

  it('filters by excludePorts', () => {
    expect(matchesPort(makePort({ port: 22 }), { excludePorts: [22] })).toBe(false);
    expect(matchesPort(makePort({ port: 80 }), { excludePorts: [22] })).toBe(true);
  });

  it('filters by includeRanges when no includePorts set', () => {
    expect(matchesPort(makePort({ port: 3000 }), { includeRanges: [{ from: 3000, to: 4000 }] })).toBe(true);
    expect(matchesPort(makePort({ port: 80 }), { includeRanges: [{ from: 3000, to: 4000 }] })).toBe(false);
  });

  it('filters by excludeRanges', () => {
    expect(matchesPort(makePort({ port: 3500 }), { excludeRanges: [{ from: 3000, to: 4000 }] })).toBe(false);
  });

  it('filters by includePids', () => {
    expect(matchesPort(makePort({ pid: 999 }), { includePids: [1234] })).toBe(false);
    expect(matchesPort(makePort({ pid: 1234 }), { includePids: [1234] })).toBe(true);
  });

  it('filters by excludePids', () => {
    expect(matchesPort(makePort({ pid: 1234 }), { excludePids: [1234] })).toBe(false);
  });
});

describe('applyPortFilter', () => {
  const ports = [
    makePort({ port: 80, protocol: 'tcp', pid: 1 }),
    makePort({ port: 443, protocol: 'tcp', pid: 2 }),
    makePort({ port: 53, protocol: 'udp', pid: 3 }),
  ];

  it('returns all ports when no filters applied', () => {
    expect(applyPortFilter(ports, {})).toHaveLength(3);
  });

  it('filters to only tcp ports', () => {
    const result = applyPortFilter(ports, { includeProtocols: ['tcp'] });
    expect(result).toHaveLength(2);
    expect(result.every((p) => p.protocol === 'tcp')).toBe(true);
  });

  it('excludes specific ports', () => {
    const result = applyPortFilter(ports, { excludePorts: [80] });
    expect(result.map((p) => p.port)).not.toContain(80);
  });

  it('returns empty array when all ports excluded', () => {
    const result = applyPortFilter(ports, { excludeProtocols: ['tcp', 'udp'] });
    expect(result).toHaveLength(0);
  });
});
