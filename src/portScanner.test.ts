import { scanPorts, PortInfo } from './portScanner';
import { execSync } from 'child_process';

jest.mock('child_process', () => ({
  execSync: jest.fn(),
}));

const mockedExecSync = execSync as jest.MockedFunction<typeof execSync>;

describe('portScanner', () => {
  const originalPlatform = process.platform;

  afterEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(process, 'platform', { value: originalPlatform });
  });

  describe('on linux', () => {
    beforeEach(() => {
      Object.defineProperty(process, 'platform', { value: 'linux' });
    });

    it('returns parsed port info from ss output', () => {
      const mockOutput = [
        'Netid  State   Recv-Q  Send-Q  Local Address:Port  Peer Address:Port  Process',
        'tcp    LISTEN  0       128     0.0.0.0:3000        0.0.0.0:*          1234/node',
        'tcp    LISTEN  0       128     0.0.0.0:8080        0.0.0.0:*          5678/python3',
      ].join('\n');

      mockedExecSync.mockReturnValue(mockOutput as any);

      const result: PortInfo[] = scanPorts();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ port: 3000, pid: 1234, processName: 'node', protocol: 'tcp' });
      expect(result[1]).toEqual({ port: 8080, pid: 5678, processName: 'python3', protocol: 'tcp' });
    });

    it('returns empty array when no ports are open', () => {
      mockedExecSync.mockReturnValue('Netid  State   Recv-Q  Send-Q  Local Address:Port  Peer Address:Port  Process\n' as any);
      const result = scanPorts();
      expect(result).toHaveLength(0);
    });

    it('returns empty array when command exits with status 1', () => {
      const err = new Error('grep: no match') as NodeJS.ErrnoException;
      err.status = 1;
      mockedExecSync.mockImplementation(() => { throw err; });
      const result = scanPorts();
      expect(result).toHaveLength(0);
    });

    it('throws on unexpected errors', () => {
      mockedExecSync.mockImplementation(() => { throw new Error('permission denied'); });
      expect(() => scanPorts()).toThrow('permission denied');
    });
  });

  describe('on unsupported platform', () => {
    it('throws an error', () => {
      Object.defineProperty(process, 'platform', { value: 'win32' });
      expect(() => scanPorts()).toThrow('Unsupported platform: win32');
    });
  });
});
