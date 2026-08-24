import { sanitizeSlackDisplayName } from "../../app/utils/slack-display-name";

describe("sanitizeSlackDisplayName", () => {
  it("ZWNJ を含むペルシャ語名を残す", () => {
    expect(sanitizeSlackDisplayName("می‌خواهم")).toBe("می‌خواهم");
  });

  it("括弧やカンマを残す", () => {
    expect(sanitizeSlackDisplayName("Taro Yamada (山田), テスト")).toBe(
      "Taro Yamada (山田), テスト"
    );
  });

  it("制御文字と <> を除去する", () => {
    expect(sanitizeSlackDisplayName("A<script>\nB")).toBe("AscriptB");
  });

  it("空文字はプレースホルダにする", () => {
    expect(sanitizeSlackDisplayName("")).toBe("（名前未設定）");
  });
});
