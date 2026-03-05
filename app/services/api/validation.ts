/** * URLのバリデーションを行う
 * @param url - 検証するURL
 * @returns 有効なURLの場合はtrue、無効な場合はfalse
 */
export function isValidUrl(url: string | null): boolean {
  // null または 空文字列は許可
  if (!url || url.trim() === "") return true;
  // httpsスキームのみ許可（javascript:, data: などの危険なスキームを防止）
  return /^https?:\/\/.+/.test(url);
}

/** * 複数のURLをバリデーションし、無効なフィールド名を返す
 * @param urls - フィールド名とURLのマップ
 * @returns 無効なURLのフィールド名の配列
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
