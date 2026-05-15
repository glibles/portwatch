/**
 * rateLimitConfig.ts
 * Parses and validates rate-limit configuration from a plain object
 * (e.g. loaded from portwatch.config.json).
 */

import { RateLimitConfig } from "./rateLimit";

export const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  windowMs: 60_000, // 1 minute
  maxEvents: 5,
};

export interface RawRateLimitConfig {
  windowMs?: unknown;
  maxEvents?: unknown;
}

export function parseRateLimitConfig(
  raw: RawRateLimitConfig
): RateLimitConfig {
  const windowMs =
    typeof raw.windowMs === "number" && raw.windowMs > 0
      ? raw.windowMs
      : DEFAULT_RATE_LIMIT.windowMs;

  const maxEvents =
    typeof raw.maxEvents === "number" &&
    Number.isInteger(raw.maxEvents) &&
    raw.maxEvents > 0
      ? raw.maxEvents
      : DEFAULT_RATE_LIMIT.maxEvents;

  return { windowMs, maxEvents };
}

export function mergeRateLimitDefaults(
  partial: Partial<RateLimitConfig>
): RateLimitConfig {
  return {
    windowMs: partial.windowMs ?? DEFAULT_RATE_LIMIT.windowMs,
    maxEvents: partial.maxEvents ?? DEFAULT_RATE_LIMIT.maxEvents,
  };
}
