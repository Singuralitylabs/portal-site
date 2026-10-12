import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { getServerAuth } from "@/app/services/auth/server-auth";
import type { UserStatusType } from "@/app/types";

export type RequireApiUserSuccess = {
  ok: true;
  user: User;
  userStatus: UserStatusType;
  displayName: string;
};

export type RequireApiUserFailure = {
  ok: false;
  response: NextResponse;
};

/**
 * API ルート用の認証・ステータス確認。
 * getServerAuth() で auth.getUser と users.status を同一クライアントから取得する。
 */
export async function requireApiUser(
  allowedStatuses: readonly UserStatusType[]
): Promise<RequireApiUserSuccess | RequireApiUserFailure> {
  const auth = await getServerAuth();

  if (!auth.user) {
    if (auth.error) {
      return {
        ok: false,
        response: NextResponse.json(
          { success: false, error: "ユーザー情報の確認に失敗しました" },
          { status: 500 }
        ),
      };
    }
    return {
      ok: false,
      response: NextResponse.json({ success: false, error: "認証が必要です" }, { status: 401 }),
    };
  }

  if (auth.error) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: "ユーザー情報の確認に失敗しました" },
        { status: 500 }
      ),
    };
  }

  if (!auth.userStatus || !allowedStatuses.includes(auth.userStatus)) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: "この操作は許可されていません" },
        { status: 403 }
      ),
    };
  }

  return {
    ok: true,
    user: auth.user,
    userStatus: auth.userStatus,
    displayName: auth.displayName ?? "",
  };
}
