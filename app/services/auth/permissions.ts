import { USER_ROLE } from "@/app/constants/user";

// ユーザーが管理者権限か確認
export function checkAdminPermissions(role: string): boolean {
  return role === USER_ROLE.ADMIN;
}

// ユーザーがコンテンツの管理対象か確認
export function checkContentPermissions(role: string): boolean {
  return role === USER_ROLE.ADMIN || role === USER_ROLE.MAINTAINER;
}
