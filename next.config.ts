import type { NextConfig } from "next";

const YOUTUBE_HOSTNAME = "www.youtube.com";
const YOUTUBE_THUMBNAIL_HOSTNAME = "img.youtube.com";
const GOOGLE_AVATAR_HOSTNAME = "lh3.googleusercontent.com";

// カスタムドメイン設定時にも追従できるよう、Supabaseの許可先はプロジェクトURLから導出する
function getSupabaseHost(): string {
  const fallback = "*.supabase.co";
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return fallback;
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).host;
  } catch {
    return fallback;
  }
}

const supabaseHost = getSupabaseHost();

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://${YOUTUBE_HOSTNAME}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: https://${YOUTUBE_HOSTNAME} https://${YOUTUBE_THUMBNAIL_HOSTNAME} https://${GOOGLE_AVATAR_HOSTNAME} https://${supabaseHost}`,
  `connect-src 'self' https://${supabaseHost} wss://${supabaseHost}`,
  `frame-src https://${YOUTUBE_HOSTNAME}`,
  "font-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

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
