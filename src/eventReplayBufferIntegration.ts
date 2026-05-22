import { createReplayBuffer, pushEvent, replayEvents, replaySince, clearReplayBuffer, ReplayBuffer } from './eventReplayBuffer';
import { PortEvent } from './changeDetector';

export interface ReplayBufferIntegration {
  buffer: ReplayBuffer;
  record: (event: PortEvent) => void;
  replay: () => PortEvent[];
  replaySince: (since: number) => PortEvent[];
  clear: () => void;
  shutdown: () => void;
}

export function createReplayBufferIntegration(
  maxSize = 500,
  ttlMs = 60_000
): ReplayBufferIntegration {
  const buffer = createReplayBuffer(maxSize, ttlMs);
  let pruneTimer: ReturnType<typeof setInterval> | null = null;

  pruneTimer = setInterval(() => {
    const now = Date.now();
    // Prune entries older than ttlMs by replaying only recent ones
    const recent = replaySince(buffer, now - ttlMs);
    clearReplayBuffer(buffer);
    for (const event of recent) {
      pushEvent(buffer, event);
    }
  }, Math.max(ttlMs / 2, 5_000));

  if (pruneTimer.unref) {
    pruneTimer.unref();
  }

  function record(event: PortEvent): void {
    pushEvent(buffer, event);
  }

  function replay(): PortEvent[] {
    return replayEvents(buffer);
  }

  function replaySinceTs(since: number): PortEvent[] {
    return replaySince(buffer, since);
  }

  function clear(): void {
    clearReplayBuffer(buffer);
  }

  function shutdown(): void {
    if (pruneTimer !== null) {
      clearInterval(pruneTimer);
      pruneTimer = null;
    }
    clearReplayBuffer(buffer);
  }

  return {
    buffer,
    record,
    replay,
    replaySince: replaySinceTs,
    clear,
    shutdown,
  };
}
