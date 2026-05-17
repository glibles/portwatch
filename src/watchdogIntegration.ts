/**
 * watchdogIntegration.ts
 * Wires the watchdog timer into the daemon scan loop.
 * Call onScanStart each cycle and onScanComplete after each successful scan.
 */

import {
  WatchdogStore,
  createWatchdogStore,
  tickWatchdog,
  checkWatchdog,
  resetWatchdog,
} from "./watchdogTimer";
import { reportWatchdog } from "./watchdogReporter";

export interface WatchdogIntegration {
  store: WatchdogStore;
  onScanComplete: (now?: number) => void;
  onScanStart: (now?: number) => void;
  getStatus: (format?: "text" | "json", now?: number) => string;
  shutdown: () => void;
}

export function createWatchdogIntegration(
  intervalMs: number,
  maxMissedTicks = 3,
  onStall?: (missedTicks: number) => void
): WatchdogIntegration {
  const store = createWatchdogStore(intervalMs, maxMissedTicks);

  function onScanComplete(now = Date.now()): void {
    tickWatchdog(store, now);
  }

  function onScanStart(now = Date.now()): void {
    const { stalled, missedTicks } = checkWatchdog(store, now);
    if (stalled && onStall) {
      onStall(missedTicks);
    }
  }

  function getStatus(
    format: "text" | "json" = "text",
    now = Date.now()
  ): string {
    return reportWatchdog(store, format, now);
  }

  function shutdown(): void {
    resetWatchdog(store);
  }

  return { store, onScanComplete, onScanStart, getStatus, shutdown };
}
