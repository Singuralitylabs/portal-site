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

type RouteModule = typeof import("../../app/api/calendar/events/route");

const createRequest = (params: Record<string, string> = {}): NextRequest =>
  ({
    nextUrl: {
      searchParams: new URLSearchParams(params),
    },
  } as unknown as NextRequest);

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

afterAll(() => {
  process.env = ORIGINAL_ENV;
});

describe("calendar-server fetchCalendarEvents", () => {
  it("正常系: イベントを取得できる", async () => {
    process.env.GOOGLE_CALENDAR_IDS = "main:main%40example.com,sub:team%23calendar";
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY = JSON.stringify({
      client_email: "svc@example.com",
      private_key: "key",
    });
    const authInstance = { client: "mock" };
    googleAuthMock.mockReturnValue(authInstance);

    calendarEventsListMock
      .mockResolvedValueOnce({
        data: {
          items: [{ id: "late", start: { dateTime: "2024-01-10T00:00:00Z" } }],
        },
      })
      .mockResolvedValueOnce({
        data: {
          items: [{ id: "early", start: { dateTime: "2024-01-05T00:00:00Z" } }],
        },
      });

    const { fetchCalendarEvents } = await importCalendarServerModule();
    const result = await fetchCalendarEvents({
      startDate: new Date("2024-01-01T00:00:00Z"),
      endDate: new Date("2024-02-01T00:00:00Z"),
    });

    expect(googleAuthMock).toHaveBeenCalledWith({
      credentials: { client_email: "svc@example.com", private_key: "key" },
      scopes: [READONLY_SCOPE],
    });
    expect(calendarMock).toHaveBeenCalledWith({ version: "v3", auth: authInstance });
    expect(result).toEqual({
      data: [
        expect.objectContaining({ id: "early", calendarId: "sub" }),
        expect.objectContaining({ id: "late", calendarId: "main" }),
      ],
      error: null,
    });
  });

  it("異常系: 認証エラー時は data=null を返す", async () => {
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY = JSON.stringify({ client_email: "svc@example.com" });
    googleAuthMock.mockImplementation(() => {
      throw new Error("auth failed");
    });
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});

    const { fetchCalendarEvents } = await importCalendarServerModule();
    const result = await fetchCalendarEvents();

    expect(result).toEqual({ data: null, error: "auth failed" });
    expect(calendarEventsListMock).not.toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});

describe("calendar events route GET", () => {
  it("正常系: イベントを返す", async () => {
    process.env.GOOGLE_CALENDAR_IDS = "primary:primary%40example.com";
    delete process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

    calendarEventsListMock.mockResolvedValueOnce({
      data: {
        items: [{ id: "ok", start: { dateTime: "2024-05-02T00:00:00Z" } }],
      },
    });

    await runWithCalendarRouteModule(async ({ GET }, responseMock) => {
      const request = createRequest();
      const payload = { success: true };
      responseMock.mockReturnValue(payload);

      const response = await GET(request);

      expect(googleAuthMock).toHaveBeenCalledWith({
        keyFile: KEY_FILE_PATH,
        scopes: [READONLY_SCOPE],
      });
      expect(responseMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          events: [expect.objectContaining({ id: "ok", calendarId: "primary" })],
        })
      );
      expect(response).toBe(payload);
    });
  });

  it("異常系: エラー時は 500 を返す", async () => {
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY = JSON.stringify({ client_email: "svc@example.com" });
    googleAuthMock.mockImplementation(() => {
      throw new Error("route auth error");
    });

    await runWithCalendarRouteModule(async ({ GET }, responseMock) => {
      const request = createRequest();
      const payload = { success: false };
      responseMock.mockReturnValue(payload);

      const response = await GET(request);

      expect(responseMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: "カレンダーイベントの取得に失敗しました",
          details: "route auth error",
        }),
        { status: 500 }
      );
      expect(response).toBe(payload);
    });
  });
});
