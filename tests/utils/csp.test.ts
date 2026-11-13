import { buildContentSecurityPolicy } from "../../app/utils/csp";

describe("buildContentSecurityPolicy", () => {
  const csp = buildContentSecurityPolicy("abc123");
  const directive = (name: string) => csp.split("; ").find(d => d.startsWith(`${name} `)) ?? "";

  it("script-src は nonce + strict-dynamic で 'unsafe-inline' を含まない", () => {
    const scriptSrc = directive("script-src");
    expect(scriptSrc).toContain("'nonce-abc123'");
    expect(scriptSrc).toContain("'strict-dynamic'");
    expect(scriptSrc).not.toContain("'unsafe-inline'");
  });

  it("style-src-elem は nonce のみ、style-src-attr のみ 'unsafe-inline' を許可する", () => {
    expect(directive("style-src-elem")).toContain("'nonce-abc123'");
    expect(directive("style-src-elem")).not.toContain("'unsafe-inline'");
    expect(directive("style-src-attr")).toBe("style-src-attr 'unsafe-inline'");
  });

  it("基本ディレクティブを維持する", () => {
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(directive("frame-src")).toContain("https://www.youtube.com");
  });
});
