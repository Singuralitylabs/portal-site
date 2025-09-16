import { Database } from "./lib/database.types";

// Document関連
type DocumentsTable = Database["public"]["Tables"]["documents"];
export type DocumentWithCategoryType = DocumentsTable["Row"] & {
  category: { name: string } | null;
};
export type DocumentInsertFormType = Omit<
  DocumentsTable["Row"],
  "id" | "created_at" | "updated_at" | "updated_by" | "is_deleted"
>;
export type DocumentUpdateFormType = Omit<
  DocumentsTable["Row"],
  "created_at" | "updated_at" | "created_by" | "is_deleted"
>;

// Video関連
type VideosTable = Database["public"]["Tables"]["videos"];
export type VideoWithCategoryType = VideosTable["Row"] & {
  category: { name: string } | null;
};
export type VideoInsertFormType = Omit<
  VideosTable["Row"],
  "id" | "created_at" | "updated_at" | "updated_by" | "is_deleted"
>;
export type VideoUpdateFormType = Omit<
  VideosTable["Row"],
  "created_at" | "updated_at" | "created_by" | "is_deleted"
>;

// User関連
type UsersTable = Database["public"]["Tables"]["users"];
export type UserType = UsersTable["Row"];
export type InsertUserType = UsersTable["Insert"];
export type ProfileUserType = Pick<UserType, "id" | "display_name" | "role" | "created_at" | "bio">;

export type UserStatusType = "pending" | "active" | "rejected";
export type UserRoleType = "admin" | "maintainer" | "member";

export type MemberType = Pick<UserType, "id" | "display_name" | "bio" | "avatar_url">;
export type MemberAdminType = Pick<
  UserType,
  "id" | "display_name" | "bio" | "email" | "status" | "avatar_url" | "updated_at"
>;

type CategoriesTable = Database["public"]["Tables"]["categories"];
export type CategoryType = CategoriesTable["Row"];

// 共通定義
export type Action = "approve" | "reject" | "delete" | "update" | "default";
export const ActionLabelMap: Record<Action, string> = {
  approve: "承認",
  reject: "否認",
  delete: "削除",
  update: "更新",
  default: "実行",
};

export const statusColorMap: Record<string, string> = {
  pending: "yellow",
  active: "blue",
  default: "red",
};
