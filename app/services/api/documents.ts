import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/app/services/api/supabase-server";

export async function fetchDocuments() {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("documents")
    .select(`*, category:categories (name)`)
    .eq("is_deleted", false);

  if (error) {
    console.error("Supabase 資料一覧データ取得エラー:", error.message);
    return { data: null, error };
  }

  return { data, error: null };
}

// 対象の資料を論理削除するAPI
export async function deleteDocument(req: NextRequest) {
  const { id } = await req.json();
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("documents").update({ is_deleted: true }).eq("id", id);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
