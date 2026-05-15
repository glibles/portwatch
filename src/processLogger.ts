import * as fs from 'fs';
import * as path from 'path';

export interface PortEvent {
  timestamp: string;
  port: number;
  protocol: string;
  pid: number | null;
  processName: string | null;
  state: string;
  event: 'opened' | 'closed' | 'changed';
}

export interface LoggerOptions {
  logDir?: string;
  logFile?: string;
  maxFileSizeBytes?: number;
}

const DEFAULT_OPTIONS: Required<LoggerOptions> = {
  logDir: './logs',
  logFile: 'portwatch.log',
  maxFileSizeBytes: 10 * 1024 * 1024, // 10MB
};

export class ProcessLogger {
  private options: Required<LoggerOptions>;
  private logPath: string;

  constructor(options: LoggerOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.logPath = path.join(this.options.logDir, this.options.logFile);
    this.ensureLogDir();
  }

  private ensureLogDir(): void {
    if (!fs.existsSync(this.options.logDir)) {
      fs.mkdirSync(this.options.logDir, { recursive: true });
    }
  }

  private rotatIfNeeded(): void {
    if (!fs.existsSync(this.logPath)) return;
    const stats = fs.statSync(this.logPath);
    if (stats.size >= this.options.maxFileSizeBytes) {
      const rotated = `${this.logPath}.${Date.now()}.bak`;
      fs.renameSync(this.logPath, rotated);
    }
  }

  log(event: PortEvent): void {
    this.rotatIfNeeded();
    const line = JSON.stringify(event) + '\n';
    fs.appendFileSync(this.logPath, line, 'utf8');
  }

  logBatch(events: PortEvent[]): void {
    if (events.length === 0) return;
    this.rotatIfNeeded();
    const lines = events.map((e) => JSON.stringify(e)).join('\n') + '\n';
    fs.appendFileSync(this.logPath, lines, 'utf8');
  }

  getLogPath(): string {
    return this.logPath;
  }
}

export function formatEvent(event: PortEvent): string {
  const proc = event.processName ?? 'unknown';
  const pid = event.pid !== null ? `(pid ${event.pid})` : '(no pid)';
  return `[${event.timestamp}] ${event.event.toUpperCase()} port ${event.port}/${event.protocol} — ${proc} ${pid} [${event.state}]`;
}
