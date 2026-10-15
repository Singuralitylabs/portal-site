"use client";

import Image from "next/image";
import { Flex, Text } from "@mantine/core";
import type { SelectCategoryType, VideoWithCategoryType } from "@/app/types";
import ContentMgrMenu from "@/app/(authenticated)/components/ContentMgrMenu";
import { CONTENT_TYPE } from "@/app/constants/content";
import { getVideoThumbnailUrl } from "../utils";

interface VideoListItemProps {
  video: VideoWithCategoryType;
  categories: SelectCategoryType[];
  isContentMgr: boolean;
  userId: number;
}

export function VideoListItem({ video, categories, isContentMgr, userId }: VideoListItemProps) {
  const updatedDate = new Date(video.updated_at).toLocaleDateString("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const duration = video.length
    ? `${Math.floor(video.length / 60)}:${(video.length % 60).toString().padStart(2, "0")}`
    : "未設定";

  return (
    <Flex component="li" align="flex-start" className="border-b border-gray-200 py-4" gap="xs">
      <a
        href={`/videos/${video.id}`}
        className="flex min-w-0 flex-1 items-start gap-3 rounded hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 sm:gap-4"
      >
        <div className="relative aspect-video w-20 flex-none overflow-hidden rounded sm:w-36">
          <Image
            src={getVideoThumbnailUrl(video)}
            alt=""
            fill
            sizes="(max-width: 639px) 80px, 144px"
            className="object-cover"
          />
        </div>
        <div className="min-w-0 flex-1 break-words">
          <Text fw={700} lineClamp={2} className="[overflow-wrap:anywhere]">
            {video.name}
          </Text>
          <Text size="sm" c="dimmed" lineClamp={2} mt={4} className="[overflow-wrap:anywhere]">
            {video.description}
          </Text>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
            <span>{video.category?.name}</span>
            <span>
              更新日: <time dateTime={video.updated_at}>{updatedDate}</time>
            </span>
            <span>再生時間: {duration}</span>
          </div>
        </div>
      </a>
      {isContentMgr && (
        <div className="flex-none" role="group" aria-label={`${video.name}の管理メニュー`}>
          <ContentMgrMenu<VideoWithCategoryType>
            type={CONTENT_TYPE.VIDEO}
            content={video}
            categories={categories}
            userId={userId}
          />
        </div>
      )}
    </Flex>
  );
}
