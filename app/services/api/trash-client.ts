import { mutateMasterRecordAction } from "./master-actions";

export async function restoreDocument(id: number, _userId: number) {
  return mutateMasterRecordAction({ table: "documents", operation: "restore", id });
}

export async function restoreVideo(id: number, _userId: number) {
  return mutateMasterRecordAction({ table: "videos", operation: "restore", id });
}

export async function restoreApplication(id: number, _userId: number) {
  return mutateMasterRecordAction({ table: "applications", operation: "restore", id });
}

export async function restoreCategory(id: number) {
  return mutateMasterRecordAction({ table: "categories", operation: "restore", id });
}
