import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['www.youtube.com','yahoo.co.jp'], // YouTubeサムネイルとプレースホルダー画像用のドメインを許可
  },
};

export default nextConfig;
