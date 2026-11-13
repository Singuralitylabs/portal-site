import { YOUTUBE_HOSTNAME } from "@/app/constants/media";

// カスタムドメイン設定時にも追従できるよう、Supabaseの許可先はプロジェクトURLから導出する。
// URLが未設定・不正・http/https以外のスキームの場合は許可を広げず空にする(設定漏れをワイルドカードで隠さない)。
function getSupabaseCsp(): { httpOrigin: string; wsOrigin: string } {
  const empty = { httpOrigin: "", wsOrigin: "" };
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return empty;
  try {
    const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
    if (url.protocol !== "http:" && url.protocol !== "https:") return empty;
    const wsProtocol = url.protocol === "http:" ? "ws:" : "wss:";
    return { httpOrigin: url.origin, wsOrigin: `${wsProtocol}//${url.host}` };
  } catch {
    return empty;
  }
}

/**
 * リクエストごとに発行された nonce を用いて CSP を組み立てる。
 * script-src は nonce + strict-dynamic のみを信頼し 'unsafe-inline' を排除する
 * (Next.js のストリーミングスクリプトには自動でこの nonce が付与される)。
 * 'strict-dynamic' 下ではホスト許可(YouTube/vercel.live/'self')は strict-dynamic 非対応ブラウザ向けのフォールバックにすぎない。
 * 新しい外部スクリプトを追加する場合、ホスト追加ではなく nonce 付きスクリプトからの動的読み込みが必要。
 * style-src は要素(<style>)と属性(style="")を分離する。
 * Mantine v7 は CSS 変数注入用の <style> に getStyleNonce 経由で nonce を付与できるため
 * style-src-elem は nonce のみに絞れるが、アプリ側で多用している style={{...}} という
 * インライン style 属性は nonce/hash の対象外(CSPの仕様上、属性には適用できない)なため
 * style-src-attr は 'unsafe-inline' を許可する(値はすべて静的なので実害は限定的)。
 */
export function buildContentSecurityPolicy(nonce: string): string {
  // 環境依存の値は呼び出し時に評価する(テストで本番/Preview/開発を切り替えられるようにするため)
  const isDev = process.env.NODE_ENV !== "production";
  // Vercel Previewデプロイのフィードバックツールバー用(本番には影響しない)
  const isPreview = process.env.VERCEL_ENV === "preview";
  const previewSources = isPreview ? "https://vercel.live" : "";
  const { httpOrigin: supabaseHttpOrigin, wsOrigin: supabaseWsOrigin } = getSupabaseCsp();
  // 開発(next-devtools)とPreview(vercel.live)は nonce の付かない <style> を注入するため、
  // この2環境に限り style 要素の nonce を使わず 'unsafe-inline' を許可する(本番は nonce のみ)。
  // nonce が指定されていると 'unsafe-inline' は無視されるため、nonce は付けない。
  const styleElemSources =
    isDev || isPreview ? "'self' 'unsafe-inline'" : `'self' 'nonce-${nonce}'`;
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? ` 'unsafe-eval' http://${YOUTUBE_HOSTNAME}` : ""} https://${YOUTUBE_HOSTNAME} ${previewSources}`,
    `style-src ${styleElemSources} ${previewSources}`,
    `style-src-elem ${styleElemSources} ${previewSources}`,
    "style-src-attr 'unsafe-inline'",
    // applications.thumbnail_path・avatar_url は生の<img>(next/imageのremotePatternsを経由しない)で
    // 任意ホストのURLを許容する仕様のため、imgに限りhttps全般を許可する
    // (videos.thumbnail_pathはnext/image経由でremotePatternsの制約を別途受ける。Supabaseのhttp運用時に備え明示的にも追加)
    `img-src 'self' data: blob: https: ${supabaseHttpOrigin}`,
    `connect-src 'self' ${supabaseHttpOrigin} ${supabaseWsOrigin} ${previewSources}`,
    `frame-src https://${YOUTUBE_HOSTNAME} ${previewSources}`,
    `font-src 'self' ${previewSources}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ]
    .map(directive => directive.replace(/\s+/g, " ").trim())
    .join("; ");
}
