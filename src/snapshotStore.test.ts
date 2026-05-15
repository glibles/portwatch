import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  saveSnapshot,
  loadSnapshot,
  snapshotAge,
  isSnapshotStale,
  SnapshotRecord,
} from './snapshotStore';
import { PortSnapshot } from './changeDetector';

const makeRecord = (timestamp: number): SnapshotRecord => ({
  timestamp,
  snapshot: {
    '8080/tcp': { pid: 1234, process: 'node', port: 8080, protocol: 'tcp' },
  } as PortSnapshot,
});

describe('snapshotStore', () => {
  let tmpDir: string;
  let tmpFile: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'portwatch-'));
    tmpFile = path.join(tmpDir, 'snapshot.json');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('saves and loads a snapshot round-trip', () => {
    const record = makeRecord(Date.now());
    saveSnapshot(record, tmpFile);
    const loaded = loadSnapshot(tmpFile);
    expect(loaded).not.toBeNull();
    expect(loaded!.timestamp).toBe(record.timestamp);
    expect(loaded!.snapshot['8080/tcp'].pid).toBe(1234);
  });

  it('returns null when file does not exist', () => {
    const result = loadSnapshot(path.join(tmpDir, 'nonexistent.json'));
    expect(result).toBeNull();
  });

  it('returns null for corrupted file', () => {
    fs.writeFileSync(tmpFile, 'not valid json', 'utf-8');
    expect(loadSnapshot(tmpFile)).toBeNull();
  });

  it('creates nested directories if needed', () => {
    const nested = path.join(tmpDir, 'a', 'b', 'snap.json');
    const record = makeRecord(Date.now());
    expect(() => saveSnapshot(record, nested)).not.toThrow();
    expect(fs.existsSync(nested)).toBe(true);
  });

  it('snapshotAge returns approximate elapsed ms', () => {
    const ts = Date.now() - 5000;
    const record = makeRecord(ts);
    expect(snapshotAge(record)).toBeGreaterThanOrEqual(5000);
  });

  it('isSnapshotStale returns true when older than maxAge', () => {
    const record = makeRecord(Date.now() - 10000);
    expect(isSnapshotStale(record, 5000)).toBe(true);
  });

  it('isSnapshotStale returns false when within maxAge', () => {
    const record = makeRecord(Date.now() - 1000);
    expect(isSnapshotStale(record, 5000)).toBe(false);
  });
});
