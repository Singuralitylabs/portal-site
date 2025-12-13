import { google } from "googleapis";
import * as path from "path";

// カレンダーIDの定義（環境変数から取得、なければデフォルト値を使用）
const getCalendarIds = (): string[] => {
  if (process.env.GOOGLE_CALENDAR_IDS) {
    console.log("🔧 環境変数GOOGLE_CALENDAR_IDSから読み込み");
    const ids = process.env.GOOGLE_CALENDAR_IDS.split(",").map((id) => id.trim());
    console.log(`🔧 環境変数の値: ${process.env.GOOGLE_CALENDAR_IDS}`);
    return ids;
  }
  // デフォルト値（環境変数が設定されていない場合）
  console.log("🔧 デフォルトのカレンダーIDを使用");
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
    console.log("📅 カレンダーイベント取得開始");
    console.log("📋 読み込まれたカレンダーID一覧:");
    CALENDAR_IDS.forEach((id, index) => {
      console.log(`  [${index + 1}] ${id}`);
    });

    // 環境変数からサービスアカウントキーを取得、なければローカルファイルを使用
    let auth;
    if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
      console.log("🔑 環境変数から認証情報を取得");
      // 本番環境：環境変数から認証情報を取得
      const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
      auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ["https://www.googleapis.com/auth/calendar.readonly"],
      });
    } else {
      console.log("🔑 ローカルファイルから認証情報を取得");
      // 開発環境：ローカルファイルから認証情報を取得
      const keyFilePath = path.join(process.cwd(), "google-service-account.json");
      console.log(`📁 キーファイルパス: ${keyFilePath}`);
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
    console.log(`📆 ${CALENDAR_IDS.length}個のカレンダーから予定を取得`);
    const allEventsPromises = CALENDAR_IDS.map(async (calendarId, index) => {
      try {
        console.log(`  [${index + 1}/${CALENDAR_IDS.length}] ${calendarId} を取得中...`);
        const response = await calendar.events.list({
          calendarId,
          timeMin: now.toISOString(),
          timeMax: oneMonthLater.toISOString(),
          maxResults: 50,
          singleEvents: true,
          orderBy: "startTime",
        });

        const events = response.data.items || [];
        console.log(`  ✅ [${index + 1}/${CALENDAR_IDS.length}] ${events.length}件の予定を取得`);
        return events;
      } catch (error) {
        console.error(`  ❌ [${index + 1}/${CALENDAR_IDS.length}] カレンダー ${calendarId} の取得エラー:`, error);
        if (error instanceof Error) {
          console.error(`     エラー詳細: ${error.message}`);
        }
        return [];
      }
    });

    const eventsArrays = await Promise.all(allEventsPromises);
    const allEvents = eventsArrays.flat();

    console.log(`📊 合計 ${allEvents.length}件の予定を取得しました`);

    // 開始時刻でソート
    allEvents.sort((a, b) => {
      const aStart = a.start?.dateTime || a.start?.date || "";
      const bStart = b.start?.dateTime || b.start?.date || "";
      return aStart.localeCompare(bStart);
    });

    console.log("✅ カレンダーイベント取得完了");
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
