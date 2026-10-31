"use client";

import Image from "next/image";
import { Table, Text } from "@mantine/core";
import type { SelectCategoryType, VideoWithCategoryType } from "@/app/types";
import ContentMgrMenu from "@/app/(authenticated)/components/ContentMgrMenu";
import { CONTENT_TYPE } from "@/app/constants/content";
import { getVideoThumbnailUrl } from "../utils";
import { VideoDuration, VideoUpdatedDate } from "./VideoMetadata";

interface VideoListItemProps {
  video: VideoWithCategoryType;
  categories: SelectCategoryType[];
  isContentMgr: boolean;
  userId: number;
}

export function VideoListItem({ video, categories, isContentMgr, userId }: VideoListItemProps) {
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
      <Table.Td>
        <VideoUpdatedDate timestamp={video.updated_at} />
      </Table.Td>
      <Table.Td>
        <VideoDuration seconds={video.length} />
      </Table.Td>
      {isContentMgr && (
        <Table.Td>
          <ContentMgrMenu<VideoWithCategoryType>
            type={CONTENT_TYPE.VIDEO}
            content={video}
            categories={categories}
            userId={userId}
          />
        </Table.Td>
      )}
    </Table.Tr>
  );
}
