import {
  registerSignalHandlers,
  resetShutdownState,
  isShutdownInProgress,
} from './signalHandler';

describe('signalHandler', () => {
  let originalExit: typeof process.exit;
  let originalStderr: typeof process.stderr.write;
  let exitCode: number | undefined;
  let stderrOutput: string[];

  beforeEach(() => {
    resetShutdownState();
    exitCode = undefined;
    stderrOutput = [];

    originalExit = process.exit as typeof process.exit;
    originalStderr = process.stderr.write.bind(process.stderr);

    (process as any).exit = (code: number) => { exitCode = code; };
    process.stderr.write = (msg: any) => { stderrOutput.push(String(msg)); return true; };
  });

  afterEach(() => {
    (process as any).exit = originalExit;
    process.stderr.write = originalStderr;
    process.removeAllListeners('SIGINT');
    process.removeAllListeners('SIGTERM');
    process.removeAllListeners('SIGHUP');
    resetShutdownState();
  });

  it('isShutdownInProgress returns false initially', () => {
    expect(isShutdownInProgress()).toBe(false);
  });

  it('resetShutdownState resets the flag', () => {
    resetShutdownState();
    expect(isShutdownInProgress()).toBe(false);
  });

  it('calls onShutdown and exits with 0 on success', async () => {
    let called = false;
    registerSignalHandlers({
      onShutdown: async () => { called = true; },
      timeout: 1000,
    });

    await (process as any).emit('SIGINT');
    await new Promise((r) => setTimeout(r, 50));

    expect(called).toBe(true);
    expect(exitCode).toBe(0);
  });

  it('exits with 1 if onShutdown throws', async () => {
    registerSignalHandlers({
      onShutdown: async () => { throw new Error('fail'); },
      timeout: 1000,
    });

    await (process as any).emit('SIGTERM');
    await new Promise((r) => setTimeout(r, 50));

    expect(exitCode).toBe(1);
    expect(stderrOutput.some((m) => m.includes('Error during shutdown'))).toBe(true);
  });

  it('ignores duplicate signals while shutting down', async () => {
    let callCount = 0;
    registerSignalHandlers({
      onShutdown: async () => {
        callCount++;
        await new Promise((r) => setTimeout(r, 100));
      },
      timeout: 2000,
    });

    process.emit('SIGINT');
    process.emit('SIGINT');
    await new Promise((r) => setTimeout(r, 200));

    expect(callCount).toBe(1);
  });
});
