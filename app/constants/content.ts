import { ContentType } from "../types";

export const CONTENT_TYPE: Record<string, ContentType> = {
  DOCUMENT: "document",
  VIDEO: "video",
  APP: "app",
} as const;
