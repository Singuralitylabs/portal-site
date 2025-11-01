import { fetchApps } from "@/app/services/api/apps-server";
import { fetchCategoriesByType } from "@/app/services/api/categories-server";
import { AppsPageTemplate } from "./components/Template";

export default async function AppsPage() {
  // アプリデータ・カテゴリーデータを並列取得
  const [appsResult, categoriesResult] = await Promise.all([
    fetchApps(),
    fetchCategoriesByType("apps"),
  ]);

  const { data: apps, error: appError } = appsResult;
  if (appError || !apps) {
    console.error("アプリデータの取得に失敗:", appError);
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

  return <AppsPageTemplate apps={apps} categories={categories} />;
}
