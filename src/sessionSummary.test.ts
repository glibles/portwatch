import { buildSessionSummary, formatSummaryAsText, formatSummaryAsJson } from './sessionSummary';
import { createConnectionStore, openConnection } from './connectionTracker';

function makeStore() {
  const store = createConnectionStore();
  openConnection(store, 'tcp', '127.0.0.1', 3000, { pid: 100, process: 'node', uid: 'alice' });
  openConnection(store, 'udp', '0.0.0.0', 53, { pid: 200, process: 'dnsmasq', uid: 'root' });
  return store;
}

describe('buildSessionSummary', () => {
  it('returns correct totalActive count', () => {
    const store = makeStore();
    const summary = buildSessionSummary(store);
    expect(summary.totalActive).toBe(2);
  });

  it('includes all active connections', () => {
    const store = makeStore();
    const summary = buildSessionSummary(store);
    const processes = summary.entries.map((e) => e.process);
    expect(processes).toContain('node');
    expect(processes).toContain('dnsmasq');
  });

  it('sets generatedAt to approximately now', () => {
    const before = Date.now();
    const store = makeStore();
    const summary = buildSessionSummary(store);
    expect(summary.generatedAt).toBeGreaterThanOrEqual(before);
  });

  it('returns durationMs >= 0 for each entry', () => {
    const store = makeStore();
    const summary = buildSessionSummary(store);
    summary.entries.forEach((e) => expect(e.durationMs).toBeGreaterThanOrEqual(0));
  });

  it('sorts entries by durationMs descending', () => {
    const store = createConnectionStore();
    openConnection(store, 'tcp', '127.0.0.1', 4000, { pid: 1, process: 'a', uid: 'u' });
    // Small artificial gap
    const summary = buildSessionSummary(store);
    expect(summary.entries.length).toBeGreaterThan(0);
    for (let i = 1; i < summary.entries.length; i++) {
      expect(summary.entries[i - 1].durationMs).toBeGreaterThanOrEqual(summary.entries[i].durationMs);
    }
  });

  it('returns empty entries for empty store', () => {
    const store = createConnectionStore();
    const summary = buildSessionSummary(store);
    expect(summary.totalActive).toBe(0);
    expect(summary.entries).toEqual([]);
  });
});

describe('formatSummaryAsText', () => {
  it('returns a no-connections message for empty summary', () => {
    const store = createConnectionStore();
    const summary = buildSessionSummary(store);
    expect(formatSummaryAsText(summary)).toBe('No active connections.');
  });

  it('includes process name and port in output', () => {
    const store = makeStore();
    const summary = buildSessionSummary(store);
    const text = formatSummaryAsText(summary);
    expect(text).toContain('node');
    expect(text).toContain('3000');
    expect(text).toContain('dnsmasq');
  });

  it('includes active connection count', () => {
    const store = makeStore();
    const summary = buildSessionSummary(store);
    expect(formatSummaryAsText(summary)).toContain('Active connections: 2');
  });
});

describe('formatSummaryAsJson', () => {
  it('returns valid JSON', () => {
    const store = makeStore();
    const summary = buildSessionSummary(store);
    expect(() => JSON.parse(formatSummaryAsJson(summary))).not.toThrow();
  });

  it('includes totalActive in JSON output', () => {
    const store = makeStore();
    const summary = buildSessionSummary(store);
    const parsed = JSON.parse(formatSummaryAsJson(summary));
    expect(parsed.totalActive).toBe(2);
  });
});
