import { createServerSupabaseClient, getServerCurrentUser } from "@/app/services/api/supabase-server";
import { NextResponse } from "next/server";

const BUCKET_NAME = "profile-images";
const MAX_FILE_SIZE = 1024 * 1024;
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/gif"];

export async function POST(request: Request) {
  const { authId, error: authError } = await getServerCurrentUser();
  if (authError || !authId) {
    return NextResponse.json({ success: false, error: "認証が必要です" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("image") as File | null;

  if (!file) {
    return NextResponse.json({ success: false, error: "画像ファイルを選択してください" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { success: false, error: "ファイルサイズは1MB以下にしてください" },
      { status: 400 }
    );
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return NextResponse.json(
      { success: false, error: "jpg / jpeg / png / gif のみアップロード可能です" },
      { status: 400 }
    );
  }

  const supabase = await createServerSupabaseClient();
  const filePath = `${authId}/profile-image`;
  const fileBuffer = await file.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, fileBuffer, { contentType: file.type, upsert: true });

  if (uploadError) {
    console.error("Storage アップロードエラー:", uploadError.message);
    return NextResponse.json(
      { success: false, error: "画像のアップロードに失敗しました" },
      { status: 500 }
    );
  }

  const { error: updateError } = await supabase
    .from("users")
    .update({ profile_image_path: filePath, updated_at: new Date().toISOString() })
    .eq("auth_id", authId);

  if (updateError) {
    console.error("profile_image_path 更新エラー:", updateError.message);
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
  const filePath = `${authId}/profile-image`;

  const { error: deleteError } = await supabase.storage.from(BUCKET_NAME).remove([filePath]);

  if (deleteError) {
    console.error("Storage 削除エラー:", deleteError.message);
    return NextResponse.json(
      { success: false, error: "画像の削除に失敗しました" },
      { status: 500 }
    );
  }

  const { error: updateError } = await supabase
    .from("users")
    .update({ profile_image_path: null, updated_at: new Date().toISOString() })
    .eq("auth_id", authId);

  if (updateError) {
    console.error("profile_image_path クリアエラー:", updateError.message);
    return NextResponse.json(
      { success: false, error: "プロフィール情報の更新に失敗しました" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
