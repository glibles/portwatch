import {
  createPriorityQueueIntegration,
  flushAndProcess,
  enqueueAll,
} from "./eventPriorityQueueIntegration";
import { PortEvent } from "./changeDetector";

function makeEvent(port: number, type: PortEvent["type"] = "open"): PortEvent {
  return {
    type,
    port,
    protocol: "tcp",
    pid: 1000 + port,
    process: `proc-${port}`,
    timestamp: Date.now(),
  };
}

describe("createPriorityQueueIntegration", () => {
  it("creates an integration with a queue", () => {
    const integration = createPriorityQueueIntegration();
    expect(integration.queue).toBeDefined();
    expect(typeof integration.enqueue).toBe("function");
    expect(typeof integration.drain).toBe("function");
    expect(typeof integration.shutdown).toBe("function");
  });

  it("enqueues and drains events", () => {
    const integration = createPriorityQueueIntegration();
    const ev = makeEvent(8080);
    integration.enqueue(ev);
    const drained = integration.drain();
    expect(drained).toHaveLength(1);
    expect(drained[0].port).toBe(8080);
  });

  it("drain returns empty array when queue is empty", () => {
    const integration = createPriorityQueueIntegration();
    expect(integration.drain()).toEqual([]);
  });

  it("shutdown drains remaining events", () => {
    const integration = createPriorityQueueIntegration();
    integration.enqueue(makeEvent(3000));
    integration.enqueue(makeEvent(3001));
    const remaining = integration.shutdown();
    expect(remaining).toHaveLength(2);
  });

  it("shutdown returns empty array if no events pending", () => {
    const integration = createPriorityQueueIntegration();
    expect(integration.shutdown()).toEqual([]);
  });
});

describe("flushAndProcess", () => {
  it("calls handler with drained events", () => {
    const integration = createPriorityQueueIntegration();
    integration.enqueue(makeEvent(9090));
    const handler = jest.fn();
    flushAndProcess(integration, handler);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0]).toHaveLength(1);
  });

  it("does not call handler when queue is empty", () => {
    const integration = createPriorityQueueIntegration();
    const handler = jest.fn();
    flushAndProcess(integration, handler);
    expect(handler).not.toHaveBeenCalled();
  });
});

describe("enqueueAll", () => {
  it("enqueues multiple events at once", () => {
    const integration = createPriorityQueueIntegration();
    const events = [makeEvent(1), makeEvent(2), makeEvent(3)];
    enqueueAll(integration, events);
    const drained = integration.drain();
    expect(drained).toHaveLength(3);
  });

  it("handles empty array gracefully", () => {
    const integration = createPriorityQueueIntegration();
    enqueueAll(integration, []);
    expect(integration.drain()).toEqual([]);
  });
});
