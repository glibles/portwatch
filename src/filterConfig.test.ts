import { parseFilterConfig, defaultFilterRule } from './filterConfig';

describe('defaultFilterRule', () => {
  it('returns empty arrays for all fields', () => {
    const rule = defaultFilterRule();
    expect(rule.ports).toEqual([]);
    expect(rule.excludePorts).toEqual([]);
    expect(rule.processNames).toEqual([]);
    expect(rule.excludeProcessNames).toEqual([]);
    expect(rule.protocols).toEqual([]);
  });
});

describe('parseFilterConfig', () => {
  it('parses a valid config', () => {
    const rule = parseFilterConfig({
      ports: [80, 443],
      excludePorts: [22],
      processNames: ['nginx'],
      excludeProcessNames: ['sshd'],
      protocols: ['tcp'],
    });
    expect(rule.ports).toEqual([80, 443]);
    expect(rule.excludePorts).toEqual([22]);
    expect(rule.processNames).toEqual(['nginx']);
    expect(rule.excludeProcessNames).toEqual(['sshd']);
    expect(rule.protocols).toEqual(['tcp']);
  });

  it('ignores non-number values in port arrays', () => {
    const rule = parseFilterConfig({ ports: [80, 'bad', null, 443] });
    expect(rule.ports).toEqual([80, 443]);
  });

  it('ignores non-string values in name arrays', () => {
    const rule = parseFilterConfig({ processNames: ['node', 42, true, 'python'] });
    expect(rule.processNames).toEqual(['node', 'python']);
  });

  it('filters invalid protocol values', () => {
    const rule = parseFilterConfig({ protocols: ['tcp', 'icmp', 'udp', 123] });
    expect(rule.protocols).toEqual(['tcp', 'udp']);
  });

  it('handles missing fields gracefully', () => {
    const rule = parseFilterConfig({});
    expect(rule.ports).toEqual([]);
    expect(rule.protocols).toEqual([]);
    expect(rule.processNames).toEqual([]);
  });

  it('handles non-array fields gracefully', () => {
    const rule = parseFilterConfig({
      ports: 'not-an-array',
      processNames: 42,
    });
    expect(rule.ports).toEqual([]);
    expect(rule.processNames).toEqual([]);
  });
});
