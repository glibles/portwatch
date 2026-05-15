import { applyFilter, passesFilter, FilterRule } from './filterEngine';
import { PortInfo } from './portScanner';

const base: PortInfo = {
  port: 3000,
  protocol: 'tcp',
  pid: 1234,
  processName: 'node',
  address: '0.0.0.0',
};

describe('passesFilter', () => {
  it('passes when rule is empty', () => {
    expect(passesFilter(base, {})).toBe(true);
  });

  it('filters by protocol', () => {
    expect(passesFilter(base, { protocols: ['udp'] })).toBe(false);
    expect(passesFilter(base, { protocols: ['tcp'] })).toBe(true);
  });

  it('filters by port allowlist', () => {
    expect(passesFilter(base, { ports: [8080] })).toBe(false);
    expect(passesFilter(base, { ports: [3000, 8080] })).toBe(true);
  });

  it('filters by port blocklist', () => {
    expect(passesFilter(base, { excludePorts: [3000] })).toBe(false);
    expect(passesFilter(base, { excludePorts: [8080] })).toBe(true);
  });

  it('filters by process name allowlist', () => {
    expect(passesFilter(base, { processNames: ['python'] })).toBe(false);
    expect(passesFilter(base, { processNames: ['node'] })).toBe(true);
  });

  it('filters by process name blocklist', () => {
    expect(passesFilter(base, { excludeProcessNames: ['node'] })).toBe(false);
    expect(passesFilter(base, { excludeProcessNames: ['python'] })).toBe(true);
  });

  it('applies multiple rules together', () => {
    const rule: FilterRule = { protocols: ['tcp'], ports: [3000], processNames: ['node'] };
    expect(passesFilter(base, rule)).toBe(true);

    const failing: FilterRule = { protocols: ['tcp'], ports: [3000], processNames: ['python'] };
    expect(passesFilter(base, failing)).toBe(false);
  });
});

describe('applyFilter', () => {
  const entries: PortInfo[] = [
    { ...base, port: 3000, processName: 'node' },
    { ...base, port: 5432, protocol: 'tcp', processName: 'postgres' },
    { ...base, port: 53, protocol: 'udp', processName: 'systemd-resolved' },
  ];

  it('returns all entries with empty rule', () => {
    expect(applyFilter(entries, {})).toHaveLength(3);
  });

  it('filters to only tcp entries', () => {
    const result = applyFilter(entries, { protocols: ['tcp'] });
    expect(result).toHaveLength(2);
    expect(result.every((e) => e.protocol === 'tcp')).toBe(true);
  });

  it('excludes specific ports', () => {
    const result = applyFilter(entries, { excludePorts: [53, 5432] });
    expect(result).toHaveLength(1);
    expect(result[0].port).toBe(3000);
  });

  it('returns empty array when nothing matches', () => {
    expect(applyFilter(entries, { ports: [9999] })).toHaveLength(0);
  });
});
