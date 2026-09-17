import type { NextConfig } from "next";
import { YOUTUBE_HOSTNAME, YOUTUBE_THUMBNAIL_HOSTNAME } from "./app/constants/media";

const GOOGLE_AVATAR_HOSTNAME = "lh3.googleusercontent.com";

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
          // Content-Security-Policy はリクエストごとの nonce が必要なため middleware.ts で設定する
        ],
      },
    ];
  },
};

export default nextConfig;
