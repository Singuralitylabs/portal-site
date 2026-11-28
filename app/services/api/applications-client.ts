import type {
  ApplicationInsertFormType,
  ApplicationUpdateFormType,
  CategoryItemType,
} from "@/app/types";
import { getItemsByCategory } from "./utils/display-order";
import { mutateMasterRecordAction } from "./master-actions";

export async function getApplicationsByCategory(
  categoryId: number,
  excludeId?: number
): Promise<CategoryItemType[]> {
  return getItemsByCategory("applications", categoryId, excludeId);
}

export async function deleteApplication(id: number, _userId: number) {
  return mutateMasterRecordAction({ table: "applications", operation: "delete", id });
}

function fields(data: ApplicationInsertFormType | ApplicationUpdateFormType) {
  return {
    name: data.name,
    description: data.description ?? null,
    url: data.url,
    category_id: data.category_id,
    developer_id: data.developer_id ?? null,
    thumbnail_path: data.thumbnail_path ?? null,
  };
}

export async function registerApplication(data: ApplicationInsertFormType) {
  return mutateMasterRecordAction({
    table: "applications",
    operation: "create",
    fields: fields(data),
    position: data.position,
  });
}

export async function updateApplication(data: ApplicationUpdateFormType) {
  return mutateMasterRecordAction({
    table: "applications",
    operation: "update",
    id: data.id,
    fields: fields(data),
    position: data.position,
  });
}
