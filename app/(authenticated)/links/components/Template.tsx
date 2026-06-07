"use client";

import { useState } from "react";
import { LinkCard } from "./LinkCard";
import { LinkDetailModal } from "./LinkDetailModal";
import { PageTitle } from "@/app/components/PageTitle";
import { QuickLinkCategoryType, QuickLinkType } from "@/app/types";

interface LinksPageTemplateProps {
  categories: QuickLinkCategoryType[];
}

export function LinksPageTemplate({ categories }: LinksPageTemplateProps) {
  const [selectedLink, setSelectedLink] = useState<QuickLinkType | null>(null);
  const [modalOpened, setModalOpened] = useState(false);

  const handleDetailClick = (link: QuickLinkType) => {
    setSelectedLink(link);
    setModalOpened(true);
  };

  const handleModalClose = () => {
    setModalOpened(false);
    setSelectedLink(null);
  };

  return (
    <>
      <div className="sticky top-0 z-10 bg-white">
        <PageTitle>クイックリンク</PageTitle>
      </div>

      <div className="mt-8">
        {categories.map(category => (
          <div key={category.id} className="mb-12">
            <h2>{category.name}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 auto-rows-fr gap-6 mb-8 px-4">
              {category.links.map(link => (
                <div key={link.name} className="w-full">
                  <LinkCard
                    link={link}
                    displayMode={category.displayMode}
                    onDetailClick={handleDetailClick}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <LinkDetailModal link={selectedLink} opened={modalOpened} onClose={handleModalClose} />
    </>
  );
}
