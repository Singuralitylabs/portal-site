import { NextResponse } from "next/server";
import { requireApiUser } from "../../../app/services/auth/require-api-user";
import { getServerAuth } from "../../../app/services/auth/server-auth";

jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn(),
  },
}));

jest.mock("../../../app/services/auth/server-auth", () => ({
  getServerAuth: jest.fn(),
}));

describe("requireApiUser", () => {
  const getServerAuthMock = getServerAuth as jest.Mock;
  const nextResponseJsonMock = NextResponse.json as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("未認証の場合 401 を返す", async () => {
    getServerAuthMock.mockResolvedValue({ user: null, userStatus: null });
    const unauthorized = { success: false, error: "認証が必要です" };
    nextResponseJsonMock.mockReturnValue(unauthorized);

    const result = await requireApiUser(["active"]);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(nextResponseJsonMock).toHaveBeenCalledWith(
        { success: false, error: "認証が必要です" },
        { status: 401 }
      );
      expect(result.response).toBe(unauthorized);
    }
  });

  it("サーバーエラーの場合 500 を返す", async () => {
    getServerAuthMock.mockResolvedValue({
      user: null,
      userStatus: null,
      error: "サーバー認証エラーが発生しました",
    });
    const serverError = { success: false, error: "ユーザー情報の確認に失敗しました" };
    nextResponseJsonMock.mockReturnValue(serverError);

    const result = await requireApiUser(["active"]);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(nextResponseJsonMock).toHaveBeenCalledWith(
        { success: false, error: "ユーザー情報の確認に失敗しました" },
        { status: 500 }
      );
    }
  });

  it("許可されていないステータスの場合 403 を返す", async () => {
    getServerAuthMock.mockResolvedValue({
      user: { id: "auth-1" },
      userStatus: "pending",
      displayName: "太郎",
    });
    const forbidden = { success: false, error: "この操作は許可されていません" };
    nextResponseJsonMock.mockReturnValue(forbidden);

    const result = await requireApiUser(["active"]);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(nextResponseJsonMock).toHaveBeenCalledWith(
        { success: false, error: "この操作は許可されていません" },
        { status: 403 }
      );
    }
  });

  it("許可されたステータスならユーザー情報を返す", async () => {
    const user = { id: "auth-1" };
    getServerAuthMock.mockResolvedValue({
      user,
      userStatus: "pending",
      displayName: "太郎",
    });

    const result = await requireApiUser(["pending"]);

    expect(result).toEqual({
      ok: true,
      user,
      userStatus: "pending",
      displayName: "太郎",
    });
  });
});
