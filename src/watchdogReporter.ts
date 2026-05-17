/**
 * watchdogReporter.ts
 * Formats watchdog health status for logging and output.
 */

import { WatchdogStore, checkWatchdog } from "./watchdogTimer";

export interface WatchdogReport {
  healthy: boolean;
  missedTicks: number;
  lastTickAt: number | null;
  intervalMs: number;
}

export function buildReport(
  store: WatchdogStore,
  now = Date.now()
): WatchdogReport {
  const { stalled, missedTicks } = checkWatchdog(store, now);
  return {
    healthy: !stalled,
    missedTicks,
    lastTickAt: store.lastTickAt,
    intervalMs: store.intervalMs,
  };
}

export function formatReportAsText(report: WatchdogReport): string {
  const status = report.healthy ? "OK" : "STALLED";
  const last =
    report.lastTickAt !== null
      ? new Date(report.lastTickAt).toISOString()
      : "never";
  return (
    `watchdog status=${status} ` +
    `missed=${report.missedTicks} ` +
    `interval=${report.intervalMs}ms ` +
    `lastTick=${last}`
  );
}

export function formatReportAsJson(report: WatchdogReport): string {
  return JSON.stringify({ watchdog: report });
}

export function reportWatchdog(
  store: WatchdogStore,
  format: "text" | "json" = "text",
  now = Date.now()
): string {
  const report = buildReport(store, now);
  return format === "json"
    ? formatReportAsJson(report)
    : formatReportAsText(report);
}
