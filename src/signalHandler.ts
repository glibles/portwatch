import { ChildProcess } from 'child_process';

export type ShutdownCallback = () => Promise<void> | void;

export interface SignalHandlerOptions {
  onShutdown: ShutdownCallback;
  timeout?: number;
}

let isShuttingDown = false;

export function registerSignalHandlers(options: SignalHandlerOptions): void {
  const { onShutdown, timeout = 5000 } = options;

  async function handleSignal(signal: string): Promise<void> {
    if (isShuttingDown) {
      process.stderr.write(`[signalHandler] Already shutting down, ignoring ${signal}\n`);
      return;
    }

    isShuttingDown = true;
    process.stderr.write(`[signalHandler] Received ${signal}, initiating graceful shutdown...\n`);

    const timer = setTimeout(() => {
      process.stderr.write('[signalHandler] Shutdown timed out, forcing exit\n');
      process.exit(1);
    }, timeout);

    try {
      await onShutdown();
      clearTimeout(timer);
      process.stderr.write('[signalHandler] Shutdown complete\n');
      process.exit(0);
    } catch (err) {
      clearTimeout(timer);
      process.stderr.write(`[signalHandler] Error during shutdown: ${err}\n`);
      process.exit(1);
    }
  }

  process.on('SIGINT', () => handleSignal('SIGINT'));
  process.on('SIGTERM', () => handleSignal('SIGTERM'));
  process.on('SIGHUP', () => handleSignal('SIGHUP'));
}

export function resetShutdownState(): void {
  isShuttingDown = false;
}

export function isShutdownInProgress(): boolean {
  return isShuttingDown;
}
