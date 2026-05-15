/**
 * rateLimit.ts
 * Controls how frequently events are emitted per port/process key
 * to avoid flooding logs or notifications.
 */

export interface RateLimitConfig {
  windowMs: number;
  maxEvents: number;
}

export interface RateLimitState {
  timestamps: number[];
}

export type RateLimitStore = Map<string, RateLimitState>;

export function createStore(): RateLimitStore {
  return new Map();
}

export function isAllowed(
  store: RateLimitStore,
  key: string,
  config: RateLimitConfig,
  now: number = Date.now()
): boolean {
  const state = store.get(key) ?? { timestamps: [] };

  const windowStart = now - config.windowMs;
  const recent = state.timestamps.filter((t) => t >= windowStart);

  if (recent.length >= config.maxEvents) {
    store.set(key, { timestamps: recent });
    return false;
  }

  recent.push(now);
  store.set(key, { timestamps: recent });
  return true;
}

export function resetKey(store: RateLimitStore, key: string): void {
  store.delete(key);
}

export function pruneStore(
  store: RateLimitStore,
  windowMs: number,
  now: number = Date.now()
): void {
  const windowStart = now - windowMs;
  for (const [key, state] of store.entries()) {
    const recent = state.timestamps.filter((t) => t >= windowStart);
    if (recent.length === 0) {
      store.delete(key);
    } else {
      store.set(key, { timestamps: recent });
    }
  }
}
