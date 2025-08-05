import { Database } from "./lib/database.types";

type DocumentsTable = Database["public"]["Tables"]["documents"];
export type DocumentWithCategoryType = DocumentsTable["Row"] & {
  category: { name: string } | null;
};
export type DocumentFormType = Pick<
  DocumentsTable["Row"],
  "name" | "description" | "url" | "assignee"
> & { categoryId: number };
export type DocumentInsertFormType = DocumentFormType & { userId: number };

type VideosTable = Database["public"]["Tables"]["videos"];
export type VideoWithCategoryType = VideosTable["Row"] & {
  category: { name: string } | null;
};

type UsersTable = Database["public"]["Tables"]["users"];
export type UserType = UsersTable["Row"];
export type InsertUserType = UsersTable["Insert"];

export type UserStatusType = "pending" | "active" | "rejected";

type CategoriesTable = Database["public"]["Tables"]["categories"];
export type CategoryType = CategoriesTable["Row"];
