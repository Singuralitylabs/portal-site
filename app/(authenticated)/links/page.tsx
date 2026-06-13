import { QUICK_LINK_CATEGORIES } from "@/app/constants/links";
import { LinksPageTemplate } from "./components/Template";

export default function LinksPage() {
  // リンク情報は定数管理のためデータ取得は不要
  return <LinksPageTemplate categories={QUICK_LINK_CATEGORIES} />;
}
