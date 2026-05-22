import { PortEvent } from './changeDetector';
import { filterDuplicateEvents } from './eventDeduplicatorIntegration';
import { filterThrottledEvents } from './eventThrottleIntegration';
import { applyFilter } from './filterEngine';
import { FilterRule } from './filterConfig';
import { addEventToBatch } from './eventBatchIntegration';

export interface PipelineOptions {
  filterRule?: FilterRule;
  dedupeEnabled?: boolean;
  throttleEnabled?: boolean;
  batchEnabled?: boolean;
}

export interface PipelineResult {
  passed: PortEvent[];
  dedupedCount: number;
  throttledCount: number;
  batchedCount: number;
}

export function createPipeline(options: PipelineOptions = {}) {
  const {
    filterRule,
    dedupeEnabled = true,
    throttleEnabled = true,
    batchEnabled = false,
  } = options;

  return function runPipeline(events: PortEvent[]): PipelineResult {
    let current = events;

    // Step 1: filter by rule
    if (filterRule) {
      current = current.filter((e) => applyFilter(e, filterRule));
    }

    const afterFilter = current.length;

    // Step 2: deduplicate
    if (dedupeEnabled) {
      current = filterDuplicateEvents(current);
    }
    const dedupedCount = afterFilter - current.length;

    const afterDedupe = current.length;

    // Step 3: throttle
    if (throttleEnabled) {
      current = filterThrottledEvents(current);
    }
    const throttledCount = afterDedupe - current.length;

    // Step 4: batch or pass through
    let batchedCount = 0;
    if (batchEnabled) {
      for (const event of current) {
        addEventToBatch(event);
      }
      batchedCount = current.length;
      current = [];
    }

    return {
      passed: current,
      dedupedCount,
      throttledCount,
      batchedCount,
    };
  };
}
