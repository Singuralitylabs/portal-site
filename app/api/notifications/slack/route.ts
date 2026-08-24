import { NextResponse } from "next/server";
import { USER_STATUS } from "@/app/constants/user";
import {
  claimRegistrationSlackNotification,
  releaseRegistrationSlackNotification,
} from "@/app/services/api/users-server";
import { requireApiUser } from "@/app/services/auth/require-api-user";
import { sanitizeSlackDisplayName } from "@/app/utils/slack-display-name";

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

export async function POST() {
  const auth = await requireApiUser([USER_STATUS.PENDING]);
  if (!auth.ok) {
    return auth.response;
  }

  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn("SLACK_WEBHOOK_URL環境変数が設定されていないため、Slack通知をスキップします");
    return NextResponse.json({ success: true, message: "環境変数未設定のためスキップ" });
  }

  const claim = await claimRegistrationSlackNotification({ authId: auth.user.id });
  if (claim.error) {
    return NextResponse.json(
      { success: false, error: "ユーザー情報の確認に失敗しました" },
      { status: 500 }
    );
  }
  if (!claim.claimed) {
    if (claim.alreadyNotified) {
      return NextResponse.json({ success: true, message: "既に通知済みです" });
    }
    return NextResponse.json(
      { success: false, error: "この操作は許可されていません" },
      { status: 403 }
    );
  }

  const displayName = sanitizeSlackDisplayName(claim.displayName);

  try {
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
      await releaseRegistrationSlackNotification({ authId: auth.user.id });
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
    await releaseRegistrationSlackNotification({ authId: auth.user.id });
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
