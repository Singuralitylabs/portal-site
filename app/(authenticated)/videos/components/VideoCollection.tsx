"use client";

import { useState, type ReactNode } from "react";
import { Group, SegmentedControl, Table, Text } from "@mantine/core";
import { useResizeObserver } from "@mantine/hooks";
import { LayoutGrid, List } from "lucide-react";
import { VideoListItem } from "./VideoListItem";
import { VideoCard } from "./VideoCard";
import { VideoFilterBar } from "./VideoFilterBar";
import { DEFAULT_VIDEO_FILTERS, getVideoSections } from "../utils";
import { SelectCategoryType, VideoWithCategoryType } from "@/app/types";
import CategoryLink from "@/app/(authenticated)/components/CategoryLink";
import ContentMgrNewButton from "@/app/(authenticated)/components/ContentMgrNewButton";
import { CONTENT_TYPE } from "@/app/constants/content";

interface VideoCollectionProps {
  videos: VideoWithCategoryType[];
  categories: SelectCategoryType[];
  isContentMgr: boolean;
  userId: number;
  children: ReactNode;
}

export function VideoCollection({
  videos,
  categories,
  isContentMgr,
  userId,
  children,
}: VideoCollectionProps) {
  const [viewMode, setViewMode] = useState<"card" | "list">("card");
  const [filters, setFilters] = useState(DEFAULT_VIDEO_FILTERS);
  const [stickyHeaderRef, { height }] = useResizeObserver();
  const sections = getVideoSections(videos, categories, filters);
  const count = sections.reduce((total, section) => total + section.videos.length, 0);
  const shownCategories = sections.flatMap(({ category }) => (category ? [category] : []));

  return (
    <>
      <div ref={stickyHeaderRef} className="sticky top-0 z-10 bg-white">
        {children}
        <Group justify="flex-end" gap="sm" my="sm" wrap="wrap">
          <SegmentedControl
            aria-label="動画の表示形式"
            value={viewMode}
            onChange={value => {
              if (value === "card" || value === "list") setViewMode(value);
            }}
            data={[
              {
                value: "card",
                label: (
                  <Group gap={6} wrap="nowrap">
                    <LayoutGrid size={16} aria-hidden="true" />
                    <span>カード</span>
                  </Group>
                ),
              },
              {
                value: "list",
                label: (
                  <Group gap={6} wrap="nowrap">
                    <List size={16} aria-hidden="true" />
                    <span>リスト</span>
                  </Group>
                ),
              },
            ]}
          />
          {isContentMgr && (
            <ContentMgrNewButton type={CONTENT_TYPE.VIDEO} categories={categories} userId={userId}>
              新規登録
            </ContentMgrNewButton>
          )}
        </Group>
        <VideoFilterBar
          filters={filters}
          onChange={changes => setFilters(current => ({ ...current, ...changes }))}
        />
        {shownCategories.length > 0 && (
          <div className="py-2 flex flex-wrap items-center">
            <CategoryLink categories={shownCategories} />
          </div>
        )}
      </div>

      <div className="mt-4">
        <Text size="sm" role="status" mb="sm">
          {count > 0 ? `${count}件` : "条件に一致する動画は0件です"}
        </Text>
        {sections.map(({ category, videos: sectionVideos }) => (
          <div key={category?.id ?? "all"} className="mb-12">
            {category && (
              <h2
                id={`category-${category.id}`}
                style={{
                  scrollMarginTop: `calc(${Math.ceil(height)}px + var(--mantine-spacing-xs))`,
                }}
              >
                {category.name}
              </h2>
            )}
            {viewMode === "card" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 mb-8 px-4">
                {sectionVideos.map(video => (
                  <div key={video.id} className="w-full">
                    <VideoCard
                      video={video}
                      isContentMgr={isContentMgr}
                      categories={categories}
                      userId={userId}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="mb-8 px-4 [contain:inline-size]">
                <Table.ScrollContainer minWidth={category ? 1100 : 1220} type="native">
                  <Table
                    aria-label={category ? `${category.name}の動画` : "すべての動画"}
                    verticalSpacing="sm"
                    horizontalSpacing="sm"
                    highlightOnHover
                    style={{ tableLayout: "fixed" }}
                  >
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th w={56}>画像</Table.Th>
                        <Table.Th w={180}>動画名</Table.Th>
                        <Table.Th>説明</Table.Th>
                        {!category && <Table.Th w={120}>カテゴリー</Table.Th>}
                        <Table.Th w={108}>収録日</Table.Th>
                        <Table.Th w={120}>責任者</Table.Th>
                        <Table.Th w={108}>更新日</Table.Th>
                        <Table.Th w={86}>再生時間</Table.Th>
                        {isContentMgr && <Table.Th w={56}>操作</Table.Th>}
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {sectionVideos.map(video => (
                        <VideoListItem
                          key={video.id}
                          video={video}
                          showCategory={!category}
                          isContentMgr={isContentMgr}
                          categories={categories}
                          userId={userId}
                        />
                      ))}
                    </Table.Tbody>
                  </Table>
                </Table.ScrollContainer>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="text-left mt-8 mb-4">
        <a href="#" className="text-blue-600">
          TOPへ
        </a>
      </div>
    </>
  );
}
