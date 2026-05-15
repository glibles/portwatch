import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { ProcessLogger, formatEvent, PortEvent } from './processLogger';

const makeEvent = (overrides: Partial<PortEvent> = {}): PortEvent => ({
  timestamp: '2024-01-15T10:00:00.000Z',
  port: 8080,
  protocol: 'tcp',
  pid: 1234,
  processName: 'node',
  state: 'LISTEN',
  event: 'opened',
  ...overrides,
});

describe('ProcessLogger', () => {
  let tmpDir: string;
  let logger: ProcessLogger;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'portwatch-test-'));
    logger = new ProcessLogger({ logDir: tmpDir, logFile: 'test.log' });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('creates log directory if it does not exist', () => {
    const nestedDir = path.join(tmpDir, 'nested', 'logs');
    new ProcessLogger({ logDir: nestedDir });
    expect(fs.existsSync(nestedDir)).toBe(true);
  });

  it('logs a single event as JSON line', () => {
    const event = makeEvent();
    logger.log(event);
    const content = fs.readFileSync(logger.getLogPath(), 'utf8');
    const parsed = JSON.parse(content.trim());
    expect(parsed).toEqual(event);
  });

  it('logBatch writes multiple events', () => {
    const events = [makeEvent({ port: 3000 }), makeEvent({ port: 4000, event: 'closed' })];
    logger.logBatch(events);
    const lines = fs.readFileSync(logger.getLogPath(), 'utf8').trim().split('\n');
    expect(lines).toHaveLength(2);
    expect(JSON.parse(lines[0]).port).toBe(3000);
    expect(JSON.parse(lines[1]).port).toBe(4000);
  });

  it('logBatch does nothing for empty array', () => {
    logger.logBatch([]);
    expect(fs.existsSync(logger.getLogPath())).toBe(false);
  });

  it('rotates log when size exceeds limit', () => {
    const smallLogger = new ProcessLogger({ logDir: tmpDir, logFile: 'small.log', maxFileSizeBytes: 10 });
    smallLogger.log(makeEvent());
    smallLogger.log(makeEvent({ port: 9090 }));
    const files = fs.readdirSync(tmpDir).filter((f) => f.startsWith('small.log'));
    expect(files.length).toBeGreaterThan(1);
  });
});

describe('formatEvent', () => {
  it('formats a known event correctly', () => {
    const event = makeEvent();
    const result = formatEvent(event);
    expect(result).toContain('OPENED');
    expect(result).toContain('8080/tcp');
    expect(result).toContain('node');
    expect(result).toContain('pid 1234');
  });

  it('handles null pid and processName', () => {
    const event = makeEvent({ pid: null, processName: null });
    const result = formatEvent(event);
    expect(result).toContain('unknown');
    expect(result).toContain('no pid');
  });
});
