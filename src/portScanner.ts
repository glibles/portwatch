import { execSync } from 'child_process';

export interface PortInfo {
  port: number;
  pid: number;
  processName: string;
  protocol: 'tcp' | 'udp';
}

function parseLinuxOutput(output: string): PortInfo[] {
  const results: PortInfo[] = [];
  const lines = output.trim().split('\n').slice(1);

  for (const line of lines) {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 7) continue;

    const protocol = parts[0] as 'tcp' | 'udp';
    const localAddress = parts[3];
    const pidProgram = parts[6];

    const portMatch = localAddress.match(/:([\d]+)$/);
    const pidMatch = pidProgram.match(/^(\d+)\/?(.*)$/);

    if (!portMatch || !pidMatch) continue;

    results.push({
      port: parseInt(portMatch[1], 10),
      pid: parseInt(pidMatch[1], 10),
      processName: pidMatch[2] || 'unknown',
      protocol,
    });
  }

  return results;
}

function parseMacOutput(output: string): PortInfo[] {
  const results: PortInfo[] = [];
  const lines = output.trim().split('\n');

  for (const line of lines) {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 9) continue;

    const protocol = parts[0].toLowerCase().startsWith('tcp') ? 'tcp' : 'udp';
    const localAddress = parts[3];
    const pidStr = parts[1];
    const processName = parts[0];

    const portMatch = localAddress.match(/\.(\d+)$/);
    if (!portMatch) continue;

    results.push({
      port: parseInt(portMatch[1], 10),
      pid: parseInt(pidStr, 10),
      processName,
      protocol,
    });
  }

  return results;
}

export function scanPorts(): PortInfo[] {
  const platform = process.platform;

  try {
    if (platform === 'linux') {
      const output = execSync('ss -tulnp', { encoding: 'utf8' });
      return parseLinuxOutput(output);
    } else if (platform === 'darwin') {
      const output = execSync('lsof -iTCP -iUDP -n -P | grep LISTEN', { encoding: 'utf8' });
      return parseMacOutput(output);
    } else {
      throw new Error(`Unsupported platform: ${platform}`);
    }
  } catch (err) {
    if ((err as NodeJS.ErrnoException).status === 1) return [];
    throw err;
  }
}
