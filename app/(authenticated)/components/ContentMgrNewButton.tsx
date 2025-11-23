"use client";

import { useState } from "react";
import { DocumentFormModal } from "../documents/components/DocumentFormModal";
import { ContentType, SelectCategoryType, SelectDeveloperType } from "@/app/types";
import { Button } from "@mantine/core";
import { CONTENT_TYPE } from "@/app/constants/content";
import { VideoFormModal } from "../videos/components/VideoFormModal";
import { ApplicationFormModal } from "../applications/components/ApplicationFormModal";

interface ContentMgrNewButtonProps {
  children: React.ReactNode;
  categories: SelectCategoryType[];
  userId: number;
  developers?: SelectDeveloperType[];
  type: ContentType;
}

export default function ContentMgrNewButton({
  children,
  categories,
  userId,
  developers,
  type,
}: ContentMgrNewButtonProps) {
  const [documentFormModalOpened, setDocumentFormModalOpened] = useState(false);
  const [videoFormModalOpened, setVideoFormModalOpened] = useState(false);
  const [applicationFormModalOpened, setApplicationFormModalOpened] = useState(false);

  const handleOpenFormModal = () => {
    switch (type) {
      case CONTENT_TYPE.DOCUMENT:
        setDocumentFormModalOpened(true);
        break;
      case CONTENT_TYPE.VIDEO:
        setVideoFormModalOpened(true);
        break;
      case CONTENT_TYPE.APPLICATION:
        setApplicationFormModalOpened(true);
        break;
    }
  };
  return (
    <>
      <Button onClick={handleOpenFormModal} size="xs" variant="outline">
        {children}
      </Button>

      <DocumentFormModal
        opened={documentFormModalOpened}
        onClose={() => setDocumentFormModalOpened(false)}
        categories={categories}
        userId={userId}
      />

      <VideoFormModal
        opened={videoFormModalOpened}
        onClose={() => setVideoFormModalOpened(false)}
        categories={categories}
        userId={userId}
      />

      <ApplicationFormModal
        opened={applicationFormModalOpened}
        onClose={() => setApplicationFormModalOpened(false)}
        categories={categories}
        developers={developers || []}
        userId={userId}
      />
    </>
  );
}
