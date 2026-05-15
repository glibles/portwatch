import * as fs from 'fs';
import * as path from 'path';
import { PortSnapshot } from './changeDetector';

export interface SnapshotRecord {
  timestamp: number;
  snapshot: PortSnapshot;
}

export function saveSnapshot(record: SnapshotRecord, filePath: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(record, null, 2), 'utf-8');
}

export function loadSnapshot(filePath: string): SnapshotRecord | null {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as SnapshotRecord;
  } catch {
    return null;
  }
}

export function snapshotAge(record: SnapshotRecord): number {
  return Date.now() - record.timestamp;
}

export function isSnapshotStale(record: SnapshotRecord, maxAgeMs: number): boolean {
  return snapshotAge(record) > maxAgeMs;
}
