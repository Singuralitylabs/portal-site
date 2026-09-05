import { NextResponse } from "next/server";

import { POST } from "../../../app/api/notifications/slack/route";

jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn(),
  },
}));

const mockRequireApiUser = jest.fn();
const mockClaimRegistrationSlackNotification = jest.fn();
const mockReleaseRegistrationSlackNotification = jest.fn();

jest.mock("../../../app/services/auth/require-api-user", () => ({
  requireApiUser: (...args: unknown[]) => mockRequireApiUser(...args),
}));

jest.mock("../../../app/services/api/users-server", () => ({
  claimRegistrationSlackNotification: (...args: unknown[]) =>
    mockClaimRegistrationSlackNotification(...args),
  releaseRegistrationSlackNotification: (...args: unknown[]) =>
    mockReleaseRegistrationSlackNotification(...args),
}));

const ORIGINAL_ENV = { ...process.env };
let fetchSpy: jest.SpyInstance;

type FetchResponseMock = {
  ok: boolean;
  status?: number;
  text?: jest.Mock<Promise<string>, []>;
};

describe("Slack 通知 API", () => {
  const nextResponseJsonMock = NextResponse.json as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...ORIGINAL_ENV };
    fetchSpy = jest.spyOn(global, "fetch");
    mockRequireApiUser.mockResolvedValue({
      ok: true,
      user: { id: "test-auth-id" },
      userStatus: "pending",
      displayName: "DB太郎",
    });
    mockClaimRegistrationSlackNotification.mockResolvedValue({
      claimed: true,
      alreadyNotified: false,
      displayName: "DB太郎",
      error: null,
    });
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it("正常系: DB の display_name で Slack 通知を送信する", async () => {
    process.env.SLACK_WEBHOOK_URL = "https://hooks.slack.com/services/test";
    const expectedResponse = { success: true };
    nextResponseJsonMock.mockReturnValue(expectedResponse);
    fetchSpy.mockResolvedValue({ ok: true } as FetchResponseMock);

    const response = await POST();

    expect(fetchSpy).toHaveBeenCalledWith(
      "https://hooks.slack.com/services/test",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
    );
    expect(JSON.parse(fetchSpy.mock.calls[0][1].body as string)).toMatchObject({
      text: "新規ユーザー登録の承認依頼",
    });
    expect(JSON.parse(fetchSpy.mock.calls[0][1].body as string).blocks[1].text.text).toContain(
      "DB太郎"
    );
    expect(nextResponseJsonMock).toHaveBeenCalledWith({ success: true });
    expect(response).toBe(expectedResponse);
  });

  it("正常系: Webhook 未設定時はスキップし通知権を取得しない", async () => {
    delete process.env.SLACK_WEBHOOK_URL;
    const expectedResponse = { success: true, message: "環境変数未設定のためスキップ" };
    nextResponseJsonMock.mockReturnValue(expectedResponse);
    const consoleWarn = jest.spyOn(console, "warn").mockImplementation(() => {});

    const response = await POST();

    expect(mockClaimRegistrationSlackNotification).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(nextResponseJsonMock).toHaveBeenCalledWith(expectedResponse);
    expect(response).toBe(expectedResponse);
    expect(consoleWarn).toHaveBeenCalled();
    consoleWarn.mockRestore();
  });

  it("異常系: 未認証の場合 401 を返す", async () => {
    const expectedResponse = { success: false, error: "認証が必要です" };
    mockRequireApiUser.mockResolvedValue({ ok: false, response: expectedResponse });

    const response = await POST();

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(response).toBe(expectedResponse);
  });

  it("異常系: pending 以外のユーザーは 403 を返す", async () => {
    const expectedResponse = { success: false, error: "この操作は許可されていません" };
    mockRequireApiUser.mockResolvedValue({ ok: false, response: expectedResponse });

    const response = await POST();

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(response).toBe(expectedResponse);
  });

  it("正常系: 既に通知済みなら Slack を再送しない", async () => {
    process.env.SLACK_WEBHOOK_URL = "https://hooks.slack.com/services/test";
    mockClaimRegistrationSlackNotification.mockResolvedValue({
      claimed: false,
      alreadyNotified: true,
      displayName: "DB太郎",
      error: null,
    });
    const expectedResponse = { success: true, message: "既に通知済みです" };
    nextResponseJsonMock.mockReturnValue(expectedResponse);

    const response = await POST();

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(nextResponseJsonMock).toHaveBeenCalledWith(expectedResponse);
    expect(response).toBe(expectedResponse);
  });
});
