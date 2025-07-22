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

type CategoriesTable = Database["public"]["Tables"]["categories"];
export type CategoryType = CategoriesTable["Row"];

export interface DocumentFormat {
  // TODO:  DocumentのフォーマットをDocumentWithCategoryTypeに統合して不要
  id: string;
  name: string;
  category: string;
  description: string;
  url: string;
  asignee: string;
  createdAt: string;
  updatedAt: string;
}

export interface VideoFormat {
  // TODO:  DocumentのフォーマットをVideoWithCategoryTypeに統合して不要
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnail: string;
  createdAt: string;
  updatedAt: string;
}

export type ContentType = "document" | "video";

export interface ModalState {
  isOpen: boolean;
  type: "create" | "edit" | "delete" | "success";
  contentType: ContentType;
  item?: DocumentWithCategoryType | VideoFormat;
}
