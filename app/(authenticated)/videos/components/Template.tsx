"use client";

import { useState } from "react";
import { VideoCard } from "./VideoCard";
import { Button } from "@mantine/core";
import { PageTitle } from "@/app/components/PageTitle";
import { VideoFormModal } from "./VideoFormModal";
import { VideoWithCategoryType, CategoryType, VideoUpdateFormType } from "@/app/types";
import { VideoDeleteModal } from "./VideoDeleteModal";
import CategoryLink from "@/app/(authenticated)/components/CategoryLink";

interface VideosPageTemplateProps {
  videos: VideoWithCategoryType[];
  categories: CategoryType[];
  isContentMgr: boolean;
  userId: number;
}

export function VideosPageTemplate({
  videos,
  categories,
  isContentMgr,
  userId,
}: VideosPageTemplateProps) {
  const videoCategoryNames = new Set(videos.map(video => video.category?.name));
  const existingCategories = categories.filter(category => videoCategoryNames.has(category.name));

  const [formModalOpened, setFormModalOpened] = useState(false);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [editingVideo, setEditingVideo] = useState<VideoUpdateFormType | null>(null);
  const [deletingVideoId, setDeletingVideoId] = useState<number>(0);

  const handleEditDocument = (video: VideoUpdateFormType) => {
    setEditingVideo(video);
    setFormModalOpened(true);
  };

  const handleCloseFormModal = () => {
    setFormModalOpened(false);
    setEditingVideo(null);
  };

  const handleDeleteDocument = (documentId: number) => {
    setDeletingVideoId(documentId);
    setDeleteModalOpened(true);
  };

  return (
    <div className="p-4 overflow-x-hidden">
      <PageTitle>動画一覧</PageTitle>
      {isContentMgr && (
        <div className="mt-4 flex justify-end">
          <Button onClick={() => setFormModalOpened(true)} size="xs" variant="outline">
            新規登録
          </Button>
        </div>
      )}

      <div className="mb-4 py-4 flex flex-wrap items-center">
        <CategoryLink
          categories={existingCategories.map(category => ({
            id: category.id,
            name: category.name,
          }))}
        />
      </div>

      <div>
        {existingCategories.map(category => (
          <div key={category.id} className="mb-12">
            <h2 id={`category-${category.id}`}>{category.name}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 lg:gap-8 mb-8">
              {videos
                .filter(video => video.category?.name === category.name)
                .map(video => (
                  <div key={video.id} className="w-full">
                    <VideoCard
                      video={video}
                      isContentMgr={isContentMgr}
                      onEdit={handleEditDocument}
                      onDelete={handleDeleteDocument}
                    />
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>

      <div className="text-left mt-8 mb-4">
        <a href="#" className="text-blue-600">
          TOPへ
        </a>
      </div>

      <VideoFormModal
        opened={formModalOpened}
        onClose={handleCloseFormModal}
        categories={categories}
        userId={userId}
        initialData={editingVideo || undefined}
      />

      <VideoDeleteModal
        opened={deleteModalOpened}
        onClose={() => setDeleteModalOpened(false)}
        userId={userId}
        videoId={deletingVideoId}
      />
    </div>
  );
}
