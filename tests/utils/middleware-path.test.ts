import {
  isApiPath,
  isPublicApiRoute,
  isPublicPageRoute,
  shouldSkipMiddleware,
} from "../../app/utils/middleware-path";

describe("shouldSkipMiddleware", () => {
  it("静的ファイルと Next 内部パスはスキップする", () => {
    expect(shouldSkipMiddleware("/_next/static/chunk.js")).toBe(true);
    expect(shouldSkipMiddleware("/favicon.ico")).toBe(true);
    expect(shouldSkipMiddleware("/links/sinlab-knowledge.png")).toBe(true);
  });

  it("/api はスキップしない", () => {
    expect(shouldSkipMiddleware("/api")).toBe(false);
    expect(shouldSkipMiddleware("/api/calendar/events")).toBe(false);
    expect(shouldSkipMiddleware("/api/notifications/slack")).toBe(false);
    expect(shouldSkipMiddleware("/api/profile/image")).toBe(false);
    expect(shouldSkipMiddleware("/api/foo.bar")).toBe(false);
  });
});

describe("isApiPath", () => {
  it("API と trpc のパスを判定する", () => {
    expect(isApiPath("/api")).toBe(true);
    expect(isApiPath("/api/calendar/events")).toBe(true);
    expect(isApiPath("/trpc")).toBe(true);
    expect(isApiPath("/trpc/foo")).toBe(true);
    expect(isApiPath("/calendar")).toBe(false);
    expect(isApiPath("/api-docs")).toBe(false);
  });
});

describe("isPublicPageRoute", () => {
  it("公開ページのみ true を返す", () => {
    expect(isPublicPageRoute("/login")).toBe(true);
    expect(isPublicPageRoute("/callback")).toBe(true);
    expect(isPublicPageRoute("/pending")).toBe(true);
    expect(isPublicPageRoute("/rejected")).toBe(true);
    expect(isPublicPageRoute("/calendar")).toBe(false);
  });
});

describe("isPublicApiRoute", () => {
  it("公開 API ホワイトリストは空のため全て false", () => {
    expect(isPublicApiRoute("/api/calendar/events")).toBe(false);
    expect(isPublicApiRoute("/api/notifications/slack")).toBe(false);
    expect(isPublicApiRoute("/api/profile/image")).toBe(false);
  });
});
