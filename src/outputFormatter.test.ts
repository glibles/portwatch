import { formatEvent, formatAsText, formatAsJson, formatAsCsv, csvHeader } from './outputFormatter';
import { PortEvent } from './processLogger';

const mockEvent: PortEvent = {
  type: 'open',
  port: 3000,
  pid: 1234,
  processName: 'node',
  timestamp: new Date('2024-01-15T10:00:00.000Z').getTime()
};

describe('outputFormatter', () => {
  describe('formatAsText', () => {
    it('includes timestamp by default', () => {
      const result = formatAsText(mockEvent, { format: 'text' });
      expect(result).toContain('2024-01-15T10:00:00.000Z');
    });

    it('omits timestamp when includeTimestamp is false', () => {
      const result = formatAsText(mockEvent, { format: 'text', includeTimestamp: false });
      expect(result).not.toContain('2024-01-15');
    });

    it('contains event type, port, pid, and process name', () => {
      const result = formatAsText(mockEvent, { format: 'text', includeTimestamp: false });
      expect(result).toContain('OPEN');
      expect(result).toContain('port=3000');
      expect(result).toContain('pid=1234');
      expect(result).toContain('process=node');
    });

    it('uses dash for missing pid', () => {
      const event = { ...mockEvent, pid: undefined };
      const result = formatAsText(event, { format: 'text', includeTimestamp: false });
      expect(result).toContain('pid=-');
    });
  });

  describe('formatAsJson', () => {
    it('returns valid JSON', () => {
      const result = formatAsJson(mockEvent, { format: 'json' });
      expect(() => JSON.parse(result)).not.toThrow();
    });

    it('includes all event fields', () => {
      const parsed = JSON.parse(formatAsJson(mockEvent, { format: 'json' }));
      expect(parsed.type).toBe('open');
      expect(parsed.port).toBe(3000);
      expect(parsed.pid).toBe(1234);
      expect(parsed.processName).toBe('node');
    });
  });

  describe('formatAsCsv', () => {
    it('returns comma-separated values', () => {
      const result = formatAsCsv(mockEvent, { format: 'csv' });
      const parts = result.split(',');
      expect(parts).toHaveLength(5);
    });

    it('includes correct values in order', () => {
      const result = formatAsCsv(mockEvent, { format: 'csv' });
      expect(result).toContain('open');
      expect(result).toContain('3000');
      expect(result).toContain('1234');
      expect(result).toContain('node');
    });
  });

  describe('csvHeader', () => {
    it('returns correct header columns', () => {
      expect(csvHeader()).toBe('timestamp,type,port,pid,processName');
    });
  });

  describe('formatEvent', () => {
    it('delegates to text formatter', () => {
      const result = formatEvent(mockEvent, { format: 'text', includeTimestamp: false });
      expect(result).toContain('OPEN');
    });

    it('delegates to json formatter', () => {
      const result = formatEvent(mockEvent, { format: 'json' });
      expect(() => JSON.parse(result)).not.toThrow();
    });

    it('delegates to csv formatter', () => {
      const result = formatEvent(mockEvent, { format: 'csv' });
      expect(result.split(',').length).toBe(5);
    });
  });
});
