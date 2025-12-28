import { useState, useEffect, useMemo, useCallback } from "react";
import type { CategoryItemType, ContentTableType, PlacementPositionType } from "@/app/types";
import { getItemsByCategory } from "@/app/services/api/utils/display-order";

/**
 * 表示順操作フォームのカスタムフック
 * @param contentType コンテンツタイプ（documents, videos, applications）
 * @param categoryId カテゴリーID
 * @param itemId アイテムID（編集時のみ）
 * @param isEdit 編集モードかどうか
 * @returns 表示順操作に必要な状態と関数
 */
export function useDisplayOrderForm(
  contentType: ContentTableType,
  categoryId: number,
  itemId?: number,
  isEdit?: boolean
) {
  const [items, setItems] = useState<CategoryItemType[]>([]);
  const [position, setPosition] = useState<string>(isEdit ? "current" : "last");

  // カテゴリーIDが変更されたときにアイテム一覧を取得
  useEffect(() => {
    if (categoryId > 0) {
      getItemsByCategory(contentType, categoryId, itemId).then(setItems);
    } else {
      setItems([]);
    }
  }, [contentType, categoryId, itemId]);

  // カテゴリー変更ハンドラー
  const handleCategoryChange = useCallback(
    async (newCategoryId: number) => {
      if (newCategoryId > 0) {
        const fetchedItems = await getItemsByCategory(contentType, newCategoryId, itemId);
        setItems(fetchedItems);
      } else {
        setItems([]);
      }
    },
    [contentType, itemId]
  );

  // 位置選択肢を構築（メモ化して不要な再計算を防ぐ）
  const positionOptions = useMemo(() => {
    const options: { value: string; label: string }[] = [];

    // 編集時のみ「現在の位置を維持」を追加
    if (isEdit) {
      options.push({ value: "current", label: "現在の位置を維持" });
    }

    // 「最初に配置」
    options.push({ value: "first", label: "最初に配置" });

    // 既存アイテムの後に配置
    items.forEach(item => {
      options.push({
        value: `after:${item.id}`,
        label: `「${item.name}」の後に配置`,
      });
    });

    // 「最後に配置」
    options.push({ value: "last", label: "最後に配置" });

    return options;
  }, [items, isEdit]);

  // 選択値をPlacementPositionTypeに変換
  const parsePosition = useCallback((value: string): PlacementPositionType => {
    if (value === "current") return { type: "current" };
    if (value === "first") return { type: "first" };
    if (value === "last") return { type: "last" };
    if (value.startsWith("after:")) {
      const afterId = Number(value.split(":")[1]);
      return { type: "after", afterId };
    }
    return { type: "last" }; // フォールバック
  }, []);

  return {
    items,
    position,
    setPosition,
    positionOptions,
    parsePosition,
    handleCategoryChange,
  };
}
