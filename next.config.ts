import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['www.youtube.com', 'img.youtube.com'], // YouTubeサムネイルとプレースホルダー画像用のドメインを許可
  },
};

export default nextConfig;
