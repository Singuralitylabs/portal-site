import { google } from "googleapis";
import * as path from "path";

// カレンダーIDの定義（環境変数から取得、なければデフォルト値を使用）
const getCalendarIds = (): string[] => {
  if (process.env.GOOGLE_CALENDAR_IDS) {
    return process.env.GOOGLE_CALENDAR_IDS.split(",").map((id) => id.trim());
  }
  // デフォルト値（環境変数が設定されていない場合）
  return [
    "hpb22r5bs28tr3f797l3ul3tgo@group.calendar.google.com", // シンラボMTG・イベントカレンダー1
    "pb619kfn323bjo2fbtalipd5ls@group.calendar.google.com", // シンラボMTG・イベントカレンダー2
    "c_4df1ec54385c933420637b11092efb7af2d5e7829941f8a7527ec5a8e4a2033d@group.calendar.google.com",
    "ja.japanese#holiday@group.v.calendar.google.com", // 日本の祝日
  ];
};

const CALENDAR_IDS = getCalendarIds();

// Googleカレンダーイベントの型定義
export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start?: {
    dateTime?: string;
    date?: string;
  };
  end?: {
    dateTime?: string;
    date?: string;
  };
  location?: string;
  htmlLink?: string;
}

interface FetchCalendarEventsResult {
  data: CalendarEvent[] | null;
  error: string | null;
}

export async function fetchCalendarEvents(): Promise<FetchCalendarEventsResult> {
  try {
    // 環境変数からサービスアカウントキーを取得、なければローカルファイルを使用
    let auth;
    if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
      // 本番環境：環境変数から認証情報を取得
      const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
      auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ["https://www.googleapis.com/auth/calendar.readonly"],
      });
    } else {
      // 開発環境：ローカルファイルから認証情報を取得
      const keyFilePath = path.join(process.cwd(), "google-service-account.json");
      auth = new google.auth.GoogleAuth({
        keyFile: keyFilePath,
        scopes: ["https://www.googleapis.com/auth/calendar.readonly"],
      });
    }

    // Google Calendar APIクライアントを作成
    const calendar = google.calendar({ version: "v3", auth });

    // 現在時刻から1ヶ月後までのイベントを取得
    const now = new Date();
    const oneMonthLater = new Date();
    oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);

    // 全カレンダーからイベントを取得
    const allEventsPromises = CALENDAR_IDS.map(async (calendarId) => {
      try {
        const response = await calendar.events.list({
          calendarId,
          timeMin: now.toISOString(),
          timeMax: oneMonthLater.toISOString(),
          maxResults: 50,
          singleEvents: true,
          orderBy: "startTime",
        });

        return response.data.items || [];
      } catch (error) {
        console.error(`カレンダー ${calendarId} の取得エラー:`, error);
        return [];
      }
    });

    const eventsArrays = await Promise.all(allEventsPromises);
    const allEvents = eventsArrays.flat();

    // 開始時刻でソート
    allEvents.sort((a, b) => {
      const aStart = a.start?.dateTime || a.start?.date || "";
      const bStart = b.start?.dateTime || b.start?.date || "";
      return aStart.localeCompare(bStart);
    });

    return {
      data: allEvents as CalendarEvent[],
      error: null,
    };
  } catch (error) {
    console.error("カレンダーイベント取得エラー:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "カレンダーイベントの取得に失敗しました",
    };
  }
}
