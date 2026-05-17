import {
  buildReport,
  formatReportAsText,
  formatReportAsJson,
  reportWatchdog,
} from "./watchdogReporter";
import { createWatchdogStore, tickWatchdog } from "./watchdogTimer";

describe("buildReport", () => {
  it("reports healthy when no tick has occurred", () => {
    const store = createWatchdogStore(1000);
    const report = buildReport(store, 5000);
    expect(report.healthy).toBe(true);
    expect(report.missedTicks).toBe(0);
    expect(report.lastTickAt).toBeNull();
  });

  it("reports unhealthy when stalled", () => {
    const store = createWatchdogStore(1000, 2);
    tickWatchdog(store, 0);
    const report = buildReport(store, 3000);
    expect(report.healthy).toBe(false);
    expect(report.missedTicks).toBeGreaterThanOrEqual(2);
  });

  it("includes intervalMs", () => {
    const store = createWatchdogStore(2000);
    const report = buildReport(store, 0);
    expect(report.intervalMs).toBe(2000);
  });
});

describe("formatReportAsText", () => {
  it("includes OK status for healthy report", () => {
    const store = createWatchdogStore(1000);
    const report = buildReport(store, 0);
    const text = formatReportAsText(report);
    expect(text).toContain("status=OK");
    expect(text).toContain("lastTick=never");
  });

  it("includes STALLED status for unhealthy report", () => {
    const store = createWatchdogStore(1000, 2);
    tickWatchdog(store, 0);
    const report = buildReport(store, 3000);
    const text = formatReportAsText(report);
    expect(text).toContain("status=STALLED");
  });

  it("includes ISO timestamp when lastTickAt is set", () => {
    const store = createWatchdogStore(1000);
    tickWatchdog(store, 0);
    const report = buildReport(store, 500);
    const text = formatReportAsText(report);
    expect(text).toContain("1970-01-01T");
  });
});

describe("formatReportAsJson", () => {
  it("returns valid JSON with watchdog key", () => {
    const store = createWatchdogStore(1000);
    const report = buildReport(store, 0);
    const json = JSON.parse(formatReportAsJson(report));
    expect(json).toHaveProperty("watchdog");
    expect(json.watchdog).toHaveProperty("healthy");
  });
});

describe("reportWatchdog", () => {
  it("defaults to text format", () => {
    const store = createWatchdogStore(1000);
    const result = reportWatchdog(store, "text", 0);
    expect(result).toContain("watchdog");
  });

  it("returns JSON when requested", () => {
    const store = createWatchdogStore(1000);
    const result = reportWatchdog(store, "json", 0);
    const parsed = JSON.parse(result);
    expect(parsed.watchdog).toBeDefined();
  });
});
