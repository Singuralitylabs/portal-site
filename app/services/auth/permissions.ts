import { USER_ROLE } from "@/app/constants/user";

// ユーザーがコンテンツの管理対象か確認
export function checkContentPermissions(role: string): boolean {
  return role === USER_ROLE.ADMIN || role === USER_ROLE.MAINTAINER;
}
