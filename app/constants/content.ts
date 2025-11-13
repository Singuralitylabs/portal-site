import { ContentType } from "../types";

export const CONTENT_TYPE: Record<string, ContentType> = {
  DOCUMENT: "document",
  VIDEO: "video",
  APPLICATION: "application",
} as const;
