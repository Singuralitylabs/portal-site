import { buildContentSecurityPolicy } from "../../app/utils/csp";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

const setEnv = (env: Record<string, string | undefined>) => {
  process.env = { ...originalEnv, ...env } as NodeJS.ProcessEnv;
};

const directive = (csp: string, name: string) =>
  csp.split("; ").find(d => d.startsWith(`${name} `)) ?? "";

describe("buildContentSecurityPolicy", () => {
  describe("本番", () => {
    beforeEach(() => {
      setEnv({
        NODE_ENV: "production",
        VERCEL_ENV: undefined,
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      });
    });

    it("script-src は nonce + strict-dynamic で 'unsafe-inline' / 'unsafe-eval' を含まない", () => {
      const scriptSrc = directive(buildContentSecurityPolicy("abc123"), "script-src");
      expect(scriptSrc).toContain("'nonce-abc123'");
      expect(scriptSrc).toContain("'strict-dynamic'");
      expect(scriptSrc).not.toContain("'unsafe-inline'");
      expect(scriptSrc).not.toContain("'unsafe-eval'");
      expect(scriptSrc).not.toContain("http://");
    });

    it("style-src-elem は nonce のみ、style-src-attr のみ 'unsafe-inline' を許可する", () => {
      const csp = buildContentSecurityPolicy("abc123");
      expect(directive(csp, "style-src-elem")).toContain("'nonce-abc123'");
      expect(directive(csp, "style-src-elem")).not.toContain("'unsafe-inline'");
      expect(directive(csp, "style-src")).not.toContain("'unsafe-inline'");
      expect(directive(csp, "style-src-attr")).toBe("style-src-attr 'unsafe-inline'");
    });

    it("基本ディレクティブと Supabase の許可先を導出する", () => {
      const csp = buildContentSecurityPolicy("abc123");
      expect(csp).toContain("object-src 'none'");
      expect(csp).toContain("frame-ancestors 'none'");
      expect(directive(csp, "frame-src")).toContain("https://www.youtube.com");
      expect(directive(csp, "connect-src")).toContain("https://example.supabase.co");
      expect(directive(csp, "connect-src")).toContain("wss://example.supabase.co");
      expect(csp).not.toContain("vercel.live");
    });
  });

  it("開発では unsafe-eval と style 要素の 'unsafe-inline' を許可する", () => {
    setEnv({ NODE_ENV: "development" });
    const csp = buildContentSecurityPolicy("abc123");
    expect(directive(csp, "script-src")).toContain("'unsafe-eval'");
    expect(directive(csp, "style-src-elem")).toContain("'unsafe-inline'");
    expect(directive(csp, "style-src-elem")).not.toContain("nonce");
  });

  it("Preview では vercel.live を許可し、style 要素は nonce なしの 'unsafe-inline' にする", () => {
    setEnv({ NODE_ENV: "production", VERCEL_ENV: "preview" });
    const csp = buildContentSecurityPolicy("abc123");
    expect(directive(csp, "script-src")).toContain("https://vercel.live");
    expect(directive(csp, "connect-src")).toContain("https://vercel.live");
    for (const name of ["style-src", "style-src-elem"]) {
      expect(directive(csp, name)).toContain("'unsafe-inline'");
      expect(directive(csp, name)).not.toContain("nonce");
    }
  });

  it("Supabase URL が未設定・パース不能でも許可先を広げない", () => {
    setEnv({ NODE_ENV: "production", NEXT_PUBLIC_SUPABASE_URL: undefined });
    expect(directive(buildContentSecurityPolicy("abc123"), "connect-src")).toBe(
      "connect-src 'self'"
    );
    setEnv({ NODE_ENV: "production", NEXT_PUBLIC_SUPABASE_URL: "not a url" });
    expect(directive(buildContentSecurityPolicy("abc123"), "connect-src")).toBe(
      "connect-src 'self'"
    );
  });

  it("Supabase URL が http/https 以外のスキームなら許可先を広げない", () => {
    setEnv({ NODE_ENV: "production", NEXT_PUBLIC_SUPABASE_URL: "ftp://example.com" });
    expect(directive(buildContentSecurityPolicy("abc123"), "connect-src")).toBe(
      "connect-src 'self'"
    );
  });
});
