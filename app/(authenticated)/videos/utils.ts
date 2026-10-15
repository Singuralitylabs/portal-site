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
