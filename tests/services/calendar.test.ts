import type { NextRequest } from "next/server";
import * as path from "path";

const READONLY_SCOPE = "https://www.googleapis.com/auth/calendar.readonly";
const KEY_FILE_PATH = path.join(process.cwd(), "google-service-account.json");

const googleAuthMock: jest.Mock = jest.fn();
const calendarMock: jest.Mock = jest.fn();
let calendarEventsListMock: jest.Mock;

jest.mock("googleapis", () => ({
  google: {
    auth: {
      GoogleAuth: function mockGoogleAuth(this: unknown, ...args: unknown[]) {
        return googleAuthMock(...args);
      },
    },
    calendar: (...args: unknown[]) => calendarMock(...args),
  },
  calendar_v3: {},
}));

jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn(),
  },
}));

const ORIGINAL_ENV = { ...process.env };

/**
 * NextRequest 互換のモックを生成する。
 * @param params - クエリパラメーター
 * @returns NextRequest 代替オブジェクト
 */
const createRequest = (params: Record<string, string> = {}): NextRequest =>
  ({
    nextUrl: {
      searchParams: new URLSearchParams(params),
    },
  } as unknown as NextRequest);

/**
 * calendar-server モジュールを現在の環境変数で隔離ロードする。
 * @returns calendar-server のエクスポート群
 */
const importCalendarServerModule = async () => {
  let module: typeof import("../../app/api/calendar/calendar-server");
  await jest.isolateModulesAsync(async () => {
    calendarMock.mockImplementation(() => ({
      events: {
        list: calendarEventsListMock,
      },
    }));
    module = await import("../../app/api/calendar/calendar-server");
  });
  return module!;
};

type RouteModule = typeof import("../../app/api/calendar/events/route");

/**
 * calendar/events route モジュールを隔離環境で実行し、テストハンドラに渡す。
 * @param handler - 取得したモジュールと NextResponse モックを受け取るコールバック
 */
const runWithCalendarRouteModule = async (
  handler: (module: RouteModule, responseMock: jest.Mock) => Promise<void>
) => {
  await jest.isolateModulesAsync(async () => {
    calendarMock.mockImplementation(() => ({
      events: {
        list: calendarEventsListMock,
      },
    }));
    const nextServerModule = await import("next/server");
    const responseMock = nextServerModule.NextResponse.json as jest.Mock;
    responseMock.mockClear();
    const module = await import("../../app/api/calendar/events/route");
    await handler(module, responseMock);
  });
};

beforeEach(() => {
  jest.clearAllMocks();
  process.env = { ...ORIGINAL_ENV };
  calendarEventsListMock = jest.fn();
  calendarMock.mockImplementation(() => ({
    events: {
      list: calendarEventsListMock,
    },
  }));
  googleAuthMock.mockImplementation(() => ({}));
});

describe("calendar-server fetchCalendarEvents", () => {
  /**
   * 正常系: 環境変数からカレンダー設定とサービスアカウントキーを読み込み、イベントを取得・ソートできること。
   */
  it("正常系: 環境変数指定の期間でイベントを取得できる", async () => {
    process.env.GOOGLE_CALENDAR_IDS = "main:main%40example.com,sub:team%23calendar";
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY = JSON.stringify({ client_email: "svc@example.com", private_key: "key" });
    const authInstance = { client: "mock" };
    googleAuthMock.mockReturnValue(authInstance);
    calendarEventsListMock
      .mockResolvedValueOnce({
        data: {
          items: [
            {
              id: "late",
              start: { dateTime: "2024-01-10T00:00:00Z" },
            },
          ],
        },
      })
      .mockResolvedValueOnce({
        data: {
          items: [
            {
              id: "early",
              start: { dateTime: "2024-01-05T00:00:00Z" },
            },
          ],
        },
      });

    const { fetchCalendarEvents } = await importCalendarServerModule();
    const startDate = new Date("2024-01-01T00:00:00Z");
    const endDate = new Date("2024-02-01T00:00:00Z");

    const result = await fetchCalendarEvents({ startDate, endDate });

    expect(googleAuthMock).toHaveBeenCalledWith({ credentials: { client_email: "svc@example.com", private_key: "key" }, scopes: [READONLY_SCOPE] }); // サービスアカウント認証に環境変数が使われることを確認
    expect(calendarMock).toHaveBeenCalledWith({ version: "v3", auth: authInstance }); // 取得した認証情報で Google カレンダー API クライアントが生成されることを確認
    expect(calendarEventsListMock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        calendarId: "main@example.com",
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        singleEvents: true,
        orderBy: "startTime",
      })
    ); // 1 つ目のカレンダーに対して正しいパラメータで API が呼ばれることを確認
    expect(calendarEventsListMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ calendarId: "team#calendar" })
    ); // 2 つ目のカレンダーでもデコード済み ID が利用されることを確認
    expect(result).toEqual({
      data: [
        expect.objectContaining({ id: "early", calendarId: "sub" }),
        expect.objectContaining({ id: "late", calendarId: "main" }),
      ],
      error: null,
    }); // エイリアス付与済みのイベントが開始時刻順で返却されることを確認
  });

  /**
   * 正常系: 環境変数が未設定でもローカルキーでイベント取得が可能なこと。
   */
  it("正常系: 環境変数未設定時はデフォルト設定とローカルキーで取得する", async () => {
    calendarEventsListMock.mockResolvedValueOnce({ data: { items: [{ id: "holiday", start: { dateTime: "2024-04-01T00:00:00Z" } }] } });

    const { fetchCalendarEvents } = await importCalendarServerModule();

    const result = await fetchCalendarEvents();

    expect(googleAuthMock).toHaveBeenCalledWith({ keyFile: KEY_FILE_PATH, scopes: [READONLY_SCOPE] }); // ローカル keyFile を用いた認証が行われることを確認
    expect(calendarEventsListMock).toHaveBeenCalledWith(expect.objectContaining({ calendarId: "ja.japanese#holiday@group.v.calendar.google.com" })); // デフォルトカレンダー ID で取得することを確認
    expect(result?.data).toHaveLength(1); // 取得結果が 1 件返ることを確認
  });

  /**
   * 正常系: デフォルト期間やフォールバック時刻でソートできること。
   */
  it("正常系: デフォルト期間で終日・開始未設定イベントをソートできる", async () => {
    jest.useFakeTimers();
    const baseDate = new Date("2024-07-01T00:00:00Z");
    jest.setSystemTime(baseDate);
    calendarEventsListMock.mockResolvedValueOnce({
      data: {
        items: [
          { id: "noStart" },
          { id: "allDay", start: { date: "2024-07-02" } },
        ],
      },
    });

    const { fetchCalendarEvents } = await importCalendarServerModule();
    const result = await fetchCalendarEvents();

    const listArgs = calendarEventsListMock.mock.calls[0][0];
    expect(listArgs.timeMin).toBe(baseDate.toISOString()); // デフォルト開始日時が現在時刻になることを確認
    const expectedMax = new Date(baseDate);
    expectedMax.setMonth(expectedMax.getMonth() + 1);
    expect(listArgs.timeMax).toBe(expectedMax.toISOString()); // デフォルト終了日時が 1 ヶ月後になることを確認
    expect(result?.data?.map(event => event.id)).toEqual(["noStart", "allDay"]); // フォールバック時刻でもソートできることを確認

    jest.useRealTimers();
  });

  /**
   * 正常系: items 未定義レスポンスでも空配列扱いとなり比較フォールバックを通過できること。
   */
  it("正常系: items 未定義レスポンスでもフォールバック比較が実行される", async () => {
    process.env.GOOGLE_CALENDAR_IDS = "primary:primary%40example.com,sub:sub%40example.com";
    calendarEventsListMock
      .mockResolvedValueOnce({ data: {} })
      .mockResolvedValueOnce({
        data: {
          items: [
            { id: "withTime", start: { dateTime: "2024-11-01T00:00:00Z" } },
            { id: "allDay", start: { date: "2024-11-05" } },
            { id: "noStart" },
          ],
        },
      });
    const originalSort = Array.prototype.sort;
    const sortSpy = jest.spyOn(Array.prototype, "sort").mockImplementation(function (
      this: unknown[],
      compareFn?: (a: unknown, b: unknown) => number
    ) {
      if (compareFn) {
        compareFn({} as Record<string, unknown>, { start: { date: "2024-11-10" } } as Record<string, unknown>);
        compareFn({ start: { date: "2024-11-11" } } as Record<string, unknown>, {} as Record<string, unknown>);
      }
      return originalSort.call(this, compareFn);
    });

    try {
      const { fetchCalendarEvents } = await importCalendarServerModule();
      const result = await fetchCalendarEvents();

      expect(calendarEventsListMock).toHaveBeenCalledTimes(2); // items 未定義でも空配列として処理されることを確認
      expect(result?.data).toHaveLength(3); // 2 つ目のカレンダーのイベントが取得されることを確認
    } finally {
      sortSpy.mockRestore();
    }
  });

  /**
   * 異常系: 認証時に例外が発生した場合でもエラー内容が返ること。
   */
  it("異常系: 認証エラー時は data=null とエラーメッセージを返す", async () => {
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY = JSON.stringify({ client_email: "svc@example.com" });
    googleAuthMock.mockImplementation(() => {
      throw new Error("auth failed");
    });
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});

    const { fetchCalendarEvents } = await importCalendarServerModule();
    const result = await fetchCalendarEvents();

    expect(result).toEqual({ data: null, error: "auth failed" }); // data=null と発生したエラーメッセージが返ることを確認
    expect(calendarEventsListMock).not.toHaveBeenCalled(); // 認証失敗のため API 呼び出しが行われないことを確認
    expect(consoleError).toHaveBeenCalled(); // エラーログが出力されることを確認
    consoleError.mockRestore();
  });

  /**
   * 異常系: Error 以外の例外値が投げられた場合に汎用エラーメッセージを返すこと。
   */
  it("異常系: 非 Error 例外時は既定メッセージを返す", async () => {
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY = JSON.stringify({ client_email: "svc@example.com" });
    googleAuthMock.mockImplementation(() => {
      throw "string failure";
    });
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});

    const { fetchCalendarEvents } = await importCalendarServerModule();
    const result = await fetchCalendarEvents();

    expect(result).toEqual({ data: null, error: "カレンダーイベントの取得に失敗しました" }); // 非 Error 例外でも既定メッセージで返ることを確認
    expect(consoleError).toHaveBeenCalledWith("カレンダーイベント取得エラー:", "string failure"); // console.error に例外内容が渡ることを確認
    consoleError.mockRestore();
  });

  /**
   * 正常系: 不正なカレンダー設定は警告して除外されること。
   */
  it("正常系: 不正なカレンダー設定を警告して無視する", async () => {
    process.env.GOOGLE_CALENDAR_IDS = "broken-entry,main:main%40example.com";
    const consoleWarn = jest.spyOn(console, "warn").mockImplementation(() => {});
    calendarEventsListMock.mockResolvedValueOnce({ data: { items: [{ id: "main", start: { dateTime: "2024-01-01T00:00:00Z" } }] } });

    const { fetchCalendarEvents } = await importCalendarServerModule();
    const result = await fetchCalendarEvents();

    expect(consoleWarn).toHaveBeenCalledWith("不正なカレンダー設定: broken-entry"); // 不正な設定に対して警告が出力されることを確認
    expect(calendarEventsListMock).toHaveBeenCalledTimes(1); // 有効な設定分のみ API が呼び出されることを確認
    expect(result?.data?.[0]).toEqual(expect.objectContaining({ id: "main", calendarId: "main" })); // 有効なカレンダーのイベントが取得されることを確認
    consoleWarn.mockRestore();
  });

  /**
   * 異常系: カレンダー API 呼び出し失敗時に個別カレンダーをスキップすること。
   */
  it("異常系: カレンダー取得失敗時は該当カレンダーを空配列として処理する", async () => {
    process.env.GOOGLE_CALENDAR_IDS = "main:main%40example.com,sub:sub%40example.com";
    calendarEventsListMock
      .mockRejectedValueOnce(new Error("list failed"))
      .mockResolvedValueOnce({ data: { items: [{ id: "sub", start: { dateTime: "2024-03-01T00:00:00Z" } }] } });
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});

    const { fetchCalendarEvents } = await importCalendarServerModule();
    const result = await fetchCalendarEvents();

    expect(calendarEventsListMock).toHaveBeenCalledTimes(2); // 全カレンダーで API 呼び出しが試行されることを確認
    expect(result).toEqual({ data: [expect.objectContaining({ id: "sub", calendarId: "sub" })], error: null }); // 成功したカレンダーのイベントのみ返ることを確認
    expect(consoleError).toHaveBeenCalledWith("カレンダー main (main@example.com) の取得エラー:", expect.any(Error)); // 失敗したカレンダーのエラーログが出力されることを確認
    consoleError.mockRestore();
  });
});

describe("calendar events route GET", () => {
  /**
   * 正常系: クエリ期間とカレンダー設定に基づきイベントを取得し成功レスポンスを返す。
   */
  it("正常系: クエリパラメータの期間でイベントを返す", async () => {
    process.env.GOOGLE_CALENDAR_IDS = "primary:primary%40example.com,sub:sub%40example.com";
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY = JSON.stringify({ client_email: "svc@example.com", private_key: "key" });
    calendarEventsListMock
      .mockResolvedValueOnce({ data: { items: [{ id: "main", start: { dateTime: "2024-05-02T00:00:00Z" } }] } })
      .mockRejectedValueOnce(new Error("failed"));
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});

    await runWithCalendarRouteModule(async ({ GET }, responseMock) => {
      const request = createRequest({ start: "2024-05-01T00:00:00Z", end: "2024-05-31T00:00:00Z" });
      const responsePayload = { success: true };
      responseMock.mockReturnValue(responsePayload);

      const response = await GET(request);

      expect(googleAuthMock).toHaveBeenCalled(); // サービスアカウント認証処理が呼び出されることを確認
      expect(responseMock).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, events: [expect.objectContaining({ id: "main", calendarId: "primary" })] })
      ); // 成功レスポンスとして取得イベントが返却されることを確認
      expect(response).toBe(responsePayload); // GET の戻り値が NextResponse.json の戻り値と一致することを確認
    });
    expect(consoleError).toHaveBeenCalled(); // 片方のカレンダーが失敗した際にエラーログが出力されることを確認
    consoleError.mockRestore();
  });

  /**
   * 異常系: 認証など致命的なエラー時に 500 レスポンスを返すこと。
   */
  it("異常系: 認証エラー時は 500 とエラーメッセージを返す", async () => {
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY = JSON.stringify({ client_email: "svc@example.com" });
    googleAuthMock.mockImplementation(() => {
      throw new Error("route auth error");
    });
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});

    await runWithCalendarRouteModule(async ({ GET }, responseMock) => {
      const request = createRequest();
      const responsePayload = { success: false };
      responseMock.mockReturnValue(responsePayload);

      const response = await GET(request);

      expect(responseMock).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, error: "カレンダーイベントの取得に失敗しました", details: "route auth error" }),
        { status: 500 }
      ); // 500 ステータスと詳細メッセージが返却されることを確認
      expect(calendarEventsListMock).not.toHaveBeenCalled(); // 認証前に失敗するため API 呼び出しが行われないことを確認
      expect(response).toBe(responsePayload); // GET の戻り値がエラーレスポンスであることを確認
    });
    expect(consoleError).toHaveBeenCalled(); // エラーログが出力されることを確認
    consoleError.mockRestore();
  });

  /**
   * 正常系: 環境変数未設定時にデフォルトカレンダーとデフォルト期間で取得すること。
   */
  it("正常系: 環境変数未設定時はデフォルト設定と1ヶ月後までの期間で返す", async () => {
    jest.useFakeTimers();
    const baseDate = new Date("2024-06-01T00:00:00Z");
    jest.setSystemTime(baseDate);
    calendarEventsListMock.mockResolvedValueOnce({
      data: {
        items: [
          { id: "late", start: { dateTime: "2024-06-20T00:00:00Z" } },
          { id: "early", start: { dateTime: "2024-06-05T00:00:00Z" } },
        ],
      },
    });

    await runWithCalendarRouteModule(async ({ GET }, responseMock) => {
      const request = createRequest();
      const payload = { success: true };
      responseMock.mockReturnValue(payload);

      const response = await GET(request);

      const authArgs = googleAuthMock.mock.calls[0][0];
      expect(authArgs).toEqual({ keyFile: KEY_FILE_PATH, scopes: [READONLY_SCOPE] }); // 環境変数が無い場合はローカル keyFile で認証することを確認
      const listArgs = calendarEventsListMock.mock.calls[0][0];
      expect(listArgs.calendarId).toBe("ja.japanese#holiday@group.v.calendar.google.com"); // デフォルトカレンダー ID が使用されることを確認
      expect(listArgs.timeMin).toBe(baseDate.toISOString()); // デフォルト開始日時が現在時刻になることを確認
      const expectedMax = new Date(baseDate);
      expectedMax.setMonth(expectedMax.getMonth() + 1);
      expect(listArgs.timeMax).toBe(expectedMax.toISOString()); // デフォルト終了日時が 1 ヶ月後になることを確認

      const eventsPayload = responseMock.mock.calls[0][0] as { events: Array<{ id: string }> };
      expect(eventsPayload.events.map(event => event.id)).toEqual(["early", "late"]); // イベントが開始時刻順にソートされることを確認
      expect(response).toBe(payload); // 戻り値が NextResponse.json の結果と一致することを確認
    });

    jest.useRealTimers();
  });

  /**
   * 正常系: items 未定義や終日イベントでもフォールバックが機能すること。
   */
  it("正常系: items 未定義や終日イベントでもソートできる", async () => {
    process.env.GOOGLE_CALENDAR_IDS = "primary:primary%40example.com,another:another%40example.com";
    calendarEventsListMock
      .mockResolvedValueOnce({ data: {} })
      .mockResolvedValueOnce({
        data: {
          items: [
            { id: "noStart" },
            { id: "allDay", start: { date: "2024-09-10" } },
          ],
        },
      });
    const originalSort = Array.prototype.sort;
    const sortSpy = jest.spyOn(Array.prototype, "sort").mockImplementation(function (
      this: unknown[],
      compareFn?: (a: unknown, b: unknown) => number
    ) {
      if (compareFn) {
        compareFn({} as Record<string, unknown>, { start: { date: "2024-09-11" } } as Record<string, unknown>);
        compareFn({ start: { date: "2024-09-12" } } as Record<string, unknown>, {} as Record<string, unknown>);
      }
      return originalSort.call(this, compareFn);
    });

    try {
      await runWithCalendarRouteModule(async ({ GET }, responseMock) => {
        const request = createRequest();
        const payload = { success: true };
        responseMock.mockReturnValue(payload);

        const response = await GET(request);

        expect(calendarEventsListMock).toHaveBeenCalledTimes(2); // カレンダーごとに API が呼ばれることを確認
        const eventsPayload = responseMock.mock.calls[0][0] as { events: Array<{ id: string }> };
        expect(eventsPayload.events.map(event => event.id)).toEqual(["noStart", "allDay"]); // items が無くてもソート結果が返ることを確認
        expect(response).toBe(payload); // GET の戻り値が NextResponse.json の結果と一致することを確認
      });
    } finally {
      sortSpy.mockRestore();
    }
  });

  /**
   * 警告系: 不正なカレンダー設定は警告出力後に除外されること。
   */
  it("警告: 不正なカレンダー設定は除外される", async () => {
    process.env.GOOGLE_CALENDAR_IDS = "broken-entry,ok:ok%40example.com";
    calendarEventsListMock.mockResolvedValueOnce({ data: { items: [{ id: "ok", start: { dateTime: "2024-08-01T00:00:00Z" } }] } });
    const consoleWarn = jest.spyOn(console, "warn").mockImplementation(() => {});

    await runWithCalendarRouteModule(async ({ GET }, responseMock) => {
      const request = createRequest({ start: "2024-08-01T00:00:00Z" });
      responseMock.mockReturnValue({ success: true });

      await GET(request);

      expect(consoleWarn).toHaveBeenCalledWith("不正なカレンダー設定: broken-entry"); // 不正設定が警告されることを確認
      expect(calendarEventsListMock).toHaveBeenCalledTimes(1); // 有効な設定分のみ API が呼び出されることを確認
    });

    consoleWarn.mockRestore();
  });

  /**
   * 異常系: ルート内で Error 以外の例外が発生した場合に "不明なエラー" を返すこと。
   */
  it("異常系: 非 Error 例外時は 不明なエラー を返す", async () => {
    googleAuthMock.mockImplementation(() => {
      throw "route failure";
    });
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});

    await runWithCalendarRouteModule(async ({ GET }, responseMock) => {
      const request = createRequest();
      const payload = { success: false };
      responseMock.mockReturnValue(payload);

      const response = await GET(request);

      expect(responseMock).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, error: "カレンダーイベントの取得に失敗しました", details: "不明なエラー" }),
        { status: 500 }
      ); // 非 Error 例外時には詳細が "不明なエラー" になることを確認
      expect(response).toBe(payload); // 戻り値が NextResponse.json の結果と一致することを確認
    });

    expect(consoleError).toHaveBeenCalledWith("カレンダーイベント取得エラー:", "route failure"); // console.error に例外内容が渡ることを確認
    consoleError.mockRestore();
  });
});
