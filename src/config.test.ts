import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { loadConfig, mergeWithDefaults, PortwatchConfig } from "./config";

describe("mergeWithDefaults", () => {
  it("returns defaults when given empty object", () => {
    const config = mergeWithDefaults({});
    expect(config.intervalMs).toBe(5000);
    expect(config.logFile).toBe("portwatch.log");
    expect(config.ports).toBe("all");
    expect(config.logFormat).toBe("json");
    expect(config.verbose).toBe(false);
  });

  it("overrides individual fields", () => {
    const config = mergeWithDefaults({ intervalMs: 10000, verbose: true });
    expect(config.intervalMs).toBe(10000);
    expect(config.verbose).toBe(true);
    expect(config.logFile).toBe("portwatch.log");
  });

  it("accepts ports as an array", () => {
    const config = mergeWithDefaults({ ports: [80, 443, 8080] });
    expect(config.ports).toEqual([80, 443, 8080]);
  });

  it("throws if intervalMs is too low", () => {
    expect(() => mergeWithDefaults({ intervalMs: 100 })).toThrow("intervalMs must be at least 500ms");
  });

  it("throws on invalid logFormat", () => {
    expect(() => mergeWithDefaults({ logFormat: "csv" as PortwatchConfig["logFormat"] })).toThrow(
      'logFormat must be "json" or "text"'
    );
  });
});

describe("loadConfig", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "portwatch-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("returns defaults when no config file exists", () => {
    const config = loadConfig(path.join(tmpDir, "nonexistent.json"));
    expect(config.intervalMs).toBe(5000);
  });

  it("loads and merges a valid config file", () => {
    const cfgPath = path.join(tmpDir, "portwatch.config.json");
    fs.writeFileSync(cfgPath, JSON.stringify({ intervalMs: 2000, verbose: true }));
    const config = loadConfig(cfgPath);
    expect(config.intervalMs).toBe(2000);
    expect(config.verbose).toBe(true);
  });

  it("throws on malformed JSON", () => {
    const cfgPath = path.join(tmpDir, "portwatch.config.json");
    fs.writeFileSync(cfgPath, "{ bad json ");
    expect(() => loadConfig(cfgPath)).toThrow("Failed to parse config file");
  });
});
