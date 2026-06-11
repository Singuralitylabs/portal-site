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
  // selectedLink が null = モーダルを閉じた状態として扱う
  const [selectedLink, setSelectedLink] = useState<QuickLinkType | null>(null);

  const handleDetailClick = (link: QuickLinkType) => {
    setSelectedLink(link);
  };

  const handleModalClose = () => {
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
            <h2 className="text-xl font-semibold mb-4">{category.name}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 auto-rows-fr gap-6 mb-8 px-4">
              {category.links.map(link => (
                <div key={link.url} className="w-full">
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

      <LinkDetailModal link={selectedLink} opened={selectedLink !== null} onClose={handleModalClose} />
    </>
  );
}
