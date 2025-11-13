"use client";

import { useState } from "react";
import { ApplicationCard } from "./ApplicationCard";
import { ApplicationDetailModal } from "./ApplicationDetailModal";
import { PageTitle } from "@/app/components/PageTitle";
import { ApplicationWithCategoryAndDeveloperType, SelectCategoryType } from "@/app/types";
import CategoryLink from "@/app/(authenticated)/components/CategoryLink";

interface ApplicationsPageTemplateProps {
  applications: ApplicationWithCategoryAndDeveloperType[];
  categories: SelectCategoryType[];
}

export function ApplicationsPageTemplate({
  applications,
  categories,
}: ApplicationsPageTemplateProps) {
  const [selectedApplication, setSelectedApplication] =
    useState<ApplicationWithCategoryAndDeveloperType | null>(null);
  const [modalOpened, setModalOpened] = useState(false);

  const applicationCategoryNames = new Set(
    applications.map(application => application.category?.name)
  );
  const existingCategories = categories.filter(category =>
    applicationCategoryNames.has(category.name)
  );

  const handleDetailClick = (application: ApplicationWithCategoryAndDeveloperType) => {
    setSelectedApplication(application);
    setModalOpened(true);
  };

  const handleModalClose = () => {
    setModalOpened(false);
    setSelectedApplication(null);
  };

  return (
    <>
      <div className="sticky top-0 z-10 bg-white">
        <PageTitle>アプリ紹介</PageTitle>

        <div className="mb-4 py-4 flex flex-wrap items-center">
          <CategoryLink
            categories={existingCategories.map(category => ({
              id: category.id,
              name: category.name,
            }))}
          />
        </div>
      </div>

      <div>
        {existingCategories.map(category => (
          <div key={category.id} className="mb-12">
            <h2 id={`category-${category.id}`} className="scroll-mt-40">
              {category.name}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 lg:gap-8 mb-8">
              {applications
                .filter(application => application.category?.name === category.name)
                .map(application => (
                  <div key={application.id} className="w-full">
                    <ApplicationCard application={application} onDetailClick={handleDetailClick} />
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

      <ApplicationDetailModal
        application={selectedApplication}
        opened={modalOpened}
        onClose={handleModalClose}
      />
    </>
  );
}
