import type { MasterTableName } from "@/app/constants/master";
import type { PlacementPositionType } from "@/app/types";

export type MasterOperation = "create" | "update" | "delete" | "restore";

export interface MasterMutationInput {
  table: MasterTableName;
  operation: MasterOperation;
  id?: number;
  fields?: Record<string, string | number | boolean | null>;
  position?: PlacementPositionType;
  confirmationToken?: string;
}

export interface CategoryImpact {
  token: string;
  contents: {
    table: "documents" | "videos" | "applications";
    id: number;
    name: string;
    is_deleted: boolean;
    updated_at: string;
  }[];
}

export interface MasterMutationResult {
  success: boolean;
  error: { message: string } | null;
  id?: number;
  confirmation?: CategoryImpact;
}

export function validateMasterMutation(input: MasterMutationInput): string | null {
  if (
    !input ||
    !["documents", "videos", "applications", "categories", "positions"].includes(input.table) ||
    !["create", "update", "delete", "restore"].includes(input.operation)
  ) {
    return "対象または操作が不正です。";
  }
  if (input.operation !== "create" && (!Number.isSafeInteger(input.id) || input.id! <= 0)) {
    return "レコード ID が不正です。";
  }
  if (input.operation === "restore" && input.table === "positions") {
    return "役職は復元できません。";
  }
  if (input.operation === "delete" || input.operation === "restore") return null;
  const fields = input.fields;
  if (!fields || typeof fields !== "object" || Array.isArray(fields)) return "入力が不正です。";
  const allowed = ["name", "description"];
  if (input.table === "categories") allowed.push("category_type");
  else if (input.table === "positions") allowed.push("is_leadership");
  else {
    allowed.push("category_id", "url");
    if (input.table === "applications") allowed.push("developer_id", "thumbnail_path");
    else allowed.push("assignee_id");
    if (input.table === "videos") allowed.push("thumbnail_path", "thumbnail_time", "length");
  }
  for (const [key, value] of Object.entries(fields)) {
    if (!allowed.includes(key)) return `編集できない項目です: ${key}`;
    if (key === "name") {
      const max = input.table === "positions" ? 50 : input.table === "categories" ? 100 : 255;
      if (typeof value !== "string" || !value.trim() || Array.from(value).length > max) {
        return `名称は 1〜${max} 文字で入力してください。`;
      }
    } else if (key.endsWith("_id")) {
      if (value === null && key !== "category_id") continue;
      if (typeof value !== "number" || !Number.isSafeInteger(value) || value <= 0) {
        return "参照先 ID が不正です。";
      }
    } else if (key === "is_leadership") {
      if (typeof value !== "boolean") return "幹部フラグが不正です。";
    } else if (key === "category_type") {
      if (typeof value !== "string" || !["documents", "videos", "applications"].includes(value)) {
        return "カテゴリー種別が不正です。";
      }
    } else if (key === "thumbnail_time" || key === "length") {
      if (
        value !== null &&
        (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0)
      ) {
        return "時間は 0 以上の整数で入力してください。";
      }
    } else if (key === "url") {
      try {
        if (typeof value !== "string" || new URL(value).protocol !== "https:") {
          return "URL は https で指定してください。";
        }
      } catch {
        return "有効な URL を入力してください。";
      }
    } else if (value !== null && typeof value !== "string") return "文字列の入力が不正です。";
  }
  if (input.operation === "create") {
    const required = ["name"];
    if (input.table === "categories") required.push("category_type");
    else if (input.table !== "positions") required.push("category_id", "url");
    if (required.some(key => fields[key] === undefined || fields[key] === null)) {
      return "必須項目を入力してください。";
    }
  }
  const position = input.position ?? { type: "last" };
  if (
    !position ||
    !["first", "last", "current", "after"].includes(position.type) ||
    (position.type === "current" && input.operation === "create") ||
    (position.type === "after" &&
      (!Number.isSafeInteger(position.afterId) ||
        position.afterId <= 0 ||
        position.afterId === input.id))
  ) {
    return "配置位置が不正です。";
  }
  return null;
}
