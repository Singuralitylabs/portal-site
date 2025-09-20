"use client";

import { useState } from "react";
import { Button, Menu } from "@mantine/core";
import { EllipsisVertical } from "lucide-react";
import {
  ContentType,
  DocumentWithCategoryType,
  SelectCategoryType,
  VideoWithCategoryType,
} from "@/app/types";
import { DocumentDeleteModal } from "../documents/components/DocumentDeleteModal";
import { VideoDeleteModal } from "../videos/components/VideoDeleteModal";
import { DocumentFormModal } from "../documents/components/DocumentFormModal";
import { VideoFormModal } from "../videos/components/VideoFormModal";
import { CONTENT_TYPE } from "@/app/constants/content";

interface ContentMgrMenuProps<T extends DocumentWithCategoryType | VideoWithCategoryType> {
  type: ContentType;
  content: T;
  categories: SelectCategoryType[];
  userId: number;
}

export default function ContentMgrMenu<T extends DocumentWithCategoryType | VideoWithCategoryType>({
  type,
  content,
  categories,
  userId,
}: ContentMgrMenuProps<T>) {
  const [editDocumentModalOpened, setEditDocumentModalOpened] = useState(false);
  const [deleteDocumentModalOpened, setDeleteDocumentModalOpened] = useState(false);
  const [editVideoModalOpened, setEditVideoModalOpened] = useState(false);
  const [deleteVideoModalOpened, setDeleteVideoModalOpened] = useState(false);

  const handleEdit = (e: React.MouseEvent) => {
    switch (type) {
      case CONTENT_TYPE.DOCUMENT:
        setEditDocumentModalOpened(true);
        break;
      case CONTENT_TYPE.VIDEO:
        e.preventDefault();
        e.stopPropagation();
        setEditVideoModalOpened(true);
        break;
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    switch (type) {
      case CONTENT_TYPE.DOCUMENT:
        setDeleteDocumentModalOpened(true);
        break;
      case CONTENT_TYPE.VIDEO:
        e.preventDefault();
        e.stopPropagation();
        setDeleteVideoModalOpened(true);
        break;
    }
  };

  return (
    <>
      <Menu>
        <Menu.Target>
          <Button
            variant="subtle"
            size="compact-xs"
            p="4px"
            onClick={e => {
              e.preventDefault();
              e.stopPropagation(); // これで動画詳細ページ遷移のクリックイベントを防止
            }}
            style={{
              backgroundColor: "white",
              color: "black",
              borderRadius: "4px",
            }}
          >
            <EllipsisVertical size={16} />
          </Button>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item onClick={handleEdit}>編集</Menu.Item>
          <Menu.Item onClick={handleDelete}>削除</Menu.Item>
        </Menu.Dropdown>
      </Menu>

      <DocumentFormModal
        opened={editDocumentModalOpened}
        onClose={() => setEditDocumentModalOpened(false)}
        categories={categories}
        userId={userId}
        initialData={content as DocumentWithCategoryType}
      />

      <DocumentDeleteModal
        opened={deleteDocumentModalOpened}
        onClose={() => setDeleteDocumentModalOpened(false)}
        userId={userId}
        documentId={content.id}
      />

      <VideoFormModal
        opened={editVideoModalOpened}
        onClose={() => setEditVideoModalOpened(false)}
        categories={categories}
        userId={userId}
        initialData={content as VideoWithCategoryType}
      />

      <VideoDeleteModal
        opened={deleteVideoModalOpened}
        onClose={() => setDeleteVideoModalOpened(false)}
        userId={userId}
        videoId={content.id}
      />
    </>
  );
}
