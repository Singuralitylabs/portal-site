import {
  DEFAULT_VIDEO_FILTERS,
  formatVideoDuration,
  formatVideoUpdatedDate,
  getVideoThumbnailUrl,
  getVideoSections,
  normalizeVideoTimestamp,
} from "../../app/(authenticated)/videos/utils";

describe("getVideoSections", () => {
  const categories = [
    { id: 20, name: "先" },
    { id: 10, name: "後" },
    { id: 30, name: "空" },
  ];
  const videos = [
    {
      id: 4,
      name: "動画",
      description: "React 入門",
      category_id: 10,
      display_order: 1,
      recorded_on: "2026-02-01",
      assignee: { id: 2, display_name: "いとう" },
    },
    {
      id: 3,
      name: "ＲＥＡＣＴ",
      description: null,
      category_id: 20,
      display_order: 2,
      recorded_on: "2026-01-01",
      assignee: { id: 1, display_name: "あおき" },
    },
    {
      id: 2,
      name: "動画",
      description: "react",
      category_id: 20,
      display_order: 1,
      recorded_on: null,
      assignee: null,
    },
    {
      id: 1,
      name: "動画",
      description: null,
      category_id: 20,
      display_order: 2,
      recorded_on: "2026-01-01",
      assignee: { id: 1, display_name: "あおき" },
    },
  ];
  const idsFor = (filters = DEFAULT_VIDEO_FILTERS) =>
    getVideoSections(videos, categories, filters).map(section =>
      section.videos.map(video => video.id)
    );

  it("カテゴリー順と動画の表示順を維持し、空カテゴリーと入力配列に影響しない", () => {
    expect(idsFor()).toEqual([[2, 1, 3], [4]]);
    expect(videos.map(video => video.id)).toEqual([4, 3, 2, 1]);
  });

  it("検索と期間をANDで適用し、両端を含めて未設定を除外する", () => {
    const search = { ...DEFAULT_VIDEO_FILTERS, query: "　 React ", acrossCategories: true };
    expect(idsFor(search)).toEqual([[2, 3, 4]]);
    expect(idsFor({ ...search, start: "2026-01-01", end: "2026-02-01" })).toEqual([[3, 4]]);
    expect(idsFor({ ...search, start: "2026-02-01" })).toEqual([[4]]);
    expect(idsFor({ ...search, end: "2026-01-01" })).toEqual([[3]]);
    expect(idsFor({ ...search, query: "見つからない" })).toEqual([]);
  });

  it.each([
    ["recorded-asc", [1, 3, 4, 2]],
    ["recorded-desc", [4, 1, 3, 2]],
    ["assignee-asc", [1, 3, 4, 2]],
    ["assignee-desc", [4, 1, 3, 2]],
  ] as const)("横断表示 %s は未設定を末尾、同順位を既定順にする", (sort, expected) => {
    expect(idsFor({ ...DEFAULT_VIDEO_FILTERS, sort, acrossCategories: true })).toEqual([expected]);
    expect(idsFor({ ...DEFAULT_VIDEO_FILTERS, sort })).toEqual([[1, 3, 2], [4]]);
  });
});

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
