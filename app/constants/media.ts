// next.config.ts (images.remotePatterns) と app/utils/csp.ts (CSP) と VideoCard.tsx から参照し、
// YouTubeサムネイルの許可ホストを一元管理する
export const YOUTUBE_HOSTNAME = "www.youtube.com";
export const YOUTUBE_THUMBNAIL_HOSTNAME = "img.youtube.com";
