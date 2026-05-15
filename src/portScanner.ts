import { execSync } from 'child_process';

export interface PortInfo {
  port: number;
  protocol: string;
  pid: number | null;
  processName: string | null;
  state: string;
}

export function parseLinuxOutput(output: string): PortInfo[] {
  const results: PortInfo[] = [];
  const lines = output.trim().split('\n').slice(1);
  for (const line of lines) {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 7) continue;
    const proto = parts[0];
    const localAddr = parts[3];
    const state = parts[5] ?? 'UNKNOWN';
    const pidProg = parts[6] ?? '';
    const portMatch = localAddr.match(/:([\d]+)$/);
    if (!portMatch) continue;
    const port = parseInt(portMatch[1], 10);
    const pidMatch = pidProg.match(/(\d+)\/(\S+)/);
    const pid = pidMatch ? parseInt(pidMatch[1], 10) : null;
    const processName = pidMatch ? pidMatch[2] : null;
    results.push({ port, protocol: proto, pid, processName, state });
  }
  return results;
}

export function parseMacOutput(output: string): PortInfo[] {
  const results: PortInfo[] = [];
  const lines = output.trim().split('\n');
  for (const line of lines) {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 9) continue;
    const proto = parts[0];
    const localAddr = parts[3];
    const state = parts[5] ?? 'UNKNOWN';
    const pid = parts[8] ? parseInt(parts[8], 10) : null;
    const portMatch = localAddr.match(/\.([\d]+)$/);
    if (!portMatch) continue;
    const port = parseInt(portMatch[1], 10);
    results.push({ port, protocol: proto, pid, processName: null, state });
  }
  return results;
}

export function scanPorts(): PortInfo[] {
  const platform = process.platform;
  try {
    if (platform === 'linux') {
      const output = execSync('ss -tulnp 2>/dev/null || netstat -tulnp 2>/dev/null', {
        encoding: 'utf8',
        timeout: 5000,
      });
      return parseLinuxOutput(output);
    } else if (platform === 'darwin') {
      const output = execSync('netstat -anv -p tcp 2>/dev/null', {
        encoding: 'utf8',
        timeout: 5000,
      });
      return parseMacOutput(output);
    } else {
      console.warn(`portwatch: unsupported platform '${platform}'`);
      return [];
    }
  } catch (err) {
    console.error('portwatch: failed to scan ports', err);
    return [];
  }
}
