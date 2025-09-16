import { USER_ROLE } from "@/app/constants/user";

// ユーザーがユーザーの管理対象か確認
export function checkUserPermissions(role: string): boolean {
  return role === USER_ROLE.ADMIN;
}

// ユーザーがコンテンツの管理対象か確認
export function checkContentPermissions(role: string): boolean {
  return role === USER_ROLE.ADMIN || role === USER_ROLE.MAINTAINER;
}
