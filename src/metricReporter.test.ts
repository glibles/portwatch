import { formatMetricsAsText, formatMetricsAsJson, reportMetrics } from './metricReporter';
import { Metrics } from './metricCollector';

const sampleMetrics: Metrics = {
  totalScans: 10,
  totalChanges: 4,
  openPorts: 5,
  closedPorts: 2,
  newPorts: 2,
  uptimeSeconds: 120,
  lastScanAt: 1700000000000,
  changesByProtocol: { tcp: 3, udp: 1 },
};

describe('metricReporter', () => {
  describe('formatMetricsAsText', () => {
    it('includes key metric fields', () => {
      const output = formatMetricsAsText(sampleMetrics);
      expect(output).toContain('Total scans  : 10');
      expect(output).toContain('Total changes: 4');
      expect(output).toContain('Open ports   : 5');
      expect(output).toContain('Uptime       : 120s');
    });

    it('includes protocol breakdown when enabled', () => {
      const output = formatMetricsAsText(sampleMetrics, true);
      expect(output).toContain('tcp: 3');
      expect(output).toContain('udp: 1');
    });

    it('omits protocol breakdown when disabled', () => {
      const output = formatMetricsAsText(sampleMetrics, false);
      expect(output).not.toContain('tcp: 3');
    });

    it('shows never for null lastScanAt', () => {
      const m = { ...sampleMetrics, lastScanAt: null };
      expect(formatMetricsAsText(m)).toContain('never');
    });
  });

  describe('formatMetricsAsJson', () => {
    it('returns valid JSON', () => {
      const output = formatMetricsAsJson(sampleMetrics);
      expect(() => JSON.parse(output)).not.toThrow();
    });

    it('includes all metric keys', () => {
      const parsed = JSON.parse(formatMetricsAsJson(sampleMetrics));
      expect(parsed.totalScans).toBe(10);
      expect(parsed.changesByProtocol.tcp).toBe(3);
    });
  });

  describe('reportMetrics', () => {
    it('delegates to text formatter', () => {
      const output = reportMetrics(sampleMetrics, { format: 'text' });
      expect(output).toContain('portwatch metrics');
    });

    it('delegates to json formatter', () => {
      const output = reportMetrics(sampleMetrics, { format: 'json' });
      const parsed = JSON.parse(output);
      expect(parsed.totalScans).toBe(10);
    });

    it('passes includeProtocolBreakdown to text formatter', () => {
      const output = reportMetrics(sampleMetrics, { format: 'text', includeProtocolBreakdown: false });
      expect(output).not.toContain('tcp:');
    });
  });
});
