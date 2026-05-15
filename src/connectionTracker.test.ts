import {
  createConnectionStore,
  connKey,
  openConnection,
  closeConnection,
  activeCount,
  getConnection,
  listActive,
  clearConnections,
} from './connectionTracker';

describe('connKey', () => {
  it('creates a unique key from protocol, address, and port', () => {
    expect(connKey('tcp', '127.0.0.1', 8080)).toBe('tcp:127.0.0.1:8080');
    expect(connKey('udp', '0.0.0.0', 53)).toBe('udp:0.0.0.0:53');
  });
});

describe('createConnectionStore', () => {
  it('returns an empty store', () => {
    const store = createConnectionStore();
    expect(store.connections).toEqual({});
  });
});

describe('openConnection', () => {
  it('adds a connection entry', () => {
    const store = createConnectionStore();
    const entry = { pid: 1234, process: 'node', uid: 'user' };
    openConnection(store, 'tcp', '127.0.0.1', 3000, entry);
    const key = connKey('tcp', '127.0.0.1', 3000);
    expect(store.connections[key]).toBeDefined();
    expect(store.connections[key].pid).toBe(1234);
  });

  it('records openedAt timestamp', () => {
    const store = createConnectionStore();
    const before = Date.now();
    openConnection(store, 'tcp', '0.0.0.0', 80, { pid: 1, process: 'nginx', uid: 'root' });
    const key = connKey('tcp', '0.0.0.0', 80);
    expect(store.connections[key].openedAt).toBeGreaterThanOrEqual(before);
  });
});

describe('closeConnection', () => {
  it('removes the connection entry', () => {
    const store = createConnectionStore();
    openConnection(store, 'tcp', '127.0.0.1', 4000, { pid: 99, process: 'app', uid: 'user' });
    closeConnection(store, 'tcp', '127.0.0.1', 4000);
    const key = connKey('tcp', '127.0.0.1', 4000);
    expect(store.connections[key]).toBeUndefined();
  });

  it('is a no-op for unknown connections', () => {
    const store = createConnectionStore();
    expect(() => closeConnection(store, 'tcp', '127.0.0.1', 9999)).not.toThrow();
  });
});

describe('activeCount', () => {
  it('returns the number of active connections', () => {
    const store = createConnectionStore();
    openConnection(store, 'tcp', '127.0.0.1', 3000, { pid: 1, process: 'a', uid: 'u' });
    openConnection(store, 'udp', '0.0.0.0', 53, { pid: 2, process: 'b', uid: 'u' });
    expect(activeCount(store)).toBe(2);
  });
});

describe('getConnection', () => {
  it('returns the connection entry if it exists', () => {
    const store = createConnectionStore();
    openConnection(store, 'tcp', '127.0.0.1', 5000, { pid: 42, process: 'srv', uid: 'root' });
    const conn = getConnection(store, 'tcp', '127.0.0.1', 5000);
    expect(conn?.pid).toBe(42);
  });

  it('returns undefined for missing connection', () => {
    const store = createConnectionStore();
    expect(getConnection(store, 'tcp', '127.0.0.1', 1)).toBeUndefined();
  });
});

describe('listActive', () => {
  it('returns all active connection entries', () => {
    const store = createConnectionStore();
    openConnection(store, 'tcp', '127.0.0.1', 6000, { pid: 10, process: 'x', uid: 'u' });
    openConnection(store, 'tcp', '127.0.0.1', 6001, { pid: 11, process: 'y', uid: 'u' });
    expect(listActive(store).length).toBe(2);
  });
});

describe('clearConnections', () => {
  it('removes all connections', () => {
    const store = createConnectionStore();
    openConnection(store, 'tcp', '127.0.0.1', 7000, { pid: 5, process: 'z', uid: 'u' });
    clearConnections(store);
    expect(activeCount(store)).toBe(0);
  });
});
