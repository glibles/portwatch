import { evaluateAlerts, formatAlert, AlertRule, Alert } from './alertManager';
import { PortEvent } from './changeDetector';

const makeEvent = (overrides: Partial<PortEvent> = {}): PortEvent => ({
  type: 'opened',
  port: 8080,
  protocol: 'tcp',
  pid: 1234,
  processName: 'node',
  timestamp: new Date('2024-01-15T10:00:00Z'),
  ...overrides,
});

describe('evaluateAlerts', () => {
  it('returns warning for privileged port opened', () => {
    const events = [makeEvent({ port: 80, type: 'opened' })];
    const alerts = evaluateAlerts(events);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].severity).toBe('warning');
    expect(alerts[0].message).toContain('80');
    expect(alerts[0].message).toContain('node');
  });

  it('returns critical alert for ownership change', () => {
    const events = [makeEvent({ type: 'changed', port: 3000 })];
    const alerts = evaluateAlerts(events);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].severity).toBe('critical');
    expect(alerts[0].message).toContain('3000');
  });

  it('returns info alert for closed port', () => {
    const events = [makeEvent({ type: 'closed', port: 8080 })];
    const alerts = evaluateAlerts(events);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].severity).toBe('info');
  });

  it('returns no alert for non-privileged opened port with default rules', () => {
    const events = [makeEvent({ type: 'opened', port: 8080 })];
    const alerts = evaluateAlerts(events);
    expect(alerts).toHaveLength(0);
  });

  it('processes multiple events', () => {
    const events = [
      makeEvent({ port: 443, type: 'opened' }),
      makeEvent({ port: 3000, type: 'changed' }),
      makeEvent({ port: 5000, type: 'closed' }),
    ];
    const alerts = evaluateAlerts(events);
    expect(alerts).toHaveLength(3);
  });

  it('supports custom rules', () => {
    const customRules: AlertRule[] = [
      {
        name: 'any-open',
        match: (e) => e.type === 'opened',
        severity: 'info',
        messageTemplate: (e) => `Port ${e.port} opened`,
      },
    ];
    const events = [makeEvent({ type: 'opened', port: 9000 })];
    const alerts = evaluateAlerts(events, customRules);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].message).toBe('Port 9000 opened');
  });
});

describe('formatAlert', () => {
  it('formats alert with severity and message', () => {
    const alert: Alert = {
      severity: 'warning',
      message: 'Test alert message',
      event: makeEvent(),
      timestamp: new Date('2024-01-15T10:00:00Z'),
    };
    const formatted = formatAlert(alert);
    expect(formatted).toContain('2024-01-15T10:00:00.000Z');
    expect(formatted).toContain('WARNING');
    expect(formatted).toContain('Test alert message');
  });
});
