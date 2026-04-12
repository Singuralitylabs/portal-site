import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { POST } from "../../../app/api/notifications/slack/route";

jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn(),
  },
}));

const ORIGINAL_ENV = { ...process.env };
let fetchSpy: jest.SpyInstance;

type FetchResponseMock = {
  ok: boolean;
  status?: number;
  text?: jest.Mock<Promise<string>, []>;
};

/**
 * NextRequest 互換のモックを生成する。
 * @param body - リクエストの JSON ボディ
 * @returns NextRequest の代替オブジェクト
 */
const createRequest = (body: unknown): NextRequest =>
  ({
    json: jest.fn().mockResolvedValue(body),
  } as unknown as NextRequest);

describe("Slack 通知 API", () => {
  const nextResponseJsonMock = NextResponse.json as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...ORIGINAL_ENV };
    fetchSpy = jest.spyOn(global, "fetch");
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  /**
   * 正常系: Webhook URL が設定されている場合に Slack 通知が送信されることを検証する。
   */
  it("正常系: Slack 通知を送信し成功レスポンスを返す", async () => {
    process.env.SLACK_WEBHOOK_URL = "https://hooks.slack.com/services/test";
    const request = createRequest({ displayName: "テスト太郎" });
    const expectedResponse = { success: true };
    nextResponseJsonMock.mockReturnValue(expectedResponse);
    fetchSpy.mockResolvedValue({ ok: true } as FetchResponseMock);

    const response = await POST(request);

    expect((request as unknown as { json: jest.Mock }).json).toHaveBeenCalledTimes(1); // リクエスト本文の取得が 1 回だけ行われることを確認
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://hooks.slack.com/services/test",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
    ); // Slack Webhook が正しい引数で呼び出されることを確認
    expect(JSON.parse(fetchSpy.mock.calls[0][1].body as string)).toMatchObject({
      text: "新規ユーザー登録の承認依頼",
      blocks: expect.any(Array),
    }); // ペイロードの内容が期待通りであることを確認
    expect(nextResponseJsonMock).toHaveBeenCalledWith({ success: true }); // NextResponse.json が成功レスポンスで呼び出されることを確認
    expect(response).toBe(expectedResponse); // POST の戻り値が NextResponse.json の結果と一致することを確認
  });

  /**
   * 正常系: 環境変数が未設定の場合に Slack 通知をスキップする分岐を検証する。
   */
  it("正常系: Webhook 未設定時はスキップする", async () => {
    delete process.env.SLACK_WEBHOOK_URL;
    const request = createRequest({ displayName: "スキップ太郎" });
    const expectedResponse = { success: true, message: "環境変数未設定のためスキップ" };
    nextResponseJsonMock.mockReturnValue(expectedResponse);
    const consoleWarn = jest.spyOn(console, "warn").mockImplementation(() => {});

    const response = await POST(request);

    expect(fetchSpy).not.toHaveBeenCalled(); // Slack Webhook 呼び出しが行われないことを確認
    expect(nextResponseJsonMock).toHaveBeenCalledWith(expectedResponse); // スキップ用レスポンスが返されることを確認
    expect(response).toBe(expectedResponse); // POST の戻り値がスキップレスポンスであることを確認
    expect(consoleWarn).toHaveBeenCalled(); // 環境変数未設定の警告ログが出力されることを確認
    consoleWarn.mockRestore();
  });
});
