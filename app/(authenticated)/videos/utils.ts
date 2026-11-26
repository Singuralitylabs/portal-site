import { YOUTUBE_THUMBNAIL_HOSTNAME } from "@/app/constants/media";
import type { SelectCategoryType, VideoWithCategoryType } from "@/app/types";

export const VIDEO_SORT_OPTIONS = [
  { value: "display", label: "表示順" },
  { value: "recorded-desc", label: "収録日が新しい順" },
  { value: "recorded-asc", label: "収録日が古い順" },
  { value: "assignee-asc", label: "責任者名の昇順" },
  { value: "assignee-desc", label: "責任者名の降順" },
] as const;

export interface VideoFilters {
  query: string;
  start: string | null;
  end: string | null;
  sort: (typeof VIDEO_SORT_OPTIONS)[number]["value"];
  acrossCategories: boolean;
}

export const DEFAULT_VIDEO_FILTERS: VideoFilters = {
  query: "",
  start: null,
  end: null,
  sort: "display",
  acrossCategories: false,
};

type SearchableVideo = Pick<
  VideoWithCategoryType,
  "id" | "name" | "description" | "category_id" | "display_order" | "assignee"
> & { recorded_on: string | null };

const normalizeSearch = (text: string) => text.normalize("NFKC").toLowerCase();
const assigneeCollator = new Intl.Collator("ja");

export function getVideoSections<Video extends SearchableVideo>(
  videos: readonly Video[],
  categories: readonly SelectCategoryType[],
  { query, start, end, sort, acrossCategories }: VideoFilters
) {
  const search = normalizeSearch(query).trim();
  const categoryOrder = new Map(categories.map(({ id }, index) => [id, index]));
  const matching = videos.filter(video => {
    if (
      search &&
      !normalizeSearch(video.name).includes(search) &&
      !normalizeSearch(video.description ?? "").includes(search)
    )
      return false;

    const recorded = video.recorded_on;
    return (
      (!start && !end) || (!!recorded && (!start || recorded >= start) && (!end || recorded <= end))
    );
  });

  const compare = (first: Video, second: Video) => {
    const displayOrder =
      (categoryOrder.get(first.category_id) ?? categories.length) -
        (categoryOrder.get(second.category_id) ?? categories.length) ||
      first.display_order - second.display_order ||
      first.id - second.id;

    if (sort === "display") return displayOrder;

    const byAssignee = sort.startsWith("assignee");
    const firstValue = byAssignee ? first.assignee?.display_name : first.recorded_on;
    const secondValue = byAssignee ? second.assignee?.display_name : second.recorded_on;
    if (!firstValue || !secondValue) {
      return Number(!firstValue) - Number(!secondValue) || displayOrder;
    }

    const comparison = byAssignee
      ? assigneeCollator.compare(firstValue, secondValue)
      : Number(firstValue > secondValue) - Number(firstValue < secondValue);
    return (sort.endsWith("desc") ? -comparison : comparison) || displayOrder;
  };

  matching.sort(compare);

  if (acrossCategories) {
    return matching.length ? [{ category: null, videos: matching }] : [];
  }

  const byCategory = new Map<number, Video[]>();
  for (const video of matching) {
    const group = byCategory.get(video.category_id);
    if (group) group.push(video);
    else byCategory.set(video.category_id, [video]);
  }

  return categories.flatMap(category => {
    const group = byCategory.get(category.id);
    return group ? [{ category, videos: group }] : [];
  });
}

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

export function normalizeVideoTimestamp(timestamp: string): string {
  const hasTimezone = /(?:Z|[+-]\d{2}:\d{2})$/i.test(timestamp);
  return new Date(hasTimezone ? timestamp : `${timestamp}Z`).toISOString();
}

export function formatVideoUpdatedDate(timestamp: string): string {
  const date = new Date(normalizeVideoTimestamp(timestamp));

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
  if (seconds === null || !Number.isFinite(seconds) || seconds <= 0) return "未設定";

  return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, "0")}`;
}
