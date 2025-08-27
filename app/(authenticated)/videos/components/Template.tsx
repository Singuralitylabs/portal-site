"use client";

import { useState } from "react";
import { VideoCard } from "./VideoCard";
import { Grid, Paper, Button, Group } from "@mantine/core";
import { PageTitle } from "@/app/components/PageTitle";
import { VideoFormModal } from "./VideoFormModal";
import { VideoWithCategoryType, CategoryType, VideoUpdateFormType } from "@/app/types";
import { VideoDeleteModal } from "./VideoDeleteModal";

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
    <Paper m="0 2rem">
      <Group justify="space-between" align="center" mb="md">
        <PageTitle>動画一覧</PageTitle>
        {isContentMgr && (
          <Button onClick={() => setFormModalOpened(true)} color="blue">
            新規登録
          </Button>
        )}
      </Group>

      <Paper mb="md" p="md">
        <div className="flex flex-wrap items-center">
          {existingCategories.map(category => (
            <div key={category.id}>
              <a href={`#category-${category.id}`} className="text-blue-600 mr-4">
                {category.name}
              </a>
            </div>
          ))}
        </div>
      </Paper>

      <Paper>
        {existingCategories.map(category => (
          <div key={category.id}>
            <h2 id={`category-${category.id}`}>{category.name}</h2>
            <Grid>
              {videos
                .filter(video => video.category?.name === category.name)
                .map(video => (
                  <Grid.Col span={{ base: 12, md: 6, lg: 4 }} key={video.id + "_grid"}>
                    <VideoCard
                      video={video}
                      isContentMgr={isContentMgr}
                      onEdit={handleEditDocument}
                      onDelete={handleDeleteDocument}
                    />
                  </Grid.Col>
                ))}
            </Grid>
          </div>
        ))}
      </Paper>

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
    </Paper>
  );
}
