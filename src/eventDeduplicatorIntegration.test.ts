import {
  createDeduplicatorIntegration,
  filterDuplicateEvents,
  shutdownDeduplicatorIntegration,
} from './eventDeduplicatorIntegration';
import { PortEvent } from './changeDetector';

const makeEvent = (port: number, type: 'open' | 'close' | 'change' = 'open'): PortEvent => ({
  type,
  port,
  protocol: 'tcp',
  pid: 42,
  process: 'test',
  timestamp: Date.now(),
});

describe('createDeduplicatorIntegration', () => {
  it('creates integration with a store and interval', () => {
    const integration = createDeduplicatorIntegration(1000, 5000);
    expect(integration.store).toBeDefined();
    expect(integration.pruneIntervalId).not.toBeNull();
    shutdownDeduplicatorIntegration(integration);
  });
});

describe('filterDuplicateEvents', () => {
  it('passes unique events through', () => {
    const integration = createDeduplicatorIntegration(1000, 60000);
    const events = [makeEvent(3000), makeEvent(4000)];
    const result = filterDuplicateEvents(integration, events, 0);
    expect(result).toHaveLength(2);
    shutdownDeduplicatorIntegration(integration);
  });

  it('removes duplicate events within window', () => {
    const integration = createDeduplicatorIntegration(1000, 60000);
    filterDuplicateEvents(integration, [makeEvent(3000)], 0);
    const second = filterDuplicateEvents(integration, [makeEvent(3000)], 200);
    expect(second).toHaveLength(0);
    shutdownDeduplicatorIntegration(integration);
  });

  it('allows same event after window expires', () => {
    const integration = createDeduplicatorIntegration(500, 60000);
    filterDuplicateEvents(integration, [makeEvent(3000)], 0);
    const second = filterDuplicateEvents(integration, [makeEvent(3000)], 600);
    expect(second).toHaveLength(1);
    shutdownDeduplicatorIntegration(integration);
  });
});

describe('shutdownDeduplicatorIntegration', () => {
  it('clears the interval and resets the store', () => {
    const integration = createDeduplicatorIntegration(1000, 60000);
    filterDuplicateEvents(integration, [makeEvent(8080)], 0);
    shutdownDeduplicatorIntegration(integration);
    expect(integration.pruneIntervalId).toBeNull();
    expect(integration.store.seen.size).toBe(0);
  });

  it('is safe to call twice', () => {
    const integration = createDeduplicatorIntegration(1000, 60000);
    shutdownDeduplicatorIntegration(integration);
    expect(() => shutdownDeduplicatorIntegration(integration)).not.toThrow();
  });
});
