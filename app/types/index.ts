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

type UsersTable = Database["public"]["Tables"]["users"];
export type UserType = UsersTable["Row"];
export type InsertUserType = UsersTable["Insert"];

export type UserStatusType = "pending" | "active" | "rejected";
export type UserRoleType = "admin" | "maintainer" | "member";

export type MemberType = Pick<UserType, "id" | "display_name" | "bio">;

type CategoriesTable = Database["public"]["Tables"]["categories"];
export type CategoryType = CategoriesTable["Row"];
