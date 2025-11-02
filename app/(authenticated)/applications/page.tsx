import { fetchApplications } from "@/app/services/api/applications-server";
import { fetchCategoriesByType } from "@/app/services/api/categories-server";
import { ApplicationsPageTemplate } from "./components/Template";

export default async function ApplicationsPage() {
  // アプリデータ・カテゴリーデータを並列取得
  const [applicationsResult, categoriesResult] = await Promise.all([
    fetchApplications(),
    fetchCategoriesByType("applications"),
  ]);

  const { data: applications, error: applicationError } = applicationsResult;
  if (applicationError || !applications) {
    console.error("アプリデータの取得に失敗:", applicationError);
    return (
      <div className="text-center py-8">
        <p className="text-red-600 text-xl">アプリデータを取得できませんでした。</p>
      </div>
    );
  }

  const { data: categories, error: categoryError } = categoriesResult;
  if (categoryError || !categories) {
    console.error("カテゴリーデータの取得に失敗:", categoryError);
    return (
      <div className="text-center py-8">
        <p className="text-red-600 text-xl">カテゴリーデータを取得できませんでした。</p>
      </div>
    );
  }

  return <ApplicationsPageTemplate applications={applications} categories={categories} />;
}
