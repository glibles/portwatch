import { formatDuration, formatUptimeAsText, formatUptimeAsJson, reportUptime } from './uptimeReporter';
import { createUptimeStore, recordOpen, recordClose } from './uptimeTracker';

describe('formatDuration', () => {
  it('formats seconds only', () => {
    expect(formatDuration(45)).toBe('45s');
  });

  it('formats minutes and seconds', () => {
    expect(formatDuration(125)).toBe('2m 5s');
  });

  it('formats hours, minutes, seconds', () => {
    expect(formatDuration(3661)).toBe('1h 1m 1s');
  });

  it('formats zero duration', () => {
    expect(formatDuration(0)).toBe('0s');
  });

  it('formats exactly one hour', () => {
    expect(formatDuration(3600)).toBe('1h 0m 0s');
  });
});

describe('formatUptimeAsText', () => {
  it('returns header and rows for each port', () => {
    const store = createUptimeStore();
    const now = Date.now();
    recordOpen(store, 8080, 'tcp', now - 5000);
    recordClose(store, 8080, 'tcp', now);
    const result = formatUptimeAsText(store, now);
    expect(result).toContain('PORT');
    expect(result).toContain('8080');
    expect(result).toContain('tcp');
  });

  it('returns empty message when no data', () => {
    const store = createUptimeStore();
    const result = formatUptimeAsText(store, Date.now());
    expect(result).toContain('No uptime data');
  });
});

describe('formatUptimeAsJson', () => {
  it('returns array of uptime records', () => {
    const store = createUptimeStore();
    const now = Date.now();
    recordOpen(store, 3000, 'tcp', now - 10000);
    recordClose(store, 3000, 'tcp', now);
    const result = formatUptimeAsJson(store, now);
    const parsed = JSON.parse(result);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0].port).toBe(3000);
    expect(parsed[0].protocol).toBe('tcp');
    expect(typeof parsed[0].totalSeconds).toBe('number');
  });

  it('returns empty array when no data', () => {
    const store = createUptimeStore();
    const result = formatUptimeAsJson(store, Date.now());
    expect(JSON.parse(result)).toEqual([]);
  });
});

describe('reportUptime', () => {
  it('calls text formatter for text format', () => {
    const store = createUptimeStore();
    const output = reportUptime(store, 'text', Date.now());
    expect(typeof output).toBe('string');
  });

  it('calls json formatter for json format', () => {
    const store = createUptimeStore();
    const output = reportUptime(store, 'json', Date.now());
    expect(() => JSON.parse(output)).not.toThrow();
  });

  it('defaults to text for unknown format', () => {
    const store = createUptimeStore();
    const output = reportUptime(store, 'xml' as any, Date.now());
    expect(typeof output).toBe('string');
  });
});
