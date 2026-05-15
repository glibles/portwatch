import { resolvePid, resolvePids, ProcessInfo } from "./pidResolver";
import { execSync } from "child_process";

jest.mock("child_process");
const mockExec = execSync as jest.MockedFunction<typeof execSync>;

describe("resolvePid", () => {
  beforeEach(() => jest.resetAllMocks());

  it("returns null for pid <= 0", () => {
    expect(resolvePid(0)).toBeNull();
    expect(resolvePid(-1)).toBeNull();
  });

  it("returns null when execSync throws", () => {
    mockExec.mockImplementation(() => { throw new Error("no proc"); });
    const result = resolvePid(9999);
    expect(result).toBeNull();
  });

  it("resolves a linux process on linux platform", () => {
    Object.defineProperty(process, "platform", { value: "linux", configurable: true });
    mockExec
      .mockReturnValueOnce("node\n" as any)          // comm
      .mockReturnValueOnce("node\0server.js\0" as any) // cmdline
      .mockReturnValueOnce("Name:\tnode\nUid:\t1000\t1000\t1000\t1000\n" as any) // status
      .mockReturnValueOnce("testuser\n" as any);     // id -nu

    const result = resolvePid(1234);
    expect(result).not.toBeNull();
    expect(result?.pid).toBe(1234);
    expect(result?.name).toBe("node");
    expect(result?.user).toBe("testuser");
    expect(result?.cmdline).toContain("node");
  });

  it("resolves a mac process on darwin platform", () => {
    Object.defineProperty(process, "platform", { value: "darwin", configurable: true });
    mockExec.mockReturnValueOnce("node alice node server.js\n" as any);

    const result = resolvePid(5678);
    expect(result).not.toBeNull();
    expect(result?.pid).toBe(5678);
    expect(result?.name).toBe("node");
    expect(result?.user).toBe("alice");
  });

  it("returns null for unsupported platform", () => {
    Object.defineProperty(process, "platform", { value: "win32", configurable: true });
    const result = resolvePid(42);
    expect(result).toBeNull();
  });
});

describe("resolvePids", () => {
  beforeEach(() => jest.resetAllMocks());

  it("returns an empty map for empty input", () => {
    const result = resolvePids([]);
    expect(result.size).toBe(0);
  });

  it("skips pids that fail to resolve", () => {
    Object.defineProperty(process, "platform", { value: "linux", configurable: true });
    mockExec.mockImplementation(() => { throw new Error("fail"); });
    const result = resolvePids([1, 2, 3]);
    expect(result.size).toBe(0);
  });

  it("returns resolved entries only", () => {
    Object.defineProperty(process, "platform", { value: "darwin", configurable: true });
    mockExec
      .mockReturnValueOnce("nginx root nginx -g daemon\n" as any)
      .mockImplementationOnce(() => { throw new Error(); });

    const result = resolvePids([100, 200]);
    expect(result.size).toBe(1);
    expect(result.get(100)?.name).toBe("nginx");
  });
});
