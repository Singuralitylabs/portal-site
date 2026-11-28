import type { CategoryItemType, DocumentInsertFormType, DocumentUpdateFormType } from "@/app/types";
import { getItemsByCategory } from "./utils/display-order";
import { mutateMasterRecordAction } from "./master-actions";

export async function getDocumentsByCategory(
  categoryId: number,
  excludeId?: number
): Promise<CategoryItemType[]> {
  return getItemsByCategory("documents", categoryId, excludeId);
}

export async function deleteDocument(id: number, _userId: number) {
  return mutateMasterRecordAction({ table: "documents", operation: "delete", id });
}

function fields(data: DocumentInsertFormType | DocumentUpdateFormType) {
  return {
    name: data.name,
    description: data.description ?? null,
    url: data.url,
    category_id: data.category_id,
    assignee_id: data.assignee_id ?? null,
  };
}

export async function registerDocument(data: DocumentInsertFormType) {
  return mutateMasterRecordAction({
    table: "documents",
    operation: "create",
    fields: fields(data),
    position: data.position,
  });
}

export async function updateDocument(data: DocumentUpdateFormType) {
  return mutateMasterRecordAction({
    table: "documents",
    operation: "update",
    id: data.id,
    fields: fields(data),
    position: data.position,
  });
}
