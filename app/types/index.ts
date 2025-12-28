import { Database } from "./lib/database.types";

// Documents types
type DocumentsTable = Database["public"]["Tables"]["documents"];
export type DocumentWithCategoryType = DocumentsTable["Row"] & {
  category: { name: string } | null;
};
export type DocumentInsertFormType = Omit<
  DocumentsTable["Row"],
  "id" | "created_at" | "updated_at" | "updated_by" | "is_deleted" | "display_order"
> & { position: PlacementPositionType };
export type DocumentUpdateFormType = Omit<
  DocumentsTable["Row"],
  "created_at" | "updated_at" | "created_by" | "is_deleted" | "display_order"
> & { position: PlacementPositionType };

// Videos types
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

// Applications types
type ApplicationsTable = Database["public"]["Tables"]["applications"];
export type ApplicationType = ApplicationsTable["Row"];

export type ApplicationWithCategoryAndDeveloperType = ApplicationType & {
  category: { name: string } | null;
  developer: { display_name: string } | null;
};

export type ApplicationInsertFormType = Omit<
  ApplicationType,
  "id" | "created_at" | "updated_at" | "updated_by" | "is_deleted"
>;

export type ApplicationUpdateFormType = Omit<
  ApplicationType,
  "created_at" | "updated_at" | "created_by" | "is_deleted"
>;

export type ContentType = "document" | "video" | "application";

// Display order placement position types
export type PlacementPositionType =
  | { type: "first" }
  | { type: "after"; afterId: number }
  | { type: "last" }
  | { type: "current" }; // For edits only

// Users types
type UsersTable = Database["public"]["Tables"]["users"];
export type UserType = UsersTable["Row"];
export type InsertUserType = UsersTable["Insert"];
export type ProfileUserType = Pick<UserType, "id" | "display_name" | "role" | "created_at" | "bio">;

export type UserStatusType = "pending" | "active" | "rejected";
export type UserActionType = "approve" | "reject" | "delete";
export type UserRoleType = "admin" | "maintainer" | "member";

export type MemberType = Pick<UserType, "id" | "display_name" | "bio" | "avatar_url"> & {
  position_tags: {
    positions: {
      id: number;
      name: string;
      is_deleted: boolean;
    };
  }[];
};
export type PendingUserType = Pick<UserType, "id" | "display_name" | "email">;
export type SelectDeveloperType = Pick<UserType, "id" | "display_name">;

// Categories types
type CategoriesTable = Database["public"]["Tables"]["categories"];
export type CategoryType = CategoriesTable["Row"];
export type SelectCategoryType = Pick<CategoryType, "id" | "name">;

// Positions types
type PositionsTable = Database["public"]["Tables"]["positions"];
export type PositionType = PositionsTable["Row"];

// Positions tag types
type PositionTagsTable = Database["public"]["Tables"]["position_tags"];
export type PositionTagType = PositionTagsTable["Row"];
