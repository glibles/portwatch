import { execSync } from "child_process";

export interface ProcessInfo {
  pid: number;
  name: string;
  user: string;
  cmdline: string;
}

export function resolvePid(pid: number): ProcessInfo | null {
  if (pid <= 0) return null;

  try {
    const platform = process.platform;
    if (platform === "linux") {
      return resolveLinux(pid);
    } else if (platform === "darwin") {
      return resolveMac(pid);
    }
    return null;
  } catch {
    return null;
  }
}

function resolveLinux(pid: number): ProcessInfo | null {
  try {
    const comm = execSync(`cat /proc/${pid}/comm 2>/dev/null`, { encoding: "utf8" }).trim();
    const cmdline = execSync(`cat /proc/${pid}/cmdline 2>/dev/null`, { encoding: "utf8" })
      .replace(/\0/g, " ")
      .trim();
    const status = execSync(`cat /proc/${pid}/status 2>/dev/null`, { encoding: "utf8" });
    const userLine = status.split("\n").find((l) => l.startsWith("Uid:"));
    const uid = userLine ? userLine.split(/\s+/)[1] : "0";
    const user = resolveUid(Number(uid));
    return { pid, name: comm, user, cmdline };
  } catch {
    return null;
  }
}

function resolveMac(pid: number): ProcessInfo | null {
  try {
    const out = execSync(`ps -p ${pid} -o comm=,user=,command= 2>/dev/null`, {
      encoding: "utf8",
    }).trim();
    if (!out) return null;
    const parts = out.split(/\s+/);
    const name = parts[0] ?? "unknown";
    const user = parts[1] ?? "unknown";
    const cmdline = parts.slice(2).join(" ");
    return { pid, name, user, cmdline };
  } catch {
    return null;
  }
}

function resolveUid(uid: number): string {
  try {
    return execSync(`id -nu ${uid} 2>/dev/null`, { encoding: "utf8" }).trim();
  } catch {
    return String(uid);
  }
}

export function resolvePids(pids: number[]): Map<number, ProcessInfo> {
  const result = new Map<number, ProcessInfo>();
  for (const pid of pids) {
    const info = resolvePid(pid);
    if (info) result.set(pid, info);
  }
  return result;
}
