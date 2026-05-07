import {
  fetchDeletedApplications,
  fetchDeletedCategories,
  fetchDeletedDocuments,
  fetchDeletedVideos,
} from "../../../app/services/api/trash-server";
import { createServerSupabaseClient } from "../../../app/services/api/supabase-server";

/**
 * trash-server の単体テスト。
 * - 対象スクリプト: app/services/api/trash-server.ts
 * - 対象関数: fetchDeletedDocuments / fetchDeletedVideos / fetchDeletedApplications / fetchDeletedCategories
 * - 検証観点:
 *   1) 正常系でデータが取得できる
 *   2) 異常系で error を返す
 *   3) 並び順仕様(updated_at 降順)が担保される
 */

type QueryResult = { data: unknown; error: unknown };

// supabase-server モジュールをモック化し、createServerSupabaseClient だけをジェスト関数に差し替える。
// jest.requireActual でその他のエクスポートは実装をそのまま維持する。
jest.mock("../../../app/services/api/supabase-server", () => ({
  ...jest.requireActual("../../../app/services/api/supabase-server"),
  createServerSupabaseClient: jest.fn(),
}));

/**
 * Supabase のクエリビルダーを模倣するモックオブジェクトを生成する。
 * - select / eq / order をメソッドチェーンで呼び出せるよう、各メソッドは自身(builder)を返す。
 * - order のみ最終結果(result)を解決する Promise を返し、クエリの終端として機能する。
 * @param result - order() が解決する { data, error } オブジェクト
 */
const createOrderBuilder = (result: QueryResult) => {
  const builder: {
    select?: jest.Mock;
    eq?: jest.Mock;
    order?: jest.Mock;
  } = {};
  // select はチェーン継続のため builder 自身を返す
  builder.select = jest.fn(() => builder);
  // eq はチェーン継続のため builder 自身を返す
  builder.eq = jest.fn(() => builder);
  // order はクエリ終端として result を解決する Promise を返す
  builder.order = jest.fn(() => Promise.resolve(result));
  return builder as Required<typeof builder>;
};

describe("trash-server", () => {
  // createServerSupabaseClient のモック参照を jest.Mock 型にキャストして保持する。
  // 各テストケースで mockResolvedValue 等を呼び出す際に使用する。
  const createServerSupabaseClientMock = createServerSupabaseClient as jest.Mock;

  // 各テストの実行前にすべてのモック呼び出し履歴をリセットする。
  // これにより、テスト間でモックの状態が汚染されるのを防ぐ。
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe.each([
    {
      label: "fetchDeletedDocuments",
      table: "documents",
      execute: () => fetchDeletedDocuments(),
      successData: [
        {
          id: 1,
          name: "doc-1",
          updated_at: "2026-05-01T10:00:00.000Z",
          category_id: 10,
          category: [{ name: "category-a" }],
        },
      ],
      expectedData: [
        {
          id: 1,
          name: "doc-1",
          updated_at: "2026-05-01T10:00:00.000Z",
          category_id: 10,
          category: { name: "category-a" },
        },
      ],
      errorLogPrefix: "削除済み資料取得エラー:",
    },
    {
      label: "fetchDeletedVideos",
      table: "videos",
      execute: () => fetchDeletedVideos(),
      successData: [
        {
          id: 2,
          name: "video-1",
          updated_at: "2026-05-01T11:00:00.000Z",
          category_id: 11,
          category: [{ name: "category-v" }],
        },
      ],
      expectedData: [
        {
          id: 2,
          name: "video-1",
          updated_at: "2026-05-01T11:00:00.000Z",
          category_id: 11,
          category: { name: "category-v" },
        },
      ],
      errorLogPrefix: "削除済み動画取得エラー:",
    },
    {
      label: "fetchDeletedApplications",
      table: "applications",
      execute: () => fetchDeletedApplications(),
      successData: [
        {
          id: 3,
          name: "app-1",
          updated_at: "2026-05-01T12:00:00.000Z",
          category_id: 12,
          category: [{ name: "category-app" }],
        },
      ],
      expectedData: [
        {
          id: 3,
          name: "app-1",
          updated_at: "2026-05-01T12:00:00.000Z",
          category_id: 12,
          category: { name: "category-app" },
        },
      ],
      errorLogPrefix: "削除済みアプリ取得エラー:",
    },
    {
      label: "fetchDeletedCategories",
      table: "categories",
      execute: () => fetchDeletedCategories(),
      successData: [
        {
          id: 4,
          name: "cat-1",
          updated_at: "2026-05-01T13:00:00.000Z",
          category_type: "documents",
        },
      ],
      expectedData: [
        {
          id: 4,
          name: "cat-1",
          updated_at: "2026-05-01T13:00:00.000Z",
          category_type: "documents",
        },
      ],
      errorLogPrefix: "削除済みカテゴリー取得エラー:",
    },
  ])("$label", ({ table, execute, successData, expectedData, errorLogPrefix }) => {
    it("正常系でデータを返し、updated_at 降順で取得する", async () => {
      // Step 1: 一覧取得成功のモックを準備する
      const builder = createOrderBuilder({ data: successData, error: null });
      const supabase = { from: jest.fn(() => builder) };
      createServerSupabaseClientMock.mockResolvedValue(supabase);

      // Step 2: 対象関数を実行する
      const response = await execute();

      // Step 3: 正常結果が返ることを検証する
      expect(response).toEqual({ data: expectedData, error: null });

      // Step 4: 取得条件(is_deleted=true)と並び順(updated_at DESC)を検証する
      expect(supabase.from).toHaveBeenCalledWith(table);
      expect(builder.eq).toHaveBeenCalledWith("is_deleted", true);
      expect(builder.order).toHaveBeenCalledWith("updated_at", { ascending: false });
    });

    it("異常系で error を返す", async () => {
      // Step 1: 一覧取得失敗のモックを準備する
      const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
      const error = { message: "query failed" };
      const builder = createOrderBuilder({ data: null, error });
      const supabase = { from: jest.fn(() => builder) };
      createServerSupabaseClientMock.mockResolvedValue(supabase);

      // Step 2: 対象関数を実行する
      const response = await execute();

      // Step 3: 異常結果(data:null, error)が返ることを検証する
      expect(response).toEqual({ data: null, error });

      // Step 4: 失敗時ログが出ることを検証する
      expect(consoleError).toHaveBeenCalledWith(errorLogPrefix, "query failed");
      consoleError.mockRestore();
    });
  });
});
