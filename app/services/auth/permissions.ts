// ユーザーがコンテンツの管理対象か確認
export function checkContentPermissions(role: string): boolean {
  return role === "admin" || role === "maintainer";
}
