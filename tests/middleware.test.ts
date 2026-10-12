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
});
