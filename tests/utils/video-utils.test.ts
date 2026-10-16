import {
  formatVideoUpdatedDate,
  getVideoThumbnailUrl,
} from "../../app/(authenticated)/videos/utils";

describe("getVideoThumbnailUrl", () => {
  it("登録済みのサムネイルを優先する", () => {
    expect(
      getVideoThumbnailUrl({
        thumbnail_path: "https://example.com/video.png",
        url: "https://youtu.be/abcdefghijk",
      })
    ).toBe("https://example.com/video.png");
  });

  it.each([
    "https://youtu.be/abcdefghijk",
    "https://www.youtube.com/watch?v=abcdefghijk",
    "https://www.youtube.com/embed/abcdefghijk",
  ])("YouTube URL からサムネイルを生成する: %s", url => {
    expect(getVideoThumbnailUrl({ thumbnail_path: null, url })).toBe(
      "https://img.youtube.com/vi/abcdefghijk/hqdefault.jpg"
    );
  });

  it("YouTube 以外の URL は既定画像を返す", () => {
    expect(getVideoThumbnailUrl({ thumbnail_path: "", url: "https://example.com/video" })).toBe(
      "/default_video_thumbnail.png"
    );
  });
});

describe("formatVideoUpdatedDate", () => {
  it("UTCとJSTの実行環境でオフセットなしのUTC日時を同じ日本日付で表示する", () => {
    const originalTimezone = process.env.TZ;

    try {
      process.env.TZ = "UTC";
      const utcEnvironmentDate = formatVideoUpdatedDate("2026-10-15T18:00:00");

      process.env.TZ = "Asia/Tokyo";
      const jstEnvironmentDate = formatVideoUpdatedDate("2026-10-15T18:00:00");

      expect(utcEnvironmentDate).toBe("2026/10/16");
      expect(jstEnvironmentDate).toBe(utcEnvironmentDate);
    } finally {
      if (originalTimezone === undefined) {
        delete process.env.TZ;
      } else {
        process.env.TZ = originalTimezone;
      }
    }
  });

  it("明示されたタイムゾーンを保持して日本日付に変換する", () => {
    expect(formatVideoUpdatedDate("2026-10-15T18:00:00+00:00")).toBe("2026/10/16");
  });
});
