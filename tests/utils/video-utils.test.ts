import { getVideoThumbnailUrl } from "../../app/(authenticated)/videos/utils";

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
