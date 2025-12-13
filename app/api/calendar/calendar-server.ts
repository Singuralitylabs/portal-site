import { google } from "googleapis";
import * as path from "path";

// カレンダーIDとエイリアスのマッピング
interface CalendarConfig {
  alias: string;
  id: string;
}

// カレンダー設定の取得（環境変数から取得、なければデフォルト値を使用）
const getCalendarConfigs = (): CalendarConfig[] => {
  if (process.env.GOOGLE_CALENDAR_IDS) {
    return process.env.GOOGLE_CALENDAR_IDS.split(",")
      .map(entry => entry.trim())
      .map(entry => {
        // "alias:calendarId" 形式をパース
        const [alias, encodedId] = entry.split(":");
        if (!alias || !encodedId) {
          console.warn(`不正なカレンダー設定: ${entry}`);
          return null;
        }
        return {
          alias: alias.trim(),
          id: decodeURIComponent(encodedId.trim()), // URLエンコードされた#(%23)をデコード
        };
      })
      .filter((config): config is CalendarConfig => config !== null);
  }
  // デフォルト値（環境変数が設定されていない場合）
  return [
    {
      alias: "holiday",
      id: "ja.japanese#holiday@group.v.calendar.google.com",
    },
  ];
};

const CALENDAR_CONFIGS = getCalendarConfigs();

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
  calendarId?: string; // カレンダーID（色分けに使用）
}

interface FetchCalendarEventsResult {
  data: CalendarEvent[] | null;
  error: string | null;
}

interface FetchCalendarEventsOptions {
  startDate?: Date;
  endDate?: Date;
}

export async function fetchCalendarEvents(
  options: FetchCalendarEventsOptions = {}
): Promise<FetchCalendarEventsResult> {
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

    // 取得期間の設定（デフォルト：現在時刻から1ヶ月後まで）
    const startDate = options.startDate || new Date();
    const endDate =
      options.endDate ||
      (() => {
        const oneMonthLater = new Date();
        oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
        return oneMonthLater;
      })();

    // 全カレンダーからイベントを取得
    const allEventsPromises = CALENDAR_CONFIGS.map(async config => {
      try {
        const response = await calendar.events.list({
          calendarId: config.id,
          timeMin: startDate.toISOString(),
          timeMax: endDate.toISOString(),
          maxResults: 100,
          singleEvents: true,
          orderBy: "startTime",
        });

        // 各イベントにカレンダーエイリアスを付与（IDは付与しない）
        const events = (response.data.items || []).map(event => ({
          ...event,
          calendarId: config.alias, // エイリアスを使用
        }));

        return events;
      } catch (error) {
        console.error(`カレンダー ${config.alias} (${config.id}) の取得エラー:`, error);
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
