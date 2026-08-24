/**
 * middleware が静的ファイル等をスキップすべきかを判定する。
 * `/api` は認証ゲートの対象のため、ここではスキップしない。
 */
export function shouldSkipMiddleware(pathname: string): boolean {
  return pathname.startsWith("/_next") || pathname.includes(".") || pathname === "/favicon.ico";
}

const publicPageRoutes = ["/login", "/callback", "/pending", "/rejected"];

/**
 * 認証なしでアクセス可能なページルートかを判定する。
 */
export function isPublicPageRoute(pathname: string): boolean {
  return publicPageRoutes.some(route => pathname.startsWith(route));
}

/**
 * 認証なしで公開する API パス。
 * 現時点で公開 API は存在しない。追加する場合はこの配列にパスを列挙する。
 */
export const publicApiRoutes: readonly string[] = [];

/**
 * API（または trpc）パスかを判定する。
 */
export function isApiPath(pathname: string): boolean {
  return (
    pathname === "/api" ||
    pathname.startsWith("/api/") ||
    pathname === "/trpc" ||
    pathname.startsWith("/trpc/")
  );
}

/**
 * 公開ホワイトリストに含まれる API かを判定する。
 */
export function isPublicApiRoute(pathname: string): boolean {
  return publicApiRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`));
}
