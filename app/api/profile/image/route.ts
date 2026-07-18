import {
  createServerSupabaseClient,
  getServerCurrentUser,
} from "@/app/services/api/supabase-server";
import { NextResponse } from "next/server";

const BUCKET_NAME = "profile-images";
const MAX_FILE_SIZE = 1024 * 1024;
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/gif"];

function detectMimeFromBuffer(buf: Buffer): string | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (
    buf.length >= 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  )
    return "image/png";
  if (buf.length >= 4 && buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38)
    return "image/gif";
  return null;
}

async function isActiveUser(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  authId: string
) {
  const { data, error } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", authId)
    .eq("status", "active")
    .eq("is_deleted", false)
    .maybeSingle();

  return { isActive: !!data, error };
}

export async function POST(request: Request) {
  const { authId, error: authError } = await getServerCurrentUser();
  if (authError || !authId) {
    return NextResponse.json({ success: false, error: "認証が必要です" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("image") as File | null;

  if (!file) {
    return NextResponse.json(
      { success: false, error: "画像ファイルを選択してください" },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { success: false, error: "ファイルサイズは1MB以下にしてください" },
      { status: 400 }
    );
  }

  const fileBuffer = Buffer.from(await file.arrayBuffer());
  const detectedMime = detectMimeFromBuffer(fileBuffer);
  if (!detectedMime || !ALLOWED_MIME_TYPES.includes(detectedMime)) {
    return NextResponse.json(
      { success: false, error: "jpeg / png / gif のみアップロード可能です" },
      { status: 400 }
    );
  }

  const supabase = await createServerSupabaseClient();
  const { isActive, error: activeUserError } = await isActiveUser(supabase, authId);
  if (activeUserError) {
    return NextResponse.json(
      { success: false, error: "ユーザー情報の確認に失敗しました" },
      { status: 500 }
    );
  }
  if (!isActive) {
    return NextResponse.json(
      { success: false, error: "この操作は許可されていません" },
      { status: 403 }
    );
  }

  const filePath = `${authId}/profile-image`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, fileBuffer, { contentType: detectedMime, upsert: true });

  if (uploadError) {
    console.error("Storage アップロードエラー:", uploadError.message);
    return NextResponse.json(
      { success: false, error: "画像のアップロードに失敗しました" },
      { status: 500 }
    );
  }

  const { error: updateError } = await supabase
    .from("users")
    .update({ profile_image_path: filePath })
    .eq("auth_id", authId)
    .eq("is_deleted", false);

  if (updateError) {
    console.error("profile_image_path 更新エラー:", updateError.message);
    const { error: rollbackError } = await supabase.storage.from(BUCKET_NAME).remove([filePath]);
    if (rollbackError) {
      console.error("Storage ロールバック失敗:", rollbackError.message);
    }
    return NextResponse.json(
      { success: false, error: "プロフィール情報の更新に失敗しました" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, profile_image_path: filePath });
}

export async function DELETE() {
  const { authId, error: authError } = await getServerCurrentUser();
  if (authError || !authId) {
    return NextResponse.json({ success: false, error: "認証が必要です" }, { status: 401 });
  }

  const supabase = await createServerSupabaseClient();
  const { isActive, error: activeUserError } = await isActiveUser(supabase, authId);
  if (activeUserError) {
    return NextResponse.json(
      { success: false, error: "ユーザー情報の確認に失敗しました" },
      { status: 500 }
    );
  }
  if (!isActive) {
    return NextResponse.json(
      { success: false, error: "この操作は許可されていません" },
      { status: 403 }
    );
  }

  const filePath = `${authId}/profile-image`;

  const { error: updateError } = await supabase
    .from("users")
    .update({ profile_image_path: null })
    .eq("auth_id", authId)
    .eq("is_deleted", false);

  if (updateError) {
    console.error("profile_image_path クリアエラー:", updateError.message);
    return NextResponse.json(
      { success: false, error: "プロフィール情報の更新に失敗しました" },
      { status: 500 }
    );
  }

  const { error: deleteError } = await supabase.storage.from(BUCKET_NAME).remove([filePath]);

  if (deleteError) {
    console.error("Storage 削除エラー（DBは更新済み）:", deleteError.message);
  }

  return NextResponse.json({ success: true });
}
