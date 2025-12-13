import { google } from "googleapis";
import { NextResponse } from "next/server";
import * as path from "path";

// カレンダーIDを環境変数から取得
const CALENDAR_IDS = (process.env.GOOGLE_CALENDAR_IDS || "")
  .split(",")
  .map(id => id.trim())
  .filter(Boolean);

// カレンダーIDが設定されていない場合はエラー
if (CALENDAR_IDS.length === 0) {
  throw new Error(
    "GOOGLE_CALENDAR_IDS environment variable is not configured. Please set it in your .env file."
  );
}

export async function GET() {
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
    const allEventsPromises = CALENDAR_IDS.map(async calendarId => {
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

    return NextResponse.json({
      success: true,
      events: allEvents,
    });
  } catch (error) {
    console.error("カレンダーイベント取得エラー:", error);
    return NextResponse.json(
      {
        success: false,
        error: "カレンダーイベントの取得に失敗しました",
        details: error instanceof Error ? error.message : "不明なエラー",
      },
      { status: 500 }
    );
  }
}
