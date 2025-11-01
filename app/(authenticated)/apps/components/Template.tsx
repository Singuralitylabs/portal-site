"use client";

import { useState } from "react";
import { AppCard } from "./AppCard";
import { AppDetailModal } from "./AppDetailModal";
import { PageTitle } from "@/app/components/PageTitle";
import { AppWithCategoryAndDeveloperType, SelectCategoryType } from "@/app/types";
import CategoryLink from "@/app/(authenticated)/components/CategoryLink";

interface AppsPageTemplateProps {
  apps: AppWithCategoryAndDeveloperType[];
  categories: SelectCategoryType[];
}

export function AppsPageTemplate({ apps, categories }: AppsPageTemplateProps) {
  const [selectedApp, setSelectedApp] = useState<AppWithCategoryAndDeveloperType | null>(null);
  const [modalOpened, setModalOpened] = useState(false);

  const appCategoryNames = new Set(apps.map((app) => app.category?.name));
  const existingCategories = categories.filter((category) => appCategoryNames.has(category.name));

  const handleDetailClick = (app: AppWithCategoryAndDeveloperType) => {
    setSelectedApp(app);
    setModalOpened(true);
  };

  const handleModalClose = () => {
    setModalOpened(false);
    setSelectedApp(null);
  };

  return (
    <>
      <div className="sticky top-0 z-10 bg-white">
        <PageTitle>アプリ紹介</PageTitle>

        <div className="mb-4 py-4 flex flex-wrap items-center">
          <CategoryLink
            categories={existingCategories.map((category) => ({
              id: category.id,
              name: category.name,
            }))}
          />
        </div>
      </div>

      <div>
        {existingCategories.map((category) => (
          <div key={category.id} className="mb-12">
            <h2 id={`category-${category.id}`} className="scroll-mt-40">
              {category.name}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 lg:gap-8 mb-8">
              {apps
                .filter((app) => app.category?.name === category.name)
                .map((app) => (
                  <div key={app.id} className="w-full">
                    <AppCard app={app} onDetailClick={handleDetailClick} />
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

      <AppDetailModal app={selectedApp} opened={modalOpened} onClose={handleModalClose} />
    </>
  );
}
