import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { USER_STATUS } from "@/app/constants/user";
import { getServerCurrentUser } from "@/app/services/api/supabase-server";
import { fetchUserStatusByIdInServer } from "@/app/services/api/users-server";

interface SlackNotificationPayloadType {
  text: string;
  blocks?: Array<{
    type: string;
    text?: {
      type: string;
      text: string;
    };
  }>;
}

const DISPLAY_NAME_MAX_LENGTH = 100;

/**
 * Google 表示名で使われる括弧・カンマ・中点等は許可し、
 * 制御文字（改行含む）と Slack リンク記法の `<>` のみ拒否する。
 */
const slackNotificationSchema = z.object({
  displayName: z
    .string()
    .max(DISPLAY_NAME_MAX_LENGTH)
    .refine(value => !/[\p{C}<>]/u.test(value), { message: "表示名の形式が不正です" }),
});

export async function POST(request: NextRequest) {
  const { authId, error: authError } = await getServerCurrentUser();
  if (authError || !authId) {
    return NextResponse.json({ success: false, error: "認証が必要です" }, { status: 401 });
  }

  const { status, error: statusError } = await fetchUserStatusByIdInServer({ authId });
  if (statusError) {
    return NextResponse.json(
      { success: false, error: "ユーザー情報の確認に失敗しました" },
      { status: 500 }
    );
  }
  // 新規登録直後の pending ユーザーのみ許可する（active 限定にすると通知が届かない）
  if (status !== USER_STATUS.PENDING) {
    return NextResponse.json(
      { success: false, error: "この操作は許可されていません" },
      { status: 403 }
    );
  }

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: "リクエストが不正です" }, { status: 400 });
    }

    const parsed = slackNotificationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "リクエストが不正です" }, { status: 400 });
    }

    const { displayName } = parsed.data;
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
          text: {
            type: "mrkdwn",
            text: `${displayName}さんがポータルサイトに新規登録されました。管理者は承認作業をお願いします。`,
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
