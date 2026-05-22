import { createPipeline } from './eventPipeline';
import { createThrottleIntegration, filterThrottledEvents, shutdownThrottleIntegration } from './eventThrottleIntegration';
import { createDeduplicatorIntegration, filterDuplicateEvents, shutdownDeduplicatorIntegration } from './eventDeduplicatorIntegration';
import { createBatchIntegration, addEventToBatch, shutdownBatchIntegration } from './eventBatchIntegration';
import type { ChangeEvent } from './changeDetector';

export interface PipelineIntegrationOptions {
  throttleWindowMs?: number;
  throttleMaxEvents?: number;
  dedupeWindowMs?: number;
  batchSize?: number;
  batchFlushMs?: number;
  onFlush: (events: ChangeEvent[]) => void;
}

export interface PipelineIntegration {
  process: (events: ChangeEvent[]) => void;
  shutdown: () => void;
}

export function createPipelineIntegration(
  options: PipelineIntegrationOptions
): PipelineIntegration {
  const throttle = createThrottleIntegration({
    windowMs: options.throttleWindowMs ?? 5000,
    maxEvents: options.throttleMaxEvents ?? 10,
  });

  const dedupe = createDeduplicatorIntegration({
    windowMs: options.dedupeWindowMs ?? 2000,
  });

  const batch = createBatchIntegration({
    maxSize: options.batchSize ?? 20,
    flushIntervalMs: options.batchFlushMs ?? 1000,
    onFlush: options.onFlush,
  });

  const pipeline = createPipeline([
    (events) => filterThrottledEvents(throttle, events),
    (events) => filterDuplicateEvents(dedupe, events),
    (events) => {
      for (const event of events) {
        addEventToBatch(batch, event);
      }
      return events;
    },
  ]);

  function process(events: ChangeEvent[]): void {
    pipeline.run(events);
  }

  function shutdown(): void {
    shutdownThrottleIntegration(throttle);
    shutdownDeduplicatorIntegration(dedupe);
    shutdownBatchIntegration(batch);
  }

  return { process, shutdown };
}
