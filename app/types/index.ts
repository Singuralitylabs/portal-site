import { Database } from "./lib/database.types";

type DocumentsTable = Database["public"]["Tables"]["documents"];
export type DocumentWithCategoryType = DocumentsTable["Row"] & {
    category: { name: string } | null;
};
  
type VideosTable = Database["public"]["Tables"]["videos"];
export type VideoWithCategoryType = VideosTable["Row"] & {
    category: { name: string } | null;
};

type UsersTable = Database["public"]["Tables"]["users"];
export type UserType = UsersTable["Row"];
export type InsertUserType = UsersTable["Insert"];
