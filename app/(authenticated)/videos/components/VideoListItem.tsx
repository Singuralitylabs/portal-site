"use client";

import Image from "next/image";
import { Table, Text } from "@mantine/core";
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
    <Table.Tr>
      <Table.Td>
        <Image
          src={getVideoThumbnailUrl(video)}
          alt=""
          width={30}
          height={17}
          sizes="30px"
          className="h-[17px] w-[30px] max-w-[30px] object-cover"
        />
      </Table.Td>
      <Table.Td>
        <a
          href={`/videos/${video.id}`}
          className="text-blue-600 [overflow-wrap:anywhere] focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
        >
          {video.name}
        </a>
      </Table.Td>
      <Table.Td>
        <Text size="sm" c="dimmed" lineClamp={2} className="[overflow-wrap:anywhere]">
          {video.description}
        </Text>
      </Table.Td>
      <Table.Td className="[overflow-wrap:anywhere]">{video.category?.name}</Table.Td>
      <Table.Td>
        <time dateTime={video.updated_at}>{updatedDate}</time>
      </Table.Td>
      <Table.Td>{duration}</Table.Td>
      {isContentMgr && (
        <Table.Td>
          <div role="group" aria-label={`${video.name}の管理メニュー`}>
            <ContentMgrMenu<VideoWithCategoryType>
              type={CONTENT_TYPE.VIDEO}
              content={video}
              categories={categories}
              userId={userId}
            />
          </div>
        </Table.Td>
      )}
    </Table.Tr>
  );
}
