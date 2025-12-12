import { UserActionType, UserRoleType, UserStatusType } from "../types";

export const USER_STATUS: Record<string, UserStatusType> = {
  PENDING: "pending",
  ACTIVE: "active",
  REJECTED: "rejected",
} as const;

export const USER_ROLE: Record<string, UserRoleType> = {
  ADMIN: "admin",
  MAINTAINER: "maintainer",
  MEMBER: "member",
} as const;

export const USER_ACTION: Record<string, UserActionType> = {
  APPROVE: "approve",
  REJECT: "reject",
  DELETE: "delete",
} as const;
