import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";
import * as path from "path";

// カレンダーIDを環境変数から取得、なければデフォルト値を使用
const getCalendarIds = (): string[] => {
  if (process.env.GOOGLE_CALENDAR_IDS) {
    return process.env.GOOGLE_CALENDAR_IDS.split(",").map(id => id.trim());
  }
  // デフォルト値
  return [
    "c_4df1ec54385c933420637b11092efb7af2d5e7829941f8a7527ec5a8e4a2033d@group.calendar.google.com",
    "ja.japanese#holiday@group.v.calendar.google.com",
  ];
};

const CALENDAR_IDS = getCalendarIds();

export async function GET(request: NextRequest) {
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

    // クエリパラメータから取得期間を取得
    const searchParams = request.nextUrl.searchParams;
    const startParam = searchParams.get("start");
    const endParam = searchParams.get("end");

    // 取得期間の設定（パラメータがあればそれを使用、なければデフォルト）
    const startDate = startParam ? new Date(startParam) : new Date();
    const endDate = endParam
      ? new Date(endParam)
      : (() => {
          const oneMonthLater = new Date();
          oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
          return oneMonthLater;
        })();

    // 全カレンダーからイベントを取得
    const allEventsPromises = CALENDAR_IDS.map(async calendarId => {
      try {
        const response = await calendar.events.list({
          calendarId,
          timeMin: startDate.toISOString(),
          timeMax: endDate.toISOString(),
          maxResults: 100,
          singleEvents: true,
          orderBy: "startTime",
        });

        // 各イベントにカレンダーIDを付与
        const events = (response.data.items || []).map(event => ({
          ...event,
          calendarId,
        }));

        return events;
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
