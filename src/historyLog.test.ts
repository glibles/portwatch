import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { appendEvent, readHistory, trimLog, clearHistory } from './historyLog';
import { PortEvent } from './changeDetector';

const makeEvent = (port: number, type: PortEvent['type'] = 'opened'): PortEvent => ({
  type,
  port,
  protocol: 'tcp',
  pid: 42,
  process: 'nginx',
  timestamp: 1700000000000,
});

describe('historyLog', () => {
  let tmpDir: string;
  let logFile: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'portwatch-hist-'));
    logFile = path.join(tmpDir, 'history.log');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('appends a text event and reads it back', () => {
    appendEvent(makeEvent(80), { filePath: logFile, format: 'text' });
    const lines = readHistory(logFile);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain('80');
  });

  it('appends a json event and reads it back', () => {
    appendEvent(makeEvent(443, 'closed'), { filePath: logFile, format: 'json' });
    const lines = readHistory(logFile);
    expect(lines).toHaveLength(1);
    const parsed = JSON.parse(lines[0]);
    expect(parsed.port).toBe(443);
    expect(parsed.type).toBe('closed');
  });

  it('returns empty array when file does not exist', () => {
    expect(readHistory(path.join(tmpDir, 'missing.log'))).toEqual([]);
  });

  it('trims log to maxLines', () => {
    for (let i = 0; i < 10; i++) {
      appendEvent(makeEvent(3000 + i), { filePath: logFile });
    }
    trimLog(logFile, 5);
    expect(readHistory(logFile)).toHaveLength(5);
  });

  it('respects maxLines option on append', () => {
    for (let i = 0; i < 8; i++) {
      appendEvent(makeEvent(3000 + i), { filePath: logFile, maxLines: 5 });
    }
    expect(readHistory(logFile)).toHaveLength(5);
  });

  it('clearHistory empties the file', () => {
    appendEvent(makeEvent(8080), { filePath: logFile });
    clearHistory(logFile);
    expect(readHistory(logFile)).toHaveLength(0);
  });

  it('clearHistory does not throw if file missing', () => {
    expect(() => clearHistory(path.join(tmpDir, 'ghost.log'))).not.toThrow();
  });

  it('creates directories automatically', () => {
    const nested = path.join(tmpDir, 'sub', 'dir', 'history.log');
    appendEvent(makeEvent(9000), { filePath: nested });
    expect(fs.existsSync(nested)).toBe(true);
  });
});
