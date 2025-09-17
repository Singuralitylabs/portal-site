"use client";

import { Button, Select } from "@mantine/core";
import { useMemo, useState } from "react";

interface CategoryLinkProps {
  id: number;
  name: string;
}

export default function CategoryLink({ categories }: { categories: CategoryLinkProps[] }) {
  const [categoryId, setCategoryId] = useState<number>(0);

  const categoryNameToId = useMemo(() => {
    return categories.reduce(
      (map, category) => {
        map[category.name] = category.id;
        return map;
      },
      {} as Record<string, number>
    );
  }, [categories]);

  const handleSetCategoryId = (categoryName: string | null) => {
    if (!categoryName) {
      setCategoryId(0);
      return;
    }
    setCategoryId(categoryNameToId[categoryName]);
  };

  return (
    <>
      {/** デスクトップ表示 */}
      <div className="hidden sm:flex flex-wrap items-center">
        {categories.map(category => (
          <div key={category.id}>
            <a href={`#category-${category.id}`} className="text-blue-600 mr-4">
              {category.name}
            </a>
          </div>
        ))}
      </div>

      {/** モバイル表示 */}
      <div className="sm:hidden flex items-center gap-2">
        <Select
          placeholder="カテゴリーを選択"
          data={categories.map(category => category.name)}
          onChange={selectedName => handleSetCategoryId(selectedName)}
          className="flex-grow"
        />
        <Button
          component="a"
          href={categoryId === 0 ? undefined : `#category-${categoryId}`}
          disabled={categoryId === 0}
          color="indigo"
        >
          移動
        </Button>
      </div>
    </>
  );
}
