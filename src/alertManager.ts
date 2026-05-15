import { PortEvent } from './changeDetector';

export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface Alert {
  severity: AlertSeverity;
  message: string;
  event: PortEvent;
  timestamp: Date;
}

export interface AlertRule {
  name: string;
  match: (event: PortEvent) => boolean;
  severity: AlertSeverity;
  messageTemplate: (event: PortEvent) => string;
}

const DEFAULT_RULES: AlertRule[] = [
  {
    name: 'privileged-port-opened',
    match: (e) => e.type === 'opened' && e.port < 1024,
    severity: 'warning',
    messageTemplate: (e) =>
      `Privileged port ${e.port} opened by process "${e.processName}" (PID ${e.pid})`,
  },
  {
    name: 'port-ownership-changed',
    match: (e) => e.type === 'changed',
    severity: 'critical',
    messageTemplate: (e) =>
      `Port ${e.port} ownership changed to "${e.processName}" (PID ${e.pid})`,
  },
  {
    name: 'port-closed',
    match: (e) => e.type === 'closed',
    severity: 'info',
    messageTemplate: (e) =>
      `Port ${e.port} closed (was held by "${e.processName}")`,
  },
];

export function evaluateAlerts(
  events: PortEvent[],
  rules: AlertRule[] = DEFAULT_RULES
): Alert[] {
  const alerts: Alert[] = [];

  for (const event of events) {
    for (const rule of rules) {
      if (rule.match(event)) {
        alerts.push({
          severity: rule.severity,
          message: rule.messageTemplate(event),
          event,
          timestamp: new Date(),
        });
        break;
      }
    }
  }

  return alerts;
}

export function formatAlert(alert: Alert): string {
  const ts = alert.timestamp.toISOString();
  const level = alert.severity.toUpperCase().padEnd(8);
  return `[${ts}] ${level} ${alert.message}`;
}
