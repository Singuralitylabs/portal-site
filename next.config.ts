import type { NextConfig } from "next";
import { YOUTUBE_HOSTNAME, YOUTUBE_THUMBNAIL_HOSTNAME } from "./app/constants/media";

const GOOGLE_AVATAR_HOSTNAME = "lh3.googleusercontent.com";
const isDev = process.env.NODE_ENV !== "production";

// カスタムドメイン設定時にも追従できるよう、Supabaseの許可先はプロジェクトURLから導出する。
// URLが未設定・不正な場合は許可を広げず空にする(設定漏れをワイルドカードで隠さない)。
function getSupabaseCsp(): { httpOrigin: string; wsOrigin: string } {
  const empty = { httpOrigin: "", wsOrigin: "" };
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return empty;
  try {
    const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
    const wsProtocol = url.protocol === "http:" ? "ws:" : "wss:";
    return { httpOrigin: url.origin, wsOrigin: `${wsProtocol}//${url.host}` };
  } catch {
    return empty;
  }
}

const { httpOrigin: supabaseHttpOrigin, wsOrigin: supabaseWsOrigin } = getSupabaseCsp();

// Vercel Previewデプロイのフィードバックツールバー用(本番には影響しない)
const previewSources = process.env.VERCEL_ENV === "preview" ? "https://vercel.live" : "";

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://${YOUTUBE_HOSTNAME} ${previewSources}`,
  `style-src 'self' 'unsafe-inline' ${previewSources}`,
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

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: YOUTUBE_HOSTNAME,
      },
      {
        protocol: "https",
        hostname: YOUTUBE_THUMBNAIL_HOSTNAME,
      },
      {
        protocol: "https",
        hostname: GOOGLE_AVATAR_HOSTNAME,
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Content-Security-Policy",
            value: contentSecurityPolicy,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
