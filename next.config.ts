import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['picsum.photos'], // YouTubeサムネイルとプレースホルダー画像用のドメインを許可
  },
};

export default nextConfig;
