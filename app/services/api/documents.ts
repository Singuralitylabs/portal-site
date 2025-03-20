import supabase from "@/app/services/api/supabase";

// Documentsテーブルからデータを取得する関数
export async function fetchDocuments() {
  const { data, error } = await supabase.from("documents").select("*");

  if (error) {
    console.error("Supabase データ取得エラー:", error.message);
    return { data: null, error };
  }

  return { data, error: null };
}
