import { UserStatusType } from "../types";

export const USER_STATUS: Record<string, UserStatusType> = {
  PENDING: "pending",
  ACTIVE: "active",
  REJECTED: "rejected",
} as const;
