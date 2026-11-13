import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { middleware } from "../middleware";
import { fetchUserStatusByIdInServer } from "../app/services/api/users-server";

jest.mock("@supabase/ssr", () => ({
  createServerClient: jest.fn(),
}));

jest.mock("../app/services/api/users-server", () => ({
  fetchUserStatusByIdInServer: jest.fn(),
}));

const createRequest = (path: string): NextRequest =>
  new NextRequest(new URL(path, "http://localhost:3000"));

const mockCreateServerClient = createServerClient as jest.Mock;
const mockFetchUserStatusByIdInServer = fetchUserStatusByIdInServer as jest.Mock;

const mockUnauthenticatedClient = () => {
  mockCreateServerClient.mockReturnValue({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: null },
        error: { message: "unauthenticated" },
      }),
    },
  });
};

const mockAuthenticatedClient = (userId = "user-1") => {
  mockCreateServerClient.mockReturnValue({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: userId } },
        error: null,
      }),
    },
  });
};

describe("middleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUnauthenticatedClient();
  });

  it("未認証の API は 401 JSON を返し、/login へリダイレクトしない", async () => {
    const response = await middleware(createRequest("/api/calendar/events"));

    expect(response.status).toBe(401);
    expect(response.headers.get("location")).toBeNull();
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "認証が必要です",
    });
  });

  it("未認証の Slack 通知 API も 401 JSON を返す", async () => {
    const response = await middleware(createRequest("/api/notifications/slack"));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "認証が必要です",
    });
  });

  it("未認証のページは /login へリダイレクトする", async () => {
    const response = await middleware(createRequest("/calendar"));

    expect(response.status).toBeGreaterThanOrEqual(300);
    expect(response.status).toBeLessThan(400);
    expect(response.headers.get("location")).toBe("http://localhost:3000/login");
  });

  it("認証済み pending ユーザーの API はステータス判定せず通過させる", async () => {
    mockAuthenticatedClient();

    const response = await middleware(createRequest("/api/notifications/slack"));

    expect(response.status).toBe(200);
    expect(mockFetchUserStatusByIdInServer).not.toHaveBeenCalled();
  });

  it("認証済み pending ユーザーのページは /pending へリダイレクトする", async () => {
    mockAuthenticatedClient();
    mockFetchUserStatusByIdInServer.mockResolvedValue({ status: "pending", error: null });

    const response = await middleware(createRequest("/calendar"));

    expect(response.headers.get("location")).toBe("http://localhost:3000/pending");
  });

  describe("CSP nonce", () => {
    const expectNonceCsp = (response: Response) => {
      const csp = response.headers.get("content-security-policy") ?? "";
      const match = csp.match(/script-src[^;]*'nonce-([^']+)'/);
      expect(match).not.toBeNull();
      expect(csp).toContain("'strict-dynamic'");
      expect(csp).not.toMatch(/script-src[^;]*'unsafe-inline'/);
      expect(csp).not.toMatch(/style-src-elem[^;]*'unsafe-inline'/);
      return match![1];
    };

    it("全てのreturnパス(静的/公開/401/リダイレクト/通過)でCSPとnonceを付与する", async () => {
      expectNonceCsp(await middleware(createRequest("/login")));
      expectNonceCsp(await middleware(createRequest("/api/calendar/events")));
      expectNonceCsp(await middleware(createRequest("/calendar")));

      mockAuthenticatedClient();
      mockFetchUserStatusByIdInServer.mockResolvedValue({ status: "pending", error: null });
      expectNonceCsp(await middleware(createRequest("/calendar")));

      mockFetchUserStatusByIdInServer.mockResolvedValue({ status: "active", error: null });
      expectNonceCsp(await middleware(createRequest("/calendar")));
    });

    it("nonce はリクエストごとに変わる", async () => {
      const first = expectNonceCsp(await middleware(createRequest("/login")));
      const second = expectNonceCsp(await middleware(createRequest("/login")));
      expect(first).not.toBe(second);
    });
  });
});
