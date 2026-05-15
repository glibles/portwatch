import * as fs from "fs";
import * as path from "path";

export interface PortwatchConfig {
  intervalMs: number;
  logFile: string;
  ports: number[] | "all";
  logFormat: "json" | "text";
  verbose: boolean;
}

const DEFAULTS: PortwatchConfig = {
  intervalMs: 5000,
  logFile: "portwatch.log",
  ports: "all",
  logFormat: "json",
  verbose: false,
};

export function loadConfig(configPath?: string): PortwatchConfig {
  const resolvedPath = configPath
    ? path.resolve(configPath)
    : path.resolve(process.cwd(), "portwatch.config.json");

  if (!fs.existsSync(resolvedPath)) {
    return { ...DEFAULTS };
  }

  let raw: unknown;
  try {
    const content = fs.readFileSync(resolvedPath, "utf-8");
    raw = JSON.parse(content);
  } catch (err) {
    throw new Error(`Failed to parse config file at ${resolvedPath}: ${(err as Error).message}`);
  }

  return mergeWithDefaults(raw as Partial<PortwatchConfig>);
}

export function mergeWithDefaults(partial: Partial<PortwatchConfig>): PortwatchConfig {
  const merged: PortwatchConfig = { ...DEFAULTS, ...partial };

  if (merged.intervalMs < 500) {
    throw new Error("intervalMs must be at least 500ms");
  }

  if (!merged.logFile || typeof merged.logFile !== "string") {
    throw new Error("logFile must be a non-empty string");
  }

  if (merged.logFormat !== "json" && merged.logFormat !== "text") {
    throw new Error('logFormat must be "json" or "text"');
  }

  return merged;
}
