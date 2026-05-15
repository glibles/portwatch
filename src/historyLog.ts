import * as fs from 'fs';
import * as path from 'path';
import { PortEvent } from './changeDetector';
import { formatEvent } from './processLogger';

export interface HistoryLogOptions {
  filePath: string;
  maxLines?: number;
  format?: 'text' | 'json';
}

export function appendEvent(event: PortEvent, options: HistoryLogOptions): void {
  const dir = path.dirname(options.filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const line =
    options.format === 'json'
      ? JSON.stringify({ ...event, ts: new Date(event.timestamp).toISOString() })
      : formatEvent(event);

  fs.appendFileSync(options.filePath, line + '\n', 'utf-8');

  if (options.maxLines) {
    trimLog(options.filePath, options.maxLines);
  }
}

export function readHistory(filePath: string): string[] {
  if (!fs.existsSync(filePath)) return [];
  return fs.readFileSync(filePath, 'utf-8').split('\n').filter(Boolean);
}

export function trimLog(filePath: string, maxLines: number): void {
  const lines = readHistory(filePath);
  if (lines.length > maxLines) {
    const trimmed = lines.slice(lines.length - maxLines);
    fs.writeFileSync(filePath, trimmed.join('\n') + '\n', 'utf-8');
  }
}

export function clearHistory(filePath: string): void {
  if (fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '', 'utf-8');
  }
}
