import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { POST } from "../../app/api/notifications/slack/route";

jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn(),
  },
}));

const ORIGINAL_ENV = { ...process.env };
const originalFetch = global.fetch;
const fetchMock = jest.fn();

global.fetch = fetchMock as unknown as typeof fetch;

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
    fetchMock.mockReset();
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
    global.fetch = originalFetch;
  });

  /**
   * 正常系: Webhook URL が設定されている場合に Slack 通知が送信されることを検証する。
   */
  it("正常系: Slack 通知を送信し成功レスポンスを返す", async () => {
    process.env.SLACK_WEBHOOK_URL = "https://hooks.slack.com/services/test";
    const request = createRequest({ displayName: "テスト太郎" });
    const expectedResponse = { success: true };
    nextResponseJsonMock.mockReturnValue(expectedResponse);
    fetchMock.mockResolvedValue({ ok: true } as FetchResponseMock);

    const response = await POST(request);

    expect((request as unknown as { json: jest.Mock }).json).toHaveBeenCalledTimes(1); // リクエスト本文の取得が 1 回だけ行われることを確認
    expect(fetchMock).toHaveBeenCalledWith(
      "https://hooks.slack.com/services/test",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
    ); // Slack Webhook が正しい引数で呼び出されることを確認
    expect(JSON.parse(fetchMock.mock.calls[0][1].body as string)).toMatchObject({
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

    expect(fetchMock).not.toHaveBeenCalled(); // Slack Webhook 呼び出しが行われないことを確認
    expect(nextResponseJsonMock).toHaveBeenCalledWith(expectedResponse); // スキップ用レスポンスが返されることを確認
    expect(response).toBe(expectedResponse); // POST の戻り値がスキップレスポンスであることを確認
    expect(consoleWarn).toHaveBeenCalled(); // 環境変数未設定の警告ログが出力されることを確認
    consoleWarn.mockRestore();
  });

  /**
   * 異常系: Slack API からエラー応答が返った場合に 500 エラーを返すことを検証する。
   */
  it("異常系: Slack API がエラーを返した場合は 500 を返す", async () => {
    process.env.SLACK_WEBHOOK_URL = "https://hooks.slack.com/services/test";
    const request = createRequest({ displayName: "失敗太郎" });
    const slackErrorResponse: FetchResponseMock = {
      ok: false,
      status: 500,
      text: jest.fn().mockResolvedValue("invalid_payload"),
    };
    fetchMock.mockResolvedValue(slackErrorResponse);
    const expectedResponse = { success: false, error: "Slack API エラー: 500 invalid_payload" };
    nextResponseJsonMock.mockReturnValue(expectedResponse);
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});

    const response = await POST(request);

    expect(fetchMock).toHaveBeenCalledTimes(1); // Slack Webhook 呼び出しが 1 回だけ行われることを確認
    expect(slackErrorResponse.text as jest.Mock).toHaveBeenCalledTimes(1); // エラーメッセージ取得のため text() が呼ばれることを確認
    expect(nextResponseJsonMock).toHaveBeenCalledWith(expectedResponse, { status: 500 }); // NextResponse.json が 500 ステータスで呼び出されることを確認
    expect(response).toBe(expectedResponse); // POST の戻り値がエラーレスポンスであることを確認
    expect(consoleError).toHaveBeenCalled(); // エラーログが出力されることを確認
    consoleError.mockRestore();
  });

  /**
   * 異常系: fetch 自体が例外を投げた場合でも 500 エラーを返すことを検証する。
   */
  it("異常系: Slack 通知処理中に例外が発生した場合でも 500 を返す", async () => {
    process.env.SLACK_WEBHOOK_URL = "https://hooks.slack.com/services/test";
    const request = createRequest({ displayName: "例外太郎" });
    fetchMock.mockRejectedValue(new Error("network error"));
    const expectedResponse = { success: false, error: "network error" };
    nextResponseJsonMock.mockReturnValue(expectedResponse);
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});

    const response = await POST(request);

    expect(fetchMock).toHaveBeenCalledTimes(1); // fetch が 1 回だけ呼び出されることを確認
    expect(nextResponseJsonMock).toHaveBeenCalledWith(expectedResponse, { status: 500 }); // NextResponse.json が 500 ステータスで呼び出されることを確認
    expect(response).toBe(expectedResponse); // POST の戻り値が例外用エラーレスポンスであることを確認
    expect(consoleError).toHaveBeenCalled(); // 例外内容がエラーログに出力されることを確認
    consoleError.mockRestore();
  });

  /**
   * 異常系: Error 以外の例外値が投げられた場合に "不明なエラー" を返すことを検証する。
   */
  it("異常系: 非 Error 例外時は 不明なエラー を返す", async () => {
    process.env.SLACK_WEBHOOK_URL = "https://hooks.slack.com/services/test";
    const request = createRequest({ displayName: "未知太郎" });
    fetchMock.mockRejectedValue("unexpected failure");
    const expectedResponse = { success: false, error: "不明なエラー" };
    nextResponseJsonMock.mockReturnValue(expectedResponse);
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});

    const response = await POST(request);

    expect(fetchMock).toHaveBeenCalledTimes(1); // fetch が 1 回だけ呼び出されることを確認
    expect(nextResponseJsonMock).toHaveBeenCalledWith(expectedResponse, { status: 500 }); // NextResponse.json が 500 ステータスで呼び出されることを確認
    expect(response).toBe(expectedResponse); // POST の戻り値が "不明なエラー" レスポンスであることを確認
    expect(consoleError).toHaveBeenCalled(); // ログ出力が行われることを確認
    consoleError.mockRestore();
  });
});
