/**
 * retryHandler.ts
 * Provides retry logic with exponential backoff for transient failures
 * (e.g., failed port scans, snapshot I/O errors).
 */

export interface RetryOptions {
  maxAttempts: number;
  initialDelayMs: number;
  backoffFactor: number;
  maxDelayMs: number;
  onRetry?: (attempt: number, error: Error) => void;
}

export const defaultRetryOptions: RetryOptions = {
  maxAttempts: 3,
  initialDelayMs: 200,
  backoffFactor: 2,
  maxDelayMs: 5000,
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function calcDelay(attempt: number, opts: RetryOptions): number {
  const raw = opts.initialDelayMs * Math.pow(opts.backoffFactor, attempt - 1);
  return Math.min(raw, opts.maxDelayMs);
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const opts: RetryOptions = { ...defaultRetryOptions, ...options };

  let lastError: Error = new Error("Unknown error");

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      if (attempt === opts.maxAttempts) {
        break;
      }

      if (opts.onRetry) {
        opts.onRetry(attempt, lastError);
      }

      const waitMs = calcDelay(attempt, opts);
      await delay(waitMs);
    }
  }

  throw lastError;
}
