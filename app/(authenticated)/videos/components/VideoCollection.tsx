"use client";

import { useState, type ReactNode } from "react";
import { Group, SegmentedControl, Table } from "@mantine/core";
import { useResizeObserver } from "@mantine/hooks";
import { LayoutGrid, List } from "lucide-react";
import { VideoListItem } from "./VideoListItem";
import { SelectCategoryType, VideoWithCategoryType } from "@/app/types";
import CategoryLink from "@/app/(authenticated)/components/CategoryLink";
import ContentMgrNewButton from "@/app/(authenticated)/components/ContentMgrNewButton";
import { CONTENT_TYPE } from "@/app/constants/content";

interface VideoCollectionProps {
  sections: {
    category: SelectCategoryType;
    videos: VideoWithCategoryType[];
    cards: ReactNode;
  }[];
  categories: SelectCategoryType[];
  isContentMgr: boolean;
  userId: number;
  children: ReactNode;
}

export function VideoCollection({
  sections,
  categories,
  isContentMgr,
  userId,
  children,
}: VideoCollectionProps) {
  const [viewMode, setViewMode] = useState<"card" | "list">("card");
  const [stickyHeaderRef, { height }] = useResizeObserver();

  return (
    <>
      <div ref={stickyHeaderRef} className="sticky top-0 z-10 bg-white">
        {children}
        <Group justify="flex-end" gap="sm" mt="md" wrap="wrap">
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
        <div className="mb-4 py-4 flex flex-wrap items-center">
          <CategoryLink categories={sections.map(({ category }) => category)} />
        </div>
      </div>

      <div>
        {sections.map(({ category, videos, cards }) => (
          <div key={category.id} className="mb-12">
            <h2
              id={`category-${category.id}`}
              className="scroll-mt-40"
              style={{
                scrollMarginTop: `calc(${Math.ceil(height)}px + var(--mantine-spacing-xs))`,
              }}
            >
              {category.name}
            </h2>
            {viewMode === "card" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 mb-8 px-4">
                {cards}
              </div>
            ) : (
              <div className="mb-8 px-4 [contain:inline-size]">
                <Table.ScrollContainer minWidth={900} type="native">
                  <Table
                    aria-label={`${category.name}の動画`}
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
                        <Table.Th w={108}>更新日</Table.Th>
                        <Table.Th w={86}>再生時間</Table.Th>
                        {isContentMgr && <Table.Th w={56}>操作</Table.Th>}
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {videos.map(video => (
                        <VideoListItem
                          key={video.id}
                          video={video}
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
