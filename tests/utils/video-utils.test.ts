import {
  formatVideoDuration,
  formatVideoUpdatedDate,
  getVideoThumbnailUrl,
  normalizeVideoTimestamp,
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

describe("normalizeVideoTimestamp", () => {
  it.each([
    ["2026-10-15T18:00:00", "2026-10-15T18:00:00.000Z"],
    ["2026-10-15T18:00:00Z", "2026-10-15T18:00:00.000Z"],
    ["2026-10-16T03:00:00+09:00", "2026-10-15T18:00:00.000Z"],
  ])("%sをUTCのISO日時に正規化する", (timestamp, expected) => {
    expect(normalizeVideoTimestamp(timestamp)).toBe(expected);
  });
});

describe("formatVideoUpdatedDate", () => {
  it("オフセットなしのUTC日時を日本日付で表示する", () => {
    expect(formatVideoUpdatedDate("2026-10-15T18:00:00")).toBe("2026-10-16");
  });

  it("明示されたタイムゾーンを保持して日本日付に変換する", () => {
    expect(formatVideoUpdatedDate("2026-10-15T18:00:00+00:00")).toBe("2026-10-16");
  });
});

describe("formatVideoDuration", () => {
  it.each([
    [null, "未設定"],
    [0, "未設定"],
    [-1, "未設定"],
    [NaN, "未設定"],
    [Infinity, "未設定"],
    [-Infinity, "未設定"],
    [9, "0:09"],
    [60, "1:00"],
    [3661, "61:01"],
  ])("%s秒を%sに整形する", (seconds, expected) => {
    expect(formatVideoDuration(seconds)).toBe(expected);
  });
});
