import { YOUTUBE_THUMBNAIL_HOSTNAME } from "@/app/constants/media";
import type { VideoWithCategoryType } from "@/app/types";

export function getYouTubeVideoId(url: string): string | undefined {
  const match = url.match(
    /(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/
  );
  return match?.[1];
}

export function getVideoThumbnailUrl(
  video: Pick<VideoWithCategoryType, "thumbnail_path" | "url">
): string {
  if (video.thumbnail_path) {
    return video.thumbnail_path;
  }

  const videoId = getYouTubeVideoId(video.url);
  return videoId
    ? `https://${YOUTUBE_THUMBNAIL_HOSTNAME}/vi/${videoId}/hqdefault.jpg`
    : "/default_video_thumbnail.png";
}

export function formatVideoUpdatedDate(timestamp: string): string {
  const hasTimezone = /(?:Z|[+-]\d{2}:\d{2})$/i.test(timestamp);
  const date = new Date(hasTimezone ? timestamp : `${timestamp}Z`);

  return date
    .toLocaleDateString("ja-JP", {
      timeZone: "Asia/Tokyo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    .replaceAll("/", "-");
}

export function formatVideoDuration(seconds: number | null): string {
  return seconds
    ? `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, "0")}`
    : "未設定";
}
