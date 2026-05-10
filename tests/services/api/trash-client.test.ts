import {
  restoreApplication,
  restoreCategory,
  restoreDocument,
  restoreVideo,
} from "../../../app/services/api/trash-client";
import { createClientSupabaseClient } from "../../../app/services/api/supabase-client";

/**
 * trash-client の単体テスト。
 * - 対象スクリプト: app/services/api/trash-client.ts
 * - 対象関数: restoreDocument / restoreVideo / restoreApplication / restoreCategory
 * - 検証観点:
 *   1) 対象取得失敗時に success:false を返す
 *   2) 更新失敗時に success:false を返す
 *   3) 正常時に success:true を返す
 *   4) display_order が末尾(MAX+1)で更新される
 *   5) 削除済み条件(is_deleted=true)で取得/更新される
 */

type QueryResult = { data: unknown; error: unknown };

// supabase-client モジュールをモック化し、createClientSupabaseClient のみをジェスト関数に差し替える。
// jest.requireActual で実際のモジュールのその他のエクスポートはそのまま保持する。
jest.mock("../../../app/services/api/supabase-client", () => ({
  ...jest.requireActual("../../../app/services/api/supabase-client"),
  createClientSupabaseClient: jest.fn(),
}));

/**
 * 復活対象レコードを1件取得するクエリビルダーのモックを生成する。
 * select → eq(連鎖可) → single の順に呼び出されることを想定している。
 * single() は引数で渡した result を解決する Promise を返す。
 */
const createTargetFetchBuilder = (result: QueryResult) => {
  const builder: { select?: jest.Mock; eq?: jest.Mock; single?: jest.Mock } = {};
  // select() はメソッドチェーンのために自身(builder)を返す
  builder.select = jest.fn(() => builder);
  // eq() は複数回呼ばれる可能性があるため、同様に自身を返す
  builder.eq = jest.fn(() => builder);
  // single() はチェーン終端として result を解決する Promise を返す
  builder.single = jest.fn(() => Promise.resolve(result));
  return builder as Required<typeof builder>;
};

/**
 * 同カテゴリ内の最大 display_order を取得するクエリビルダーのモックを生成する。
 * select → eq(連鎖可) → order → limit の順に呼び出されることを想定している。
 * limit() はチェーン終端として引数で渡した result を解決する Promise を返す。
 */
const createMaxOrderBuilder = (result: QueryResult) => {
  const builder: {
    select?: jest.Mock;
    eq?: jest.Mock;
    order?: jest.Mock;
    limit?: jest.Mock;
  } = {};
  // select() はメソッドチェーンのために自身(builder)を返す
  builder.select = jest.fn(() => builder);
  // eq() は複数回呼ばれる可能性があるため、同様に自身を返す
  builder.eq = jest.fn(() => builder);
  // order() は並び順を指定するために自身を返す
  builder.order = jest.fn(() => builder);
  // limit() はチェーン終端として result を解決する Promise を返す
  builder.limit = jest.fn(() => Promise.resolve(result));
  return builder as Required<typeof builder>;
};

/**
 * レコードを更新するクエリビルダーのモックを生成する。
 * update → eq(連鎖可) の順に呼び出されることを想定している。
 * then() は Promise として扱われるよう実装し、引数で渡した result を解決する。
 */
const createUpdateBuilder = (result: QueryResult) => {
  const builder: {
    update?: jest.Mock;
    eq?: jest.Mock;
    then?: (resolve: (value: QueryResult) => void) => Promise<void>;
  } = {};
  // update() はメソッドチェーンのために自身(builder)を返す
  builder.update = jest.fn(() => builder);
  // eq() は複数回呼ばれる可能性があるため、同様に自身を返す
  builder.eq = jest.fn(() => builder);
  // then() は builder を thenable にし、await 時に result を解決する
  builder.then = resolve => Promise.resolve(result).then(resolve);
  return builder as Required<typeof builder>;
};

/**
 * 複数のクエリビルダーを順番に返す Supabase クライアントのモックを生成する。
 * from() が呼ばれるたびに builders 配列の先頭から順にビルダーを返す。
 * これにより、1つのテスト内で複数の異なるクエリ操作をシミュレートできる。
 */
const buildSupabaseWithSequence = (builders: unknown[]) => ({
  from: jest.fn(() => builders.shift()),
});

describe("trash-client", () => {
  // createClientSupabaseClient を jest.Mock 型にキャストして、mockReturnValue などのモック操作を可能にする
  const createClientSupabaseClientMock = createClientSupabaseClient as jest.Mock;

  // 各テストケース実行前にモックの呼び出し履歴・戻り値をリセットし、テスト間の干渉を防ぐ
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe.each([
    {
      label: "restoreDocument",
      table: "documents",
      execute: (id: number) => restoreDocument(id, 101),
      targetRecord: { category_id: 10 },
      targetGroupField: "category_id",
      includeUpdatedBy: true,
      expectedUpdatedBy: 101,
    },
    {
      label: "restoreVideo",
      table: "videos",
      execute: (id: number) => restoreVideo(id, 102),
      targetRecord: { category_id: 11 },
      targetGroupField: "category_id",
      includeUpdatedBy: true,
      expectedUpdatedBy: 102,
    },
    {
      label: "restoreApplication",
      table: "applications",
      execute: (id: number) => restoreApplication(id, 103),
      targetRecord: { category_id: 12 },
      targetGroupField: "category_id",
      includeUpdatedBy: true,
      expectedUpdatedBy: 103,
    },
    {
      label: "restoreCategory",
      table: "categories",
      execute: (id: number) => restoreCategory(id),
      targetRecord: { category_type: "documents" },
      targetGroupField: "category_type",
      includeUpdatedBy: false,
      expectedUpdatedBy: null,
    },
  ])(
    "$label",
    ({ table, execute, targetRecord, targetGroupField, includeUpdatedBy, expectedUpdatedBy }) => {
      it("対象取得失敗時に success:false を返す", async () => {
        // Step 1: 復活対象取得でエラーを返すモックを準備する
        const fetchError = { message: "not found" };
        const targetBuilder = createTargetFetchBuilder({ data: null, error: fetchError });
        const supabase = buildSupabaseWithSequence([targetBuilder]);
        createClientSupabaseClientMock.mockReturnValue(supabase);

        // Step 2: 対象関数を実行する
        const response = await execute(1);

        // Step 3: 失敗結果が返ることを検証する
        expect(response).toEqual({ success: false, error: fetchError });

        // Step 4: 対象取得時に削除済み条件が入ることを検証する
        expect(targetBuilder.eq).toHaveBeenCalledWith("id", 1);
        expect(targetBuilder.eq).toHaveBeenCalledWith("is_deleted", true);
        expect(supabase.from).toHaveBeenCalledTimes(1);
        expect(supabase.from).toHaveBeenCalledWith(table);
      });

      it("更新失敗時に success:false を返す", async () => {
        // Step 1: 対象取得・最大順序取得・更新失敗のモックを順に準備する
        const targetBuilder = createTargetFetchBuilder({ data: targetRecord, error: null });
        const maxOrderBuilder = createMaxOrderBuilder({
          data: [{ display_order: 5 }],
          error: null,
        });
        const updateError = { message: "update failed" };
        const updateBuilder = createUpdateBuilder({ data: null, error: updateError });
        const supabase = buildSupabaseWithSequence([targetBuilder, maxOrderBuilder, updateBuilder]);
        createClientSupabaseClientMock.mockReturnValue(supabase);

        // Step 2: 対象関数を実行する
        const response = await execute(2);

        // Step 3: 更新失敗が返ることを検証する
        expect(response).toEqual({ success: false, error: updateError });

        // Step 4: 更新時に削除済み条件で絞られていることを検証する
        expect(updateBuilder.eq).toHaveBeenCalledWith("id", 2);
        expect(updateBuilder.eq).toHaveBeenCalledWith("is_deleted", true);

        // Step 5: display_order の検索は非削除データで行うことを検証する
        expect(maxOrderBuilder.eq).toHaveBeenCalledWith(
          targetGroupField,
          Object.values(targetRecord)[0]
        );
        expect(maxOrderBuilder.eq).toHaveBeenCalledWith("is_deleted", false);
      });

      it("正常時に success:true を返し、display_order を末尾(MAX+1)で更新する", async () => {
        // Step 1: 対象取得・最大順序取得・更新成功のモックを準備する
        const targetBuilder = createTargetFetchBuilder({ data: targetRecord, error: null });
        const maxOrderBuilder = createMaxOrderBuilder({
          data: [{ display_order: 7 }],
          error: null,
        });
        const updateBuilder = createUpdateBuilder({ data: null, error: null });
        const supabase = buildSupabaseWithSequence([targetBuilder, maxOrderBuilder, updateBuilder]);
        createClientSupabaseClientMock.mockReturnValue(supabase);

        // Step 2: 対象関数を実行する
        const response = await execute(3);

        // Step 3: 正常結果が返ることを検証する
        expect(response).toEqual({ success: true, error: null });

        // Step 4: MAX+1 で更新されることを検証する
        const expectedPayload: { is_deleted: boolean; display_order: number; updated_by?: number } =
          {
            is_deleted: false,
            display_order: 8,
          };
        if (includeUpdatedBy) {
          expectedPayload.updated_by = expectedUpdatedBy as number;
        }
        expect(updateBuilder.update).toHaveBeenCalledWith(expectedPayload);

        // Step 5: 削除済み条件が取得/更新で適用されることを検証する
        expect(targetBuilder.eq).toHaveBeenCalledWith("is_deleted", true);
        expect(updateBuilder.eq).toHaveBeenCalledWith("is_deleted", true);

        // Step 6: 並び順の取得条件が意図どおりであることを検証する
        expect(maxOrderBuilder.order).toHaveBeenCalledWith("display_order", { ascending: false });
        expect(maxOrderBuilder.limit).toHaveBeenCalledWith(1);
      });

      it("既存データがない場合は display_order を 1 で更新する", async () => {
        // Step 1: 最大順序が取得できないケースのモックを準備する
        const targetBuilder = createTargetFetchBuilder({ data: targetRecord, error: null });
        const maxOrderBuilder = createMaxOrderBuilder({ data: [], error: null });
        const updateBuilder = createUpdateBuilder({ data: null, error: null });
        const supabase = buildSupabaseWithSequence([targetBuilder, maxOrderBuilder, updateBuilder]);
        createClientSupabaseClientMock.mockReturnValue(supabase);

        // Step 2: 対象関数を実行する
        const response = await execute(4);

        // Step 3: 更新成功と初期並び順(1)を検証する
        expect(response).toEqual({ success: true, error: null });
        expect(updateBuilder.update).toHaveBeenCalledWith(
          expect.objectContaining({
            is_deleted: false,
            display_order: 1,
          })
        );
      });
    }
  );
});
