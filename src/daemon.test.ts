import { startDaemon, DaemonHandle } from "./daemon";
import * as portScanner from "./portScanner";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

jest.mock("./portScanner");

const mockScanPorts = portScanner.scanPorts as jest.MockedFunction<typeof portScanner.scanPorts>;

describe("startDaemon", () => {
  let tmpDir: string;
  let configPath: string;
  let logFile: string;

  beforeEach(() => {
    jest.useFakeTimers();
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "portwatch-daemon-"));
    logFile = path.join(tmpDir, "test.log");
    configPath = path.join(tmpDir, "portwatch.config.json");
    fs.writeFileSync(
      configPath,
      JSON.stringify({ intervalMs: 1000, logFile, logFormat: "json", verbose: false })
    );
    mockScanPorts.mockResolvedValue([]);
  });

  afterEach(() => {
    jest.useRealTimers();
    fs.rmSync(tmpDir, { recursive: true, force: true });
    jest.clearAllMocks();
  });

  it("returns a handle with a stop function", () => {
    const handle: DaemonHandle = startDaemon(configPath);
    expect(typeof handle.stop).toBe("function");
    handle.stop();
  });

  it("calls scanPorts on the first tick", async () => {
    startDaemon(configPath);
    await jest.runAllTimersAsync();
    expect(mockScanPorts).toHaveBeenCalledTimes(1);
  });

  it("logs change events to the log file", async () => {
    mockScanPorts.mockResolvedValueOnce([
      { port: 3000, pid: 42, process: "node", protocol: "tcp" },
    ]);
    startDaemon(configPath);
    await jest.runAllTimersAsync();
    // Allow write stream to flush
    await new Promise((r) => setTimeout(r, 50));
    const contents = fs.existsSync(logFile) ? fs.readFileSync(logFile, "utf-8") : "";
    expect(contents).toContain("3000");
  });

  it("stops scanning after stop() is called", async () => {
    const handle = startDaemon(configPath);
    await jest.runAllTimersAsync();
    handle.stop();
    const callCount = mockScanPorts.mock.calls.length;
    await jest.runAllTimersAsync();
    expect(mockScanPorts.mock.calls.length).toBe(callCount);
  });
});
