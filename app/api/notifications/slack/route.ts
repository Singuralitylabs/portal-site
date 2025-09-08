import { NextRequest, NextResponse } from "next/server";

interface SlackNotificationPayloadType {
  text: string;
  blocks?: Array<{
    type: string;
    text?: {
      type: string;
      text: string;
    };
    fields?: Array<{
      type: string;
      text: string;
    }>;
  }>;
}

interface NewUserNotificationType {
  displayName: string;
  authId: string;
}

export async function POST(request: NextRequest) {
  try {
    const userData: NewUserNotificationType = await request.json();
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;

    if (!webhookUrl) {
      console.warn("SLACK_WEBHOOK_URL環境変数が設定されていないため、Slack通知をスキップします");
      return NextResponse.json({ success: true, message: "環境変数未設定のためスキップ" });
    }

    const payload: SlackNotificationPayloadType = {
      text: "新規ユーザー登録の承認依頼",
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "新規ユーザー登録の承認依頼",
          },
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*ユーザー名:*\n${userData.displayName}`,
            },
            {
              type: "mrkdwn",
              text: `*ステータス:*\n承認待ち`,
            },
            {
              type: "mrkdwn",
              text: `*登録日時:*\n${new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}`,
            },
          ],
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "管理者による承認作業をお願いします。\n承認は管理画面から行ってください。",
          },
        },
      ],
    };

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Slack通知の送信に失敗:", response.status, errorText);
      return NextResponse.json(
        {
          success: false,
          error: `Slack API エラー: ${response.status} ${errorText}`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Slack通知の送信エラー:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "不明なエラー",
      },
      { status: 500 }
    );
  }
}
