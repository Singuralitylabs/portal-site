import { Database } from "./lib/database.types";

type DocumentsTable = Database["public"]["Tables"]["documents"];
export type DocumentType = DocumentsTable["Row"];

type UsersTable = Database["public"]["Tables"]["users"];
export type UserType = UsersTable["Row"];
export type InsertUserType = UsersTable["Insert"];
