const DISPLAY_NAME_MAX_LENGTH = 100;

/**
 * Slack 本文に載せる表示名をサニタイズする。
 * 制御文字 (Cc) とリンク記法の `<>` のみ除去し、ZWNJ 等の書式文字 (Cf) は残す。
 */
export function sanitizeSlackDisplayName(name: string): string {
  const sanitized = name.replace(/[\p{Cc}<>]/gu, "").trim();
  return sanitized.slice(0, DISPLAY_NAME_MAX_LENGTH) || "（名前未設定）";
}
