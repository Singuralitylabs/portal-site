import type { CategoryItemType, VideoInsertFormType, VideoUpdateFormType } from "@/app/types";
import { getItemsByCategory } from "./utils/display-order";
import { mutateMasterRecordAction } from "./master-actions";

export async function getVideosByCategory(
  categoryId: number,
  excludeId?: number
): Promise<CategoryItemType[]> {
  return getItemsByCategory("videos", categoryId, excludeId);
}

export async function deleteVideo(id: number, _userId: number) {
  return mutateMasterRecordAction({ table: "videos", operation: "delete", id });
}

function fields(data: VideoInsertFormType | VideoUpdateFormType) {
  return {
    name: data.name,
    description: data.description ?? null,
    url: data.url,
    category_id: data.category_id,
    assignee_id: data.assignee_id ?? null,
    thumbnail_path: data.thumbnail_path ?? null,
    thumbnail_time: data.thumbnail_time ?? null,
    length: data.length ?? null,
  };
}

export async function registerVideo(data: VideoInsertFormType) {
  return mutateMasterRecordAction({
    table: "videos",
    operation: "create",
    fields: fields(data),
    position: data.position,
  });
}

export async function updateVideo(data: VideoUpdateFormType) {
  return mutateMasterRecordAction({
    table: "videos",
    operation: "update",
    id: data.id,
    fields: fields(data),
    position: data.position,
  });
}
