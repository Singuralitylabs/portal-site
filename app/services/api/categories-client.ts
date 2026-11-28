import { createClientSupabaseClient } from "./supabase-client";
import { mutateMasterRecordAction } from "./master-actions";
import type {
  CategoryInsertFormType,
  CategoryItemType,
  CategoryTypeValue,
  CategoryUpdateFormType,
} from "@/app/types";

export async function getCategoriesForPosition(
  categoryType: CategoryTypeValue,
  excludeId?: number
): Promise<CategoryItemType[]> {
  const supabase = createClientSupabaseClient();
  let query = supabase
    .from("categories")
    .select("id,name,display_order")
    .eq("category_type", categoryType)
    .eq("is_deleted", false)
    .order("display_order");
  if (excludeId !== undefined) query = query.neq("id", excludeId);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function registerCategory(data: CategoryInsertFormType) {
  return mutateMasterRecordAction({
    table: "categories",
    operation: "create",
    fields: {
      name: data.name,
      description: data.description ?? null,
      category_type: data.category_type,
    },
    position: data.position,
  });
}

export async function updateCategory(data: CategoryUpdateFormType, confirmationToken?: string) {
  return mutateMasterRecordAction({
    table: "categories",
    operation: "update",
    id: data.id,
    fields: {
      name: data.name,
      description: data.description ?? null,
      category_type: data.category_type,
    },
    position: data.position,
    confirmationToken,
  });
}

export async function deleteCategory(
  id: number,
  _categoryType: CategoryTypeValue,
  confirmationToken?: string
) {
  return mutateMasterRecordAction({
    table: "categories",
    operation: "delete",
    id,
    confirmationToken,
  });
}
