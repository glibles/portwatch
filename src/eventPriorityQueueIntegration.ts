import {
  createPriorityQueue,
  enqueueEvent,
  drainQueue,
  PriorityQueue,
} from "./eventPriorityQueue";
import { PortEvent } from "./changeDetector";

export interface PriorityQueueIntegration {
  queue: PriorityQueue;
  enqueue: (event: PortEvent) => void;
  drain: () => PortEvent[];
  shutdown: () => PortEvent[];
}

export function createPriorityQueueIntegration(
  maxSize = 1000
): PriorityQueueIntegration {
  const queue = createPriorityQueue(maxSize);

  function enqueue(event: PortEvent): void {
    enqueueEvent(queue, event);
  }

  function drain(): PortEvent[] {
    return drainQueue(queue);
  }

  function shutdown(): PortEvent[] {
    const remaining = drainQueue(queue);
    return remaining;
  }

  return { queue, enqueue, drain, shutdown };
}

export function flushAndProcess(
  integration: PriorityQueueIntegration,
  handler: (events: PortEvent[]) => void
): void {
  const events = integration.drain();
  if (events.length > 0) {
    handler(events);
  }
}

export function enqueueAll(
  integration: PriorityQueueIntegration,
  events: PortEvent[]
): void {
  for (const event of events) {
    integration.enqueue(event);
  }
}
