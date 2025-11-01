import { Database } from "./lib/database.types";

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

// Apps types
export type AppType = {
  id: number;
  name: string;
  description: string;
  short_description: string | null;
  category_id: number;
  url: string;
  thumbnail_url: string | null;
  developer_id: number;
  display_order: number | null;
  created_by: number;
  updated_by: number;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
};

export type AppWithCategoryAndDeveloperType = AppType & {
  category: { name: string } | null;
  developer: { display_name: string } | null;
};

export type AppInsertFormType = Omit<
  AppType,
  "id" | "created_at" | "updated_at" | "updated_by" | "is_deleted"
>;

export type AppUpdateFormType = Omit<
  AppType,
  "created_at" | "updated_at" | "created_by" | "is_deleted"
>;

export type ContentType = "document" | "video" | "app";

type UsersTable = Database["public"]["Tables"]["users"];
export type UserType = UsersTable["Row"];
export type InsertUserType = UsersTable["Insert"];
export type ProfileUserType = Pick<UserType, "id" | "display_name" | "role" | "created_at" | "bio">;

export type UserStatusType = "pending" | "active" | "rejected";
export type UserRoleType = "admin" | "maintainer" | "member";

export type MemberType = Pick<UserType, "id" | "display_name" | "bio" | "avatar_url">;

type CategoriesTable = Database["public"]["Tables"]["categories"];
export type CategoryType = CategoriesTable["Row"];
export type SelectCategoryType = Pick<CategoryType, "id" | "name">;
