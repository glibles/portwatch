import { scanPorts } from "./portScanner";
import { detectChanges, buildSnapshot, Snapshot } from "./changeDetector";
import { formatEvent } from "./processLogger";
import { loadConfig, PortwatchConfig } from "./config";
import * as fs from "fs";

export interface DaemonHandle {
  stop: () => void;
}

export function startDaemon(configPath?: string): DaemonHandle {
  const config: PortwatchConfig = loadConfig(configPath);
  const logStream = fs.createWriteStream(config.logFile, { flags: "a" });

  let previousSnapshot: Snapshot = {};
  let stopped = false;

  const tick = async (): Promise<void> => {
    if (stopped) return;

    try {
      const portInfos = await scanPorts();
      const filtered =
        config.ports === "all"
          ? portInfos
          : portInfos.filter((p) => (config.ports as number[]).includes(p.port));

      const currentSnapshot = buildSnapshot(filtered);
      const events = detectChanges(previousSnapshot, currentSnapshot);
      previousSnapshot = currentSnapshot;

      for (const event of events) {
        const line = formatEvent(event, config.logFormat);
        logStream.write(line + "\n");
        if (config.verbose) {
          process.stdout.write(line + "\n");
        }
      }
    } catch (err) {
      process.stderr.write(`[portwatch] scan error: ${(err as Error).message}\n`);
    }

    if (!stopped) {
      setTimeout(tick, config.intervalMs);
    }
  };

  // Kick off the first tick
  setTimeout(tick, 0);

  return {
    stop: () => {
      stopped = true;
      logStream.end();
    },
  };
}
