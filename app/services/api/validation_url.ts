import { z } from "zod";

/**
 * zodを用いたバリデーション
 * 1. 文字列であること
 * 2. 有効なURL形式であること (new URLでパースして確認)
 * 3. https:// で始まることのみを許可
 */
const httpsOnlySchema = z.string().refine(
  val => {
    try {
      const parsed = new URL(val);
      return parsed.protocol === "https:";
    } catch {
      return false;
    }
  },
  {
    message: "URLは https:// から始まる正しい形式で入力してください",
  }
);

/**
 * isValidUrl関数
 * 単独URLのバリデーション_動画、資料、アプリ登録URLに対して
 * 1. null または 空文字列は「未入力」として許容
 * 2. それ以外は zod（関数名httpsOnlySchema)を用いてチェックする
 */
export function isValidUrl(url: string | null): boolean {
  if (!url || url.trim() === "") return true;
  return httpsOnlySchema.safeParse(url).success;
}

/**
 * validateUrls関数
 * 複数URLのバリデーション_プロフィール上の各種SNS URL登録に対して
 * ループ処理で一つずつに上記のisValidUrl関数を適用する
 * 不合格なURLがあれば、そのフィールド名を配列で返す
 */
export function validateUrls(urls: Record<string, string | null>): string[] {
  const invalidFields: string[] = [];
  for (const [field, url] of Object.entries(urls)) {
    if (!isValidUrl(url)) {
      invalidFields.push(field);
    }
  }
  return invalidFields;
}
