/**
 * ファイル概要: クライアント側 API サービスのユニットテスト（モック）
 *
 * 処理内容:
 * - `applications-client` / `documents-client` / `videos-client` / `categories-client` /
 *   `users-client` の正常系・異常系・副作用（再採番など）を検証する
 * - Supabase クエリチェーンをモックビルダーで再現し、戻り値契約（`success/error`）を確認する
 * - 例外発生時に呼び出し側で契約が崩れないこと（`success=false`）を回帰検知する
 *
 * 主な対象関数:
 * - `get*ByCategory` / `register*` / `update*` / `delete*`（applications/documents/videos）
 * - `registerCategory` / `updateCategory` / `deleteCategory` / `getCategoriesForPosition`
 * - `addNewUser` / `approveUser` / `rejectUser` / `fetchUser*`
 * - `createClientSupabaseClient`
 *
 * 依存関係:
 * - `@supabase/ssr`（`createBrowserClient`）
 * - `app/services/api/*-client.ts` 各サービス実装
 * - `app/services/api/utils/display-order`（モック化）
 */
import { createBrowserClient } from "@supabase/ssr";
import { createClientSupabaseClient } from "../../../app/services/api/supabase-client";
import {
  deleteApplication,
  getApplicationsByCategory,
  registerApplication,
  updateApplication,
} from "../../../app/services/api/applications-client";
import {
  deleteDocument,
  getDocumentsByCategory,
  registerDocument,
  updateDocument,
} from "../../../app/services/api/documents-client";
import {
  deleteVideo,
  getVideosByCategory,
  registerVideo,
  updateVideo,
} from "../../../app/services/api/videos-client";
import {
  deleteCategory,
  getCategoriesForPosition,
  registerCategory,
  updateCategory,
} from "../../../app/services/api/categories-client";
import {
  addNewUser,
  approveUser,
  fetchUserIdByAuthId,
  fetchUserRoleById,
  fetchUserStatusById,
  rejectUser,
} from "../../../app/services/api/users-client";
import {
  calculateDisplayOrder,
  getItemsByCategory,
  reorderItemsInCategory,
  shiftDisplayOrder,
} from "../../../app/services/api/utils/display-order";

/**
 * クライアント側 Supabase サービス群のテスト。
 * - 対象関数: createClientSupabaseClient / 各 content CRUD / users-client 系関数
 * - 検証観点: 正常系戻り値、異常系エラーハンドリング、副作用(再採番)の呼び出し
 */
const supabaseClientActual = jest.requireActual(
  "../../../app/services/api/supabase-client"
) as typeof import("../../../app/services/api/supabase-client");

// Supabase クエリ戻り値の共通型
type QueryResult = { data: unknown; error: unknown };

const ORIGINAL_ENV = process.env;

jest.mock("@supabase/ssr", () => ({
  createBrowserClient: jest.fn(),
}));

jest.mock("../../../app/services/api/supabase-client", () => ({
  ...jest.requireActual("../../../app/services/api/supabase-client"),
  createClientSupabaseClient: jest.fn(),
}));

jest.mock("../../../app/services/api/utils/display-order", () => ({
  getItemsByCategory: jest.fn(),
  calculateDisplayOrder: jest.fn(),
  shiftDisplayOrder: jest.fn(),
  reorderItemsInCategory: jest.fn(),
}));

// update(...).eq(...) で完結するクエリ用モック
const createUpdateBuilder = (result: QueryResult) => {
  const builder: { update?: jest.Mock; eq?: jest.Mock } = {};
  builder.update = jest.fn(() => builder);
  builder.eq = jest.fn(() => Promise.resolve(result));
  return builder as Required<typeof builder>;
};

// update(...).eq(...).select(...).maybeSingle() で完結するクエリ用モック
const createUpdateSelectMaybeSingleBuilder = (result: QueryResult) => {
  const builder: {
    update?: jest.Mock;
    eq?: jest.Mock;
    select?: jest.Mock;
    maybeSingle?: jest.Mock;
  } = {};
  builder.update = jest.fn(() => builder);
  builder.eq = jest.fn(() => builder);
  builder.select = jest.fn(() => builder);
  builder.maybeSingle = jest.fn(() => Promise.resolve(result));
  return builder as Required<typeof builder>;
};

// update(...).in(...).eq(...).eq(...) で終端するクエリ用モック
const createUpdateInEqBuilder = (result: QueryResult) => {
  const builder: { update?: jest.Mock; in?: jest.Mock; eq?: jest.Mock } = {};
  let eqCalls = 0;
  builder.update = jest.fn(() => builder);
  builder.in = jest.fn(() => builder);
  builder.eq = jest.fn(() => {
    eqCalls += 1;
    if (eqCalls >= 2) {
      return Promise.resolve(result);
    }
    return builder;
  });
  return builder as Required<typeof builder>;
};

// update(...).in(...).eq(...).eq(...).select(...) で終端するクエリ用モック
const createUpdateInEqSelectBuilder = (result: QueryResult) => {
  const builder: { update?: jest.Mock; in?: jest.Mock; eq?: jest.Mock; select?: jest.Mock } = {};
  let eqCalls = 0;
  builder.update = jest.fn(() => builder);
  builder.in = jest.fn(() => builder);
  builder.eq = jest.fn(() => {
    eqCalls += 1;
    if (eqCalls >= 2) {
      return builder;
    }
    return builder;
  });
  builder.select = jest.fn(() => Promise.resolve(result));
  return builder as Required<typeof builder>;
};

// select(...).in(...).eq(...).eq(...) を await で終端するクエリ用モック
const createAwaitableSelectInDoubleEqBuilder = (result: QueryResult) => {
  const builder: {
    select?: jest.Mock;
    in?: jest.Mock;
    eq?: jest.Mock;
    then?: (resolve: (value: QueryResult) => void) => Promise<void>;
  } = {};
  builder.select = jest.fn(() => builder);
  builder.in = jest.fn(() => builder);
  builder.eq = jest.fn(() => builder);
  builder.then = resolve => Promise.resolve(result).then(resolve);
  return builder as Required<typeof builder>;
};

// insert(...) で完結するクエリ用モック
const createInsertBuilder = (result: QueryResult) => {
  const builder: { insert?: jest.Mock } = {};
  builder.insert = jest.fn(() => Promise.resolve(result));
  return builder as Required<typeof builder>;
};

// insert(...).select(...) で完結するクエリ用モック
const createInsertSelectBuilder = (result: QueryResult) => {
  const builder: { insert?: jest.Mock; select?: jest.Mock } = {};
  builder.insert = jest.fn(() => builder);
  builder.select = jest.fn(() => Promise.resolve(result));
  return builder as Required<typeof builder>;
};

// select(...).eq(...).order(...) で終端する一覧取得クエリ用モック
const createOrderBuilder = (result: QueryResult) => {
  const builder: { select?: jest.Mock; eq?: jest.Mock; order?: jest.Mock } = {};
  builder.select = jest.fn(() => builder);
  builder.eq = jest.fn(() => builder);
  builder.order = jest.fn(() => Promise.resolve(result));
  return builder as Required<typeof builder>;
};

// select(...).eq(...).eq(...).gte(...).order(...) で終端するクエリ用モック
const createGteOrderBuilder = (result: QueryResult) => {
  const builder: {
    select?: jest.Mock;
    eq?: jest.Mock;
    neq?: jest.Mock;
    gte?: jest.Mock;
    order?: jest.Mock;
    then?: (resolve: (value: QueryResult) => void) => Promise<void>;
  } = {};
  builder.select = jest.fn(() => builder);
  builder.eq = jest.fn(() => builder);
  builder.neq = jest.fn(() => builder);
  builder.gte = jest.fn(() => builder);
  builder.order = jest.fn(() => builder);
  builder.then = resolve => Promise.resolve(result).then(resolve);
  return builder as Required<typeof builder>;
};

// select(...).eq(...).single() で完結するクエリ用モック
const createSelectSingleBuilder = (result: QueryResult) => {
  const builder: { select?: jest.Mock; eq?: jest.Mock; single?: jest.Mock } = {};
  builder.select = jest.fn(() => builder);
  builder.eq = jest.fn(() => builder);
  builder.single = jest.fn(() => Promise.resolve(result));
  return builder as Required<typeof builder>;
};

// select(...).eq(...).eq(...) を await で終端するクエリ用モック
const createAwaitableSelectDoubleEqBuilder = (result: QueryResult) => {
  const builder: {
    select?: jest.Mock;
    eq?: jest.Mock;
    then?: (resolve: (value: QueryResult) => void) => Promise<void>;
  } = {};
  builder.select = jest.fn(() => builder);
  builder.eq = jest.fn(() => builder);
  builder.then = resolve => Promise.resolve(result).then(resolve);
  return builder as Required<typeof builder>;
};

// select(...).eq(...).eq(...).order(...).limit(...) で終端するクエリ用モック
const createOrderLimitBuilder = (result: QueryResult) => {
  const builder: {
    select?: jest.Mock;
    eq?: jest.Mock;
    order?: jest.Mock;
    limit?: jest.Mock;
  } = {};
  builder.select = jest.fn(() => builder);
  builder.eq = jest.fn(() => builder);
  builder.order = jest.fn(() => builder);
  builder.limit = jest.fn(() => Promise.resolve(result));
  return builder as Required<typeof builder>;
};

// select(...).eq(...).maybeSingle() で完結するクエリ用モック
const createMaybeSingleBuilder = (result: QueryResult) => {
  const builder: { select?: jest.Mock; eq?: jest.Mock; maybeSingle?: jest.Mock } = {};
  builder.select = jest.fn(() => builder);
  builder.eq = jest.fn(() => builder);
  builder.maybeSingle = jest.fn(() => Promise.resolve(result));
  return builder as Required<typeof builder>;
};

// await 可能な update builder（approve/reject で利用）
const createAwaitableUpdateBuilder = (result: QueryResult) => {
  const builder: {
    update?: jest.Mock;
    eq?: jest.Mock;
    then?: (resolve: (value: QueryResult) => void) => Promise<void>;
  } = {};
  builder.update = jest.fn(() => builder);
  builder.eq = jest.fn(() => builder);
  builder.then = resolve => Promise.resolve(result).then(resolve);
  return builder as Required<typeof builder>;
};

// createClientSupabaseClient 単体の確認
describe("supabase-client", () => {
  const createBrowserClientMock = createBrowserClient as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it("環境変数を利用して Supabase クライアントを生成する", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
    const mockClient = { from: jest.fn() };
    createBrowserClientMock.mockReturnValue(mockClient);

    const response = supabaseClientActual.createClientSupabaseClient();

    // createBrowserClient が環境変数の URL / ANON KEY で呼ばれることを確認
    expect(createBrowserClientMock).toHaveBeenCalledWith("https://example.supabase.co", "anon-key");
    // ラッパー関数の戻り値として生成クライアントが返ることを確認
    expect(response).toBe(mockClient);
  });
});

// application/document/video の共通 CRUD テスト
describe("content client services", () => {
  const createClientSupabaseClientMock = createClientSupabaseClient as jest.Mock;
  const getItemsByCategoryMock = getItemsByCategory as jest.Mock;
  const calculateDisplayOrderMock = calculateDisplayOrder as jest.Mock;
  const shiftDisplayOrderMock = shiftDisplayOrder as jest.Mock;
  const reorderItemsInCategoryMock = reorderItemsInCategory as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe.each([
    { label: "application", getByCategory: getApplicationsByCategory },
    { label: "document", getByCategory: getDocumentsByCategory },
    { label: "video", getByCategory: getVideosByCategory },
  ])("getByCategory: $label", ({ getByCategory }) => {
    // 呼び出し関数: getApplicationsByCategory/getDocumentsByCategory/getVideosByCategory
    it("正常系: カテゴリー内アイテム一覧を取得できる", async () => {
      const items = [{ id: 1, name: "item", display_order: 1 }];
      getItemsByCategoryMock.mockResolvedValue(items);

      const response = await getByCategory(10, 2);

      // カテゴリ取得関数が取得結果をそのまま返すことを確認
      expect(response).toEqual(items);
      // 共通ユーティリティ getItemsByCategory が1回呼ばれることを確認
      expect(getItemsByCategoryMock).toHaveBeenCalledTimes(1);
    });
  });

  describe.each([
    { label: "application", deleteFn: deleteApplication },
    { label: "document", deleteFn: deleteDocument },
    { label: "video", deleteFn: deleteVideo },
  ])("delete: $label", ({ deleteFn }) => {
    // 呼び出し関数: deleteApplication/deleteDocument/deleteVideo
    it("正常系: 論理削除に成功する", async () => {
      const builder = createUpdateBuilder({ data: null, error: null });
      const supabase = { from: jest.fn(() => builder) };
      createClientSupabaseClientMock.mockReturnValue(supabase);

      const response = await deleteFn(1, 10);

      // 論理削除成功時に success=true が返ることを確認
      expect(response).toEqual({ success: true, error: null });
    });

    it("異常系: エラー時は失敗を返す", async () => {
      const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
      const error = { message: "failed" };
      const builder = createUpdateBuilder({ data: null, error });
      const supabase = { from: jest.fn(() => builder) };
      createClientSupabaseClientMock.mockReturnValue(supabase);

      const response = await deleteFn(2, 11);

      // 論理削除失敗時に success=false とエラーが返ることを確認
      expect(response).toEqual({ success: false, error });
      // 失敗時にエラーログが出力されることを確認
      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore();
    });
  });

  describe.each([
    {
      label: "application",
      registerFn: registerApplication,
      updateFn: updateApplication,
      registerPayload: {
        name: "App A",
        category_id: 1,
        description: "desc",
        url: "https://app.example.com",
        developer_id: 7,
        created_by: 10,
        position: { type: "first" as const },
      },
      updatePayload: {
        id: 1,
        name: "App A2",
        category_id: 2,
        description: "desc2",
        url: "https://app.example.com/2",
        developer_id: 8,
        updated_by: 11,
        position: { type: "after" as const, afterId: 3 },
      },
    },
    {
      label: "document",
      registerFn: registerDocument,
      updateFn: updateDocument,
      registerPayload: {
        name: "Doc A",
        category_id: 1,
        description: "desc",
        url: "https://doc.example.com",
        assignee_id: 1,
        created_by: 10,
        position: { type: "first" as const },
      },
      updatePayload: {
        id: 1,
        name: "Doc A2",
        category_id: 2,
        description: "desc2",
        url: "https://doc.example.com/2",
        assignee_id: 2,
        updated_by: 11,
        position: { type: "after" as const, afterId: 3 },
      },
    },
    {
      label: "video",
      registerFn: registerVideo,
      updateFn: updateVideo,
      registerPayload: {
        name: "Video A",
        category_id: 1,
        description: "desc",
        url: "https://video.example.com",
        thumbnail_path: "/thumb.png",
        thumbnail_time: 12,
        length: 100,
        assignee_id: 1,
        created_by: 10,
        position: { type: "first" as const },
      },
      updatePayload: {
        id: 1,
        name: "Video A2",
        category_id: 2,
        description: "desc2",
        url: "https://video.example.com/2",
        thumbnail_path: "/thumb2.png",
        thumbnail_time: 20,
        length: 120,
        assignee_id: 2,
        updated_by: 11,
        position: { type: "after" as const, afterId: 3 },
      },
    },
  ])("register/update: $label", ({ registerFn, updateFn, registerPayload, updatePayload }) => {
    // 主要変数: registerPayload/updatePayload（入力データ）, registerFn/updateFn（対象関数）
    it("register 正常系: 成功時に success=true を返す", async () => {
      calculateDisplayOrderMock.mockResolvedValue(3);
      shiftDisplayOrderMock.mockResolvedValue(undefined);
      reorderItemsInCategoryMock.mockResolvedValue(undefined);

      const insertBuilder = createInsertBuilder({ data: null, error: null });
      const supabase = { from: jest.fn(() => insertBuilder) };
      createClientSupabaseClientMock.mockReturnValue(supabase);

      const response = await (
        registerFn as unknown as (payload: typeof registerPayload) => Promise<unknown>
      )(registerPayload);

      // 登録成功時に success=true が返ることを確認
      expect(response).toEqual({ success: true, error: null });
      // 登録後にカテゴリ内 display_order の再採番が実行されることを確認
      expect(reorderItemsInCategoryMock).toHaveBeenCalledTimes(1);
    });

    it("register 異常系: 失敗時に success=false を返す", async () => {
      const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
      calculateDisplayOrderMock.mockResolvedValue(3);
      shiftDisplayOrderMock.mockResolvedValue(undefined);
      reorderItemsInCategoryMock.mockResolvedValue(undefined);

      const error = { message: "insert failed" };
      const insertBuilder = createInsertBuilder({ data: null, error });
      const supabase = { from: jest.fn(() => insertBuilder) };
      createClientSupabaseClientMock.mockReturnValue(supabase);

      const response = await (
        registerFn as unknown as (payload: typeof registerPayload) => Promise<any>
      )(registerPayload);

      // 登録失敗時に success=false とエラーが返ることを確認
      expect(response).toEqual({ success: false, error });
      // 失敗時は表示順復旧のため対象カテゴリを再採番することを確認
      expect(reorderItemsInCategoryMock).toHaveBeenCalledTimes(1);
      expect(reorderItemsInCategoryMock).toHaveBeenCalledWith(
        expect.any(String),
        registerPayload.category_id
      );
      // 失敗時にエラーログが出力されることを確認
      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore();
    });

    it("update 正常系: カテゴリー変更時は再採番を2回実行する", async () => {
      calculateDisplayOrderMock.mockResolvedValue(4);
      shiftDisplayOrderMock.mockResolvedValue(undefined);
      reorderItemsInCategoryMock.mockResolvedValue(undefined);

      const currentBuilder = createSelectSingleBuilder({
        data: { display_order: 2, category_id: 1 },
        error: null,
      });
      const updateBuilder = createUpdateSelectMaybeSingleBuilder({
        data: { id: 1 },
        error: null,
      });
      const supabase = { from: jest.fn() };
      supabase.from.mockReturnValueOnce(currentBuilder).mockReturnValueOnce(updateBuilder);
      createClientSupabaseClientMock.mockReturnValue(supabase);

      const response = await (
        updateFn as unknown as (payload: typeof updatePayload) => Promise<unknown>
      )(updatePayload);

      // 更新成功時に success=true が返ることを確認
      expect(response).toEqual({ success: true, error: null });
      // カテゴリ移動時に移動元/移動先で再採番が2回行われることを確認
      expect(reorderItemsInCategoryMock).toHaveBeenCalledTimes(2);
    });

    it("update 異常系: 失敗時に success=false を返す", async () => {
      const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
      calculateDisplayOrderMock.mockResolvedValue(4);
      shiftDisplayOrderMock.mockResolvedValue(undefined);
      reorderItemsInCategoryMock.mockResolvedValue(undefined);

      const currentBuilder = createSelectSingleBuilder({
        data: { display_order: 2, category_id: 1 },
        error: null,
      });
      const error = { message: "update failed" };
      const updateBuilder = createUpdateSelectMaybeSingleBuilder({ data: null, error });
      const supabase = { from: jest.fn() };
      supabase.from.mockReturnValueOnce(currentBuilder).mockReturnValueOnce(updateBuilder);
      createClientSupabaseClientMock.mockReturnValue(supabase);

      const response = await (
        updateFn as unknown as (payload: typeof updatePayload) => Promise<unknown>
      )(updatePayload);

      // 更新失敗時に success=false とエラーが返ることを確認
      expect(response).toEqual({ success: false, error });
      // 失敗時は更新先/更新元カテゴリの表示順復旧をベストエフォートで行うことを確認
      expect(reorderItemsInCategoryMock).toHaveBeenCalledTimes(2);
      expect(reorderItemsInCategoryMock).toHaveBeenCalledWith(
        expect.any(String),
        updatePayload.category_id
      );
      expect(reorderItemsInCategoryMock).toHaveBeenCalledWith(expect.any(String), 1);
      // 失敗時にエラーログが出力されることを確認
      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore();
    });

    it("update 異常系: 現在値取得失敗時は早期に success=false を返す", async () => {
      const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
      const currentBuilder = createSelectSingleBuilder({
        data: null,
        error: { message: "fetch failed" },
      });
      const supabase = { from: jest.fn(() => currentBuilder) };
      createClientSupabaseClientMock.mockReturnValue(supabase);

      const response = await (
        updateFn as unknown as (payload: typeof updatePayload) => Promise<any>
      )(updatePayload);

      expect(response.success).toBe(false);
      expect(shiftDisplayOrderMock).not.toHaveBeenCalled();
      expect(reorderItemsInCategoryMock).not.toHaveBeenCalled();
      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore();
    });

    it("update 異常系: 更新件数0件の場合は success=false を返す", async () => {
      const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
      calculateDisplayOrderMock.mockResolvedValue(4);
      shiftDisplayOrderMock.mockResolvedValue(undefined);
      reorderItemsInCategoryMock.mockResolvedValue(undefined);

      const currentBuilder = createSelectSingleBuilder({
        data: { display_order: 2, category_id: 1 },
        error: null,
      });
      const updateBuilder = createUpdateSelectMaybeSingleBuilder({
        data: null,
        error: null,
      });
      const supabase = { from: jest.fn() };
      supabase.from.mockReturnValueOnce(currentBuilder).mockReturnValueOnce(updateBuilder);
      createClientSupabaseClientMock.mockReturnValue(supabase);

      const response = await (
        updateFn as unknown as (payload: typeof updatePayload) => Promise<any>
      )(updatePayload);

      expect(response.success).toBe(false);
      expect(reorderItemsInCategoryMock).toHaveBeenCalled();
      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore();
    });

    it("register 異常系: 再採番で例外発生時は success=false を返す", async () => {
      const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
      calculateDisplayOrderMock.mockResolvedValue(3);
      shiftDisplayOrderMock.mockResolvedValue(undefined);
      reorderItemsInCategoryMock.mockRejectedValue(new Error("reorder failed"));

      const insertBuilder = createInsertBuilder({ data: null, error: null });
      const supabase = { from: jest.fn(() => insertBuilder) };
      createClientSupabaseClientMock.mockReturnValue(supabase);

      const response = await (
        registerFn as unknown as (payload: typeof registerPayload) => Promise<any>
      )(registerPayload);

      expect(response.success).toBe(false);
      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore();
    });

    it("update 異常系: 再採番で例外発生時は success=false を返す", async () => {
      const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
      calculateDisplayOrderMock.mockResolvedValue(4);
      shiftDisplayOrderMock.mockResolvedValue(undefined);
      reorderItemsInCategoryMock
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error("reorder failed"));

      const currentBuilder = createSelectSingleBuilder({
        data: { display_order: 2, category_id: 1 },
        error: null,
      });
      const updateBuilder = createUpdateSelectMaybeSingleBuilder({
        data: { id: 1 },
        error: null,
      });
      const supabase = { from: jest.fn() };
      supabase.from.mockReturnValueOnce(currentBuilder).mockReturnValueOnce(updateBuilder);
      createClientSupabaseClientMock.mockReturnValue(supabase);

      const response = await (
        updateFn as unknown as (payload: typeof updatePayload) => Promise<any>
      )({
        ...updatePayload,
        category_id: 2,
      });

      expect(response.success).toBe(false);
      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore();
    });
  });
});

// users-client 系関数のテスト
describe("users-client", () => {
  const createClientSupabaseClientMock = createClientSupabaseClient as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("addNewUser 正常系: 新規ユーザーを追加できる", async () => {
    const resultData = [{ id: 1 }];
    const builder = createInsertSelectBuilder({ data: resultData, error: null });
    const supabase = { from: jest.fn(() => builder) };
    createClientSupabaseClientMock.mockReturnValue(supabase);

    const response = await addNewUser({
      authId: "auth-1",
      email: "test@example.com",
      displayName: "test",
      avatarUrl: "https://example.com/avatar.png",
    });

    // 追加成功時に挿入結果(data)が返ることを確認
    expect(response).toEqual({ data: resultData, error: null });
  });

  it("addNewUser 異常系: エラー時は data=null を返す", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    const error = { message: "insert failed" };
    const builder = createInsertSelectBuilder({ data: null, error });
    const supabase = { from: jest.fn(() => builder) };
    createClientSupabaseClientMock.mockReturnValue(supabase);

    const response = await addNewUser({
      authId: "auth-2",
      email: "test2@example.com",
      displayName: "test2",
      avatarUrl: "https://example.com/avatar2.png",
    });

    // 追加失敗時に data=null とエラーが返ることを確認
    expect(response).toEqual({ data: null, error });
    // 失敗時にエラーログが出力されることを確認
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("fetchUserRoleById: 正常系/異常系", async () => {
    const successBuilder = createMaybeSingleBuilder({ data: { role: "admin" }, error: null });
    const supabaseSuccess = { from: jest.fn(() => successBuilder) };
    createClientSupabaseClientMock.mockReturnValue(supabaseSuccess);

    const success = await fetchUserRoleById({ authId: "auth-3" });
    // 正常系では role を返し error は null になることを確認
    expect(success).toEqual({ role: "admin", error: null });

    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    const error = { message: "not found" };
    const failedBuilder = createMaybeSingleBuilder({ data: null, error });
    const supabaseFailed = { from: jest.fn(() => failedBuilder) };
    createClientSupabaseClientMock.mockReturnValue(supabaseFailed);

    const failed = await fetchUserRoleById({ authId: "auth-4" });
    // 異常系では role=null とエラーを返すことを確認
    expect(failed).toEqual({ role: null, error });
    // 異常系でエラーログが出力されることを確認
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("fetchUserStatusById: 正常系/異常系", async () => {
    const successBuilder = createMaybeSingleBuilder({ data: { status: "active" }, error: null });
    const supabaseSuccess = { from: jest.fn(() => successBuilder) };
    createClientSupabaseClientMock.mockReturnValue(supabaseSuccess);

    const success = await fetchUserStatusById({ authId: "auth-5" });
    // 正常系では status を返し error は null になることを確認
    expect(success).toEqual({ status: "active", error: null });

    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    const error = { message: "not found" };
    const failedBuilder = createMaybeSingleBuilder({ data: null, error });
    const supabaseFailed = { from: jest.fn(() => failedBuilder) };
    createClientSupabaseClientMock.mockReturnValue(supabaseFailed);

    const failed = await fetchUserStatusById({ authId: "auth-6" });
    // 異常系では status=null とエラーを返すことを確認
    expect(failed).toEqual({ status: null, error });
    // 異常系でエラーログが出力されることを確認
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("fetchUserIdByAuthId: 正常系/異常系", async () => {
    const successBuilder = createSelectSingleBuilder({ data: { id: 42 }, error: null });
    const supabaseSuccess = { from: jest.fn(() => successBuilder) };
    createClientSupabaseClientMock.mockReturnValue(supabaseSuccess);

    const success = await fetchUserIdByAuthId({ authId: "auth-7" });
    // 正常系では userId を返し error は null になることを確認
    expect(success).toEqual({ userId: 42, error: null });

    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    const error = { message: "not found" };
    const failedBuilder = createSelectSingleBuilder({ data: null, error });
    const supabaseFailed = { from: jest.fn(() => failedBuilder) };
    createClientSupabaseClientMock.mockReturnValue(supabaseFailed);

    const failed = await fetchUserIdByAuthId({ authId: "auth-8" });
    // 異常系では userId=null とエラーを返すことを確認
    expect(failed).toEqual({ userId: null, error });
    // 異常系でエラーログが出力されることを確認
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  describe.each([
    { label: "approve", fn: approveUser },
    { label: "reject", fn: rejectUser },
  ])("$label user", ({ fn }) => {
    // 呼び出し関数: approveUser/rejectUser
    it("正常系: エラーなしを返す", async () => {
      const builder = createAwaitableUpdateBuilder({ data: null, error: null });
      const supabase = { from: jest.fn(() => builder) };
      createClientSupabaseClientMock.mockReturnValue(supabase);

      const response = await fn({ userId: 1 });

      // 承認/却下処理が成功した場合は error=null を返すことを確認
      expect(response).toEqual({ error: null });
    });

    it("異常系: エラーを返す", async () => {
      const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
      const error = { message: "failed" };
      const builder = createAwaitableUpdateBuilder({ data: null, error });
      const supabase = { from: jest.fn(() => builder) };
      createClientSupabaseClientMock.mockReturnValue(supabase);

      const response = await fn({ userId: 1 });

      // 承認/却下処理失敗時はエラーを返すことを確認
      expect(response).toEqual({ error });
      // 失敗時にエラーログが出力されることを確認
      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore();
    });
  });
});

// categories-client のテスト
describe("categories-client", () => {
  const createClientSupabaseClientMock = createClientSupabaseClient as jest.Mock;
  const reorderItemsInCategoryMock = reorderItemsInCategory as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("getCategoriesForPosition 正常系: excludeId 指定で一覧を返す", async () => {
    const listBuilder = createGteOrderBuilder({
      data: [{ id: 1, name: "A", display_order: 1 }],
      error: null,
    });
    const supabase = { from: jest.fn(() => listBuilder) };
    createClientSupabaseClientMock.mockReturnValue(supabase);

    const response = await getCategoriesForPosition("documents", 10);

    expect(response).toEqual([{ id: 1, name: "A", display_order: 1 }]);
    expect(listBuilder.neq).toHaveBeenCalledWith("id", 10);
  });

  it("getCategoriesForPosition 異常系: 取得エラー時は空配列を返す", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    const listBuilder = createGteOrderBuilder({
      data: null,
      error: { message: "failed" },
    });
    const supabase = { from: jest.fn(() => listBuilder) };
    createClientSupabaseClientMock.mockReturnValue(supabase);

    const response = await getCategoriesForPosition("documents");

    expect(response).toEqual([]);
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("registerCategory 正常系: 登録成功時に success=true を返す", async () => {
    const maxOrderBuilder = createOrderLimitBuilder({ data: [{ display_order: 3 }], error: null });
    const insertBuilder = createInsertBuilder({ data: null, error: null });
    const reorderSelectBuilder = createOrderBuilder({ data: [], error: null });

    const supabase = { from: jest.fn() };
    supabase.from
      .mockReturnValueOnce(maxOrderBuilder)
      .mockReturnValueOnce(insertBuilder)
      .mockReturnValueOnce(reorderSelectBuilder);
    createClientSupabaseClientMock.mockReturnValue(supabase);

    const response = await registerCategory({
      category_type: "documents",
      name: "カテゴリA",
      description: "desc",
      position: { type: "last" },
    });

    expect(response).toEqual({ success: true, error: null });
  });

  it("registerCategory 異常系: insert 失敗時に success=false を返す", async () => {
    const maxOrderBuilder = createOrderLimitBuilder({ data: [{ display_order: 3 }], error: null });
    const insertError = { message: "insert failed" };
    const insertBuilder = createInsertBuilder({ data: null, error: insertError });

    const supabase = { from: jest.fn() };
    supabase.from.mockReturnValueOnce(maxOrderBuilder).mockReturnValueOnce(insertBuilder);
    createClientSupabaseClientMock.mockReturnValue(supabase);

    const response = await registerCategory({
      category_type: "documents",
      name: "カテゴリA",
      description: "desc",
      position: { type: "last" },
    });

    expect(response).toEqual({ success: false, error: insertError });
  });

  it("registerCategory 異常系: position=last の表示順取得失敗時に success=false を返す", async () => {
    const maxOrderBuilder = createOrderLimitBuilder({
      data: null,
      error: { message: "order failed" },
    });

    const supabase = { from: jest.fn(() => maxOrderBuilder) };
    createClientSupabaseClientMock.mockReturnValue(supabase);

    const response = await registerCategory({
      category_type: "documents",
      name: "カテゴリA",
      description: "desc",
      position: { type: "last" },
    });

    expect(response.success).toBe(false);
  });

  it("registerCategory 正常系: position=first で既存カテゴリーをシフトする", async () => {
    const shiftSelectBuilder = createGteOrderBuilder({
      data: [
        { id: 2, display_order: 2 },
        { id: 1, display_order: 1 },
      ],
      error: null,
    });
    const shiftUpdateBuilder1 = createUpdateBuilder({ data: null, error: null });
    const shiftUpdateBuilder2 = createUpdateBuilder({ data: null, error: null });
    const insertBuilder = createInsertBuilder({ data: null, error: null });
    const reorderSelectBuilder = createOrderBuilder({ data: [{ id: 1 }, { id: 2 }], error: null });
    const reorderUpdateBuilder1 = createUpdateBuilder({ data: null, error: null });
    const reorderUpdateBuilder2 = createUpdateBuilder({ data: null, error: null });

    const supabase = { from: jest.fn() };
    supabase.from
      .mockReturnValueOnce(shiftSelectBuilder)
      .mockReturnValueOnce(shiftUpdateBuilder1)
      .mockReturnValueOnce(shiftUpdateBuilder2)
      .mockReturnValueOnce(insertBuilder)
      .mockReturnValueOnce(reorderSelectBuilder)
      .mockReturnValueOnce(reorderUpdateBuilder1)
      .mockReturnValueOnce(reorderUpdateBuilder2);
    createClientSupabaseClientMock.mockReturnValue(supabase);

    const response = await registerCategory({
      category_type: "documents",
      name: "カテゴリ先頭",
      description: null,
      position: { type: "first" },
    });

    expect(response).toEqual({ success: true, error: null });
    expect(shiftUpdateBuilder1.update).toHaveBeenCalledWith({ display_order: 3 });
    expect(shiftUpdateBuilder2.update).toHaveBeenCalledWith({ display_order: 2 });
    expect(shiftUpdateBuilder1.eq).toHaveBeenCalledWith("id", 2);
    expect(shiftUpdateBuilder2.eq).toHaveBeenCalledWith("id", 1);
  });

  it("updateCategory 正常系: 更新成功時に success=true を返す", async () => {
    const currentBuilder = createSelectSingleBuilder({
      data: { display_order: 2, category_type: "documents" },
      error: null,
    });
    const updateBuilder = createUpdateBuilder({ data: null, error: null });
    const reorderSelectBuilder = createOrderBuilder({ data: [{ id: 1 }, { id: 2 }], error: null });
    const reorderUpdateBuilder1 = createUpdateBuilder({ data: null, error: null });
    const reorderUpdateBuilder2 = createUpdateBuilder({ data: null, error: null });

    const supabase = { from: jest.fn() };
    supabase.from
      .mockReturnValueOnce(currentBuilder)
      .mockReturnValueOnce(updateBuilder)
      .mockReturnValueOnce(reorderSelectBuilder)
      .mockReturnValueOnce(reorderUpdateBuilder1)
      .mockReturnValueOnce(reorderUpdateBuilder2);
    createClientSupabaseClientMock.mockReturnValue(supabase);

    const response = await updateCategory({
      id: 10,
      category_type: "documents",
      name: "カテゴリB",
      description: null,
      position: { type: "current" },
    });

    expect(response).toEqual({ success: true, error: null });
    expect(reorderUpdateBuilder1.update).toHaveBeenCalledWith({ display_order: 1 });
    expect(reorderUpdateBuilder2.update).toHaveBeenCalledWith({ display_order: 2 });
  });

  it("updateCategory 異常系: 現在値取得に失敗したら success=false を返す", async () => {
    const currentBuilder = createSelectSingleBuilder({ data: null, error: { message: "failed" } });
    const supabase = { from: jest.fn(() => currentBuilder) };
    createClientSupabaseClientMock.mockReturnValue(supabase);

    const response = await updateCategory({
      id: 10,
      category_type: "documents",
      name: "カテゴリB",
      description: null,
      position: { type: "current" },
    });

    expect(response.success).toBe(false);
  });

  it("updateCategory 正常系: position=after で対象カテゴリー群をシフトする", async () => {
    const currentBuilder = createSelectSingleBuilder({
      data: { display_order: 3, category_type: "documents" },
      error: null,
    });
    const afterTargetBuilder = createSelectSingleBuilder({
      data: { display_order: 1 },
      error: null,
    });
    const shiftSelectBuilder = createGteOrderBuilder({
      data: [
        { id: 20, display_order: 3 },
        { id: 30, display_order: 2 },
      ],
      error: null,
    });
    const shiftUpdateBuilder1 = createUpdateBuilder({ data: null, error: null });
    const shiftUpdateBuilder2 = createUpdateBuilder({ data: null, error: null });
    const updateBuilder = createUpdateBuilder({ data: null, error: null });
    const reorderSelectBuilder = createOrderBuilder({ data: [{ id: 1 }, { id: 2 }], error: null });
    const reorderUpdateBuilder1 = createUpdateBuilder({ data: null, error: null });
    const reorderUpdateBuilder2 = createUpdateBuilder({ data: null, error: null });

    const supabase = { from: jest.fn() };
    supabase.from
      .mockReturnValueOnce(currentBuilder)
      .mockReturnValueOnce(afterTargetBuilder)
      .mockReturnValueOnce(shiftSelectBuilder)
      .mockReturnValueOnce(shiftUpdateBuilder1)
      .mockReturnValueOnce(shiftUpdateBuilder2)
      .mockReturnValueOnce(updateBuilder)
      .mockReturnValueOnce(reorderSelectBuilder)
      .mockReturnValueOnce(reorderUpdateBuilder1)
      .mockReturnValueOnce(reorderUpdateBuilder2);
    createClientSupabaseClientMock.mockReturnValue(supabase);

    const response = await updateCategory({
      id: 10,
      category_type: "documents",
      name: "カテゴリAfter",
      description: null,
      position: { type: "after", afterId: 5 },
    });

    expect(response).toEqual({ success: true, error: null });
    expect(shiftUpdateBuilder1.update).toHaveBeenCalledWith({ display_order: 4 });
    expect(shiftUpdateBuilder2.update).toHaveBeenCalledWith({ display_order: 3 });
    expect(shiftUpdateBuilder1.eq).toHaveBeenCalledWith("id", 20);
    expect(shiftUpdateBuilder2.eq).toHaveBeenCalledWith("id", 30);
    expect(shiftUpdateBuilder1.update.mock.invocationCallOrder[0]).toBeLessThan(
      shiftUpdateBuilder2.update.mock.invocationCallOrder[0]
    );
  });

  it("updateCategory 正常系: position=first で先頭挿入のため既存カテゴリー群をシフトする", async () => {
    const currentBuilder = createSelectSingleBuilder({
      data: { display_order: 2, category_type: "documents" },
      error: null,
    });
    const shiftSelectBuilder = createGteOrderBuilder({
      data: [
        { id: 20, display_order: 3 },
        { id: 30, display_order: 2 },
      ],
      error: null,
    });
    const shiftUpdateBuilder1 = createUpdateBuilder({ data: null, error: null });
    const shiftUpdateBuilder2 = createUpdateBuilder({ data: null, error: null });
    const updateBuilder = createUpdateBuilder({ data: null, error: null });
    const reorderSelectBuilder = createOrderBuilder({
      data: [{ id: 10 }, { id: 30 }, { id: 20 }],
      error: null,
    });
    const reorderUpdateBuilder1 = createUpdateBuilder({ data: null, error: null });
    const reorderUpdateBuilder2 = createUpdateBuilder({ data: null, error: null });
    const reorderUpdateBuilder3 = createUpdateBuilder({ data: null, error: null });

    const supabase = { from: jest.fn() };
    supabase.from
      .mockReturnValueOnce(currentBuilder)
      .mockReturnValueOnce(shiftSelectBuilder)
      .mockReturnValueOnce(shiftUpdateBuilder1)
      .mockReturnValueOnce(shiftUpdateBuilder2)
      .mockReturnValueOnce(updateBuilder)
      .mockReturnValueOnce(reorderSelectBuilder)
      .mockReturnValueOnce(reorderUpdateBuilder1)
      .mockReturnValueOnce(reorderUpdateBuilder2)
      .mockReturnValueOnce(reorderUpdateBuilder3);
    createClientSupabaseClientMock.mockReturnValue(supabase);

    const response = await updateCategory({
      id: 10,
      category_type: "documents",
      name: "カテゴリ先頭更新",
      description: null,
      position: { type: "first" },
    });

    expect(response).toEqual({ success: true, error: null });
    expect(shiftUpdateBuilder1.update).toHaveBeenCalledWith({ display_order: 4 });
    expect(shiftUpdateBuilder2.update).toHaveBeenCalledWith({ display_order: 3 });
    expect(shiftUpdateBuilder1.eq).toHaveBeenCalledWith("id", 20);
    expect(shiftUpdateBuilder2.eq).toHaveBeenCalledWith("id", 30);
    expect(updateBuilder.update).toHaveBeenCalledWith({
      category_type: "documents",
      name: "カテゴリ先頭更新",
      description: null,
      display_order: 1,
    });
    expect(updateBuilder.eq).toHaveBeenCalledWith("id", 10);
    expect(reorderUpdateBuilder1.update).toHaveBeenCalledWith({ display_order: 1 });
    expect(reorderUpdateBuilder2.update).toHaveBeenCalledWith({ display_order: 2 });
    expect(reorderUpdateBuilder3.update).toHaveBeenCalledWith({ display_order: 3 });
  });

  it("updateCategory 正常系: 種別変更時に元カテゴリーも再採番する", async () => {
    const currentBuilder = createSelectSingleBuilder({
      data: { display_order: 2, category_type: "documents" },
      error: null,
    });
    const updateBuilder = createUpdateBuilder({ data: null, error: null });
    const reorderSelectVideosBuilder = createOrderBuilder({ data: [{ id: 10 }], error: null });
    const reorderUpdateVideosBuilder = createUpdateBuilder({ data: null, error: null });
    const reorderSelectDocumentsBuilder = createOrderBuilder({ data: [{ id: 20 }], error: null });
    const reorderUpdateDocumentsBuilder = createUpdateBuilder({ data: null, error: null });

    const supabase = { from: jest.fn() };
    supabase.from
      .mockReturnValueOnce(currentBuilder)
      .mockReturnValueOnce(updateBuilder)
      .mockReturnValueOnce(reorderSelectVideosBuilder)
      .mockReturnValueOnce(reorderUpdateVideosBuilder)
      .mockReturnValueOnce(reorderSelectDocumentsBuilder)
      .mockReturnValueOnce(reorderUpdateDocumentsBuilder);
    createClientSupabaseClientMock.mockReturnValue(supabase);

    const response = await updateCategory({
      id: 10,
      category_type: "videos",
      name: "カテゴリB",
      description: null,
      position: { type: "current" },
    });

    expect(response).toEqual({ success: true, error: null });
  });

  it("updateCategory 異常系: position=after で挿入先取得失敗時に success=false を返す", async () => {
    const currentBuilder = createSelectSingleBuilder({
      data: { display_order: 3, category_type: "documents" },
      error: null,
    });
    const afterTargetBuilder = createSelectSingleBuilder({
      data: null,
      error: { message: "after target not found" },
    });

    const supabase = { from: jest.fn() };
    supabase.from.mockReturnValueOnce(currentBuilder).mockReturnValueOnce(afterTargetBuilder);
    createClientSupabaseClientMock.mockReturnValue(supabase);

    const response = await updateCategory({
      id: 10,
      category_type: "documents",
      name: "カテゴリAfter",
      description: null,
      position: { type: "after", afterId: 999 },
    });

    expect(response.success).toBe(false);
  });

  it("deleteCategory 正常系: 未分類へ移動後にコンテンツ再採番とカテゴリ再採番を実行する", async () => {
    reorderItemsInCategoryMock.mockResolvedValue(undefined);

    const deletingCategoryBuilder = createSelectSingleBuilder({
      data: { id: 10, name: "一般", category_type: "documents" },
      error: null,
    });
    const uncategorizedBuilder = createSelectSingleBuilder({ data: { id: 1 }, error: null });
    const contentsToMoveBuilder = createAwaitableSelectDoubleEqBuilder({
      data: [{ id: 100 }, { id: 101 }],
      error: null,
    });
    const moveBuilder = createUpdateInEqSelectBuilder({
      data: [{ id: 100 }, { id: 101 }],
      error: null,
    });
    const movedToUncategorizedCheckBuilder = createAwaitableSelectInDoubleEqBuilder({
      data: [{ id: 100 }, { id: 101 }],
      error: null,
    });
    const remainingOriginalCheckBuilder = createAwaitableSelectDoubleEqBuilder({
      data: [],
      error: null,
    });
    const deleteCategoryBuilder = createUpdateBuilder({ data: null, error: null });
    const reorderCategorySelectBuilder = createOrderBuilder({
      data: [{ id: 1 }, { id: 2 }],
      error: null,
    });
    const reorderCategoryUpdateBuilder1 = createUpdateBuilder({ data: null, error: null });
    const reorderCategoryUpdateBuilder2 = createUpdateBuilder({ data: null, error: null });

    const supabase = { from: jest.fn() };
    supabase.from
      .mockReturnValueOnce(deletingCategoryBuilder)
      .mockReturnValueOnce(uncategorizedBuilder)
      .mockReturnValueOnce(contentsToMoveBuilder)
      .mockReturnValueOnce(moveBuilder)
      .mockReturnValueOnce(movedToUncategorizedCheckBuilder)
      .mockReturnValueOnce(remainingOriginalCheckBuilder)
      .mockReturnValueOnce(deleteCategoryBuilder)
      .mockReturnValueOnce(reorderCategorySelectBuilder)
      .mockReturnValueOnce(reorderCategoryUpdateBuilder1)
      .mockReturnValueOnce(reorderCategoryUpdateBuilder2);
    createClientSupabaseClientMock.mockReturnValue(supabase);

    const response = await deleteCategory(10, "documents");

    expect(response).toEqual({ success: true, error: null });
    expect(reorderItemsInCategoryMock).toHaveBeenCalledWith("documents", 1);
    expect(moveBuilder.eq).toHaveBeenNthCalledWith(1, "is_deleted", false);
    expect(moveBuilder.eq).toHaveBeenNthCalledWith(2, "category_id", 10);
    expect(moveBuilder.select).toHaveBeenCalledWith("id");
  });

  it("deleteCategory 正常系: 移動対象がない場合は未分類側の再採番を実行しない", async () => {
    reorderItemsInCategoryMock.mockResolvedValue(undefined);

    const deletingCategoryBuilder = createSelectSingleBuilder({
      data: { id: 10, name: "一般", category_type: "documents" },
      error: null,
    });
    const uncategorizedBuilder = createSelectSingleBuilder({ data: { id: 1 }, error: null });
    const contentsToMoveBuilder = createAwaitableSelectDoubleEqBuilder({
      data: [],
      error: null,
    });
    const deleteCategoryBuilder = createUpdateBuilder({ data: null, error: null });
    const reorderCategorySelectBuilder = createOrderBuilder({
      data: [{ id: 1 }, { id: 2 }],
      error: null,
    });
    const reorderCategoryUpdateBuilder1 = createUpdateBuilder({ data: null, error: null });
    const reorderCategoryUpdateBuilder2 = createUpdateBuilder({ data: null, error: null });

    const supabase = { from: jest.fn() };
    supabase.from
      .mockReturnValueOnce(deletingCategoryBuilder)
      .mockReturnValueOnce(uncategorizedBuilder)
      .mockReturnValueOnce(contentsToMoveBuilder)
      .mockReturnValueOnce(deleteCategoryBuilder)
      .mockReturnValueOnce(reorderCategorySelectBuilder)
      .mockReturnValueOnce(reorderCategoryUpdateBuilder1)
      .mockReturnValueOnce(reorderCategoryUpdateBuilder2);
    createClientSupabaseClientMock.mockReturnValue(supabase);

    const response = await deleteCategory(10, "documents");

    expect(response).toEqual({ success: true, error: null });
    expect(reorderItemsInCategoryMock).not.toHaveBeenCalled();
  });

  it("deleteCategory 異常系: 種別不一致は失敗を返す", async () => {
    const deletingCategoryBuilder = createSelectSingleBuilder({
      data: { id: 10, name: "一般", category_type: "videos" },
      error: null,
    });
    const supabase = { from: jest.fn(() => deletingCategoryBuilder) };
    createClientSupabaseClientMock.mockReturnValue(supabase);

    const response = await deleteCategory(10, "documents");

    expect(response.success).toBe(false);
  });

  it("deleteCategory 異常系: コンテンツ移動失敗時に success=false を返す", async () => {
    const deletingCategoryBuilder = createSelectSingleBuilder({
      data: { id: 10, name: "一般", category_type: "documents" },
      error: null,
    });
    const uncategorizedBuilder = createSelectSingleBuilder({ data: { id: 1 }, error: null });
    const contentsToMoveBuilder = createAwaitableSelectDoubleEqBuilder({
      data: [{ id: 100 }],
      error: null,
    });
    const moveError = { message: "move failed" };
    const moveBuilder = createUpdateInEqSelectBuilder({ data: null, error: moveError });

    const supabase = { from: jest.fn() };
    supabase.from
      .mockReturnValueOnce(deletingCategoryBuilder)
      .mockReturnValueOnce(uncategorizedBuilder)
      .mockReturnValueOnce(contentsToMoveBuilder)
      .mockReturnValueOnce(moveBuilder);
    createClientSupabaseClientMock.mockReturnValue(supabase);

    const response = await deleteCategory(10, "documents");

    expect(response).toEqual({ success: false, error: moveError });
  });

  it("deleteCategory 異常系: コンテンツ再採番で例外発生時に success=false を返す", async () => {
    const reorderError = new Error("reorder failed");
    reorderItemsInCategoryMock
      .mockRejectedValueOnce(reorderError)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined);

    const deletingCategoryBuilder = createSelectSingleBuilder({
      data: { id: 10, name: "一般", category_type: "documents" },
      error: null,
    });
    const uncategorizedBuilder = createSelectSingleBuilder({ data: { id: 1 }, error: null });
    const contentsToMoveBuilder = createAwaitableSelectDoubleEqBuilder({
      data: [{ id: 100 }],
      error: null,
    });
    const moveBuilder = createUpdateInEqSelectBuilder({ data: [{ id: 100 }], error: null });
    const movedToUncategorizedCheckBuilder = createAwaitableSelectInDoubleEqBuilder({
      data: [{ id: 100 }],
      error: null,
    });
    const remainingOriginalCheckBuilder = createAwaitableSelectDoubleEqBuilder({
      data: [],
      error: null,
    });
    const rollbackBuilder = createUpdateInEqBuilder({ data: null, error: null });

    const supabase = { from: jest.fn() };
    supabase.from
      .mockReturnValueOnce(deletingCategoryBuilder)
      .mockReturnValueOnce(uncategorizedBuilder)
      .mockReturnValueOnce(contentsToMoveBuilder)
      .mockReturnValueOnce(moveBuilder)
      .mockReturnValueOnce(movedToUncategorizedCheckBuilder)
      .mockReturnValueOnce(remainingOriginalCheckBuilder)
      .mockReturnValueOnce(rollbackBuilder);
    createClientSupabaseClientMock.mockReturnValue(supabase);

    const response = await deleteCategory(10, "documents");

    expect(response).toEqual({ success: false, error: reorderError });
    expect(moveBuilder.eq).toHaveBeenNthCalledWith(1, "is_deleted", false);
    expect(moveBuilder.eq).toHaveBeenNthCalledWith(2, "category_id", 10);
    expect(rollbackBuilder.eq).toHaveBeenNthCalledWith(1, "is_deleted", false);
    expect(rollbackBuilder.eq).toHaveBeenNthCalledWith(2, "category_id", 1);
    expect(reorderItemsInCategoryMock).toHaveBeenNthCalledWith(1, "documents", 1);
    expect(reorderItemsInCategoryMock).toHaveBeenNthCalledWith(2, "documents", 10);
    expect(reorderItemsInCategoryMock).toHaveBeenNthCalledWith(3, "documents", 1);
  });

  it("deleteCategory 異常系: 未分類カテゴリーの削除は失敗を返す", async () => {
    const deletingCategoryBuilder = createSelectSingleBuilder({
      data: { id: 1, name: "未分類", category_type: "documents" },
      error: null,
    });
    const supabase = { from: jest.fn(() => deletingCategoryBuilder) };
    createClientSupabaseClientMock.mockReturnValue(supabase);

    const response = await deleteCategory(1, "documents");

    expect(response.success).toBe(false);
  });

  it("deleteCategory 異常系: 未分類カテゴリーが見つからない場合は失敗を返す", async () => {
    const deletingCategoryBuilder = createSelectSingleBuilder({
      data: { id: 10, name: "一般", category_type: "documents" },
      error: null,
    });
    const uncategorizedBuilder = createSelectSingleBuilder({
      data: null,
      error: { message: "not found" },
    });

    const supabase = { from: jest.fn() };
    supabase.from
      .mockReturnValueOnce(deletingCategoryBuilder)
      .mockReturnValueOnce(uncategorizedBuilder);
    createClientSupabaseClientMock.mockReturnValue(supabase);

    const response = await deleteCategory(10, "documents");

    expect(response.success).toBe(false);
  });

  it("deleteCategory 異常系: カテゴリー論理削除失敗時に success=false を返す", async () => {
    reorderItemsInCategoryMock.mockResolvedValue(undefined);

    const deletingCategoryBuilder = createSelectSingleBuilder({
      data: { id: 10, name: "一般", category_type: "documents" },
      error: null,
    });
    const uncategorizedBuilder = createSelectSingleBuilder({ data: { id: 1 }, error: null });
    const contentsToMoveBuilder = createAwaitableSelectDoubleEqBuilder({
      data: [{ id: 100 }, { id: 101 }],
      error: null,
    });
    const moveBuilder = createUpdateInEqSelectBuilder({
      data: [{ id: 100 }, { id: 101 }],
      error: null,
    });
    const movedToUncategorizedCheckBuilder = createAwaitableSelectInDoubleEqBuilder({
      data: [{ id: 100 }, { id: 101 }],
      error: null,
    });
    const remainingOriginalCheckBuilder = createAwaitableSelectDoubleEqBuilder({
      data: [],
      error: null,
    });
    const deleteBuilder = createUpdateBuilder({ data: null, error: { message: "delete failed" } });
    const rollbackBuilder = createUpdateInEqBuilder({ data: null, error: null });

    const supabase = { from: jest.fn() };
    supabase.from
      .mockReturnValueOnce(deletingCategoryBuilder)
      .mockReturnValueOnce(uncategorizedBuilder)
      .mockReturnValueOnce(contentsToMoveBuilder)
      .mockReturnValueOnce(moveBuilder)
      .mockReturnValueOnce(movedToUncategorizedCheckBuilder)
      .mockReturnValueOnce(remainingOriginalCheckBuilder)
      .mockReturnValueOnce(deleteBuilder)
      .mockReturnValueOnce(rollbackBuilder);
    createClientSupabaseClientMock.mockReturnValue(supabase);

    const response = await deleteCategory(10, "documents");

    expect(response.success).toBe(false);
    expect(rollbackBuilder.eq).toHaveBeenNthCalledWith(1, "is_deleted", false);
    expect(rollbackBuilder.eq).toHaveBeenNthCalledWith(2, "category_id", 1);
    expect(reorderItemsInCategoryMock).toHaveBeenNthCalledWith(1, "documents", 1);
    expect(reorderItemsInCategoryMock).toHaveBeenNthCalledWith(2, "documents", 10);
    expect(reorderItemsInCategoryMock).toHaveBeenNthCalledWith(3, "documents", 1);
  });

  it("deleteCategory 異常系: 移動後件数不一致時はロールバックして success=false を返す", async () => {
    reorderItemsInCategoryMock.mockResolvedValue(undefined);

    const deletingCategoryBuilder = createSelectSingleBuilder({
      data: { id: 10, name: "一般", category_type: "documents" },
      error: null,
    });
    const uncategorizedBuilder = createSelectSingleBuilder({ data: { id: 1 }, error: null });
    const contentsToMoveBuilder = createAwaitableSelectDoubleEqBuilder({
      data: [{ id: 100 }, { id: 101 }],
      error: null,
    });
    const moveBuilder = createUpdateInEqSelectBuilder({ data: [{ id: 100 }], error: null });
    const movedToUncategorizedCheckBuilder = createAwaitableSelectInDoubleEqBuilder({
      data: [{ id: 100 }],
      error: null,
    });
    const remainingOriginalCheckBuilder = createAwaitableSelectDoubleEqBuilder({
      data: [{ id: 101 }],
      error: null,
    });
    const rollbackBuilder = createUpdateInEqBuilder({ data: null, error: null });

    const supabase = { from: jest.fn() };
    supabase.from
      .mockReturnValueOnce(deletingCategoryBuilder)
      .mockReturnValueOnce(uncategorizedBuilder)
      .mockReturnValueOnce(contentsToMoveBuilder)
      .mockReturnValueOnce(moveBuilder)
      .mockReturnValueOnce(movedToUncategorizedCheckBuilder)
      .mockReturnValueOnce(remainingOriginalCheckBuilder)
      .mockReturnValueOnce(rollbackBuilder);
    createClientSupabaseClientMock.mockReturnValue(supabase);

    const response = await deleteCategory(10, "documents");

    expect(response.success).toBe(false);
    expect(rollbackBuilder.eq).toHaveBeenNthCalledWith(1, "is_deleted", false);
    expect(rollbackBuilder.eq).toHaveBeenNthCalledWith(2, "category_id", 1);
    expect(reorderItemsInCategoryMock).toHaveBeenNthCalledWith(1, "documents", 10);
    expect(reorderItemsInCategoryMock).toHaveBeenNthCalledWith(2, "documents", 1);
  });

  it("deleteCategory 異常系: 復旧再採番失敗時はID順フォールバック再採番を実行する", async () => {
    const reorderError = new Error("reorder failed");
    reorderItemsInCategoryMock
      .mockRejectedValueOnce(reorderError)
      .mockRejectedValueOnce(new Error("recover original failed"))
      .mockResolvedValueOnce(undefined);

    const deletingCategoryBuilder = createSelectSingleBuilder({
      data: { id: 10, name: "一般", category_type: "documents" },
      error: null,
    });
    const uncategorizedBuilder = createSelectSingleBuilder({ data: { id: 1 }, error: null });
    const contentsToMoveBuilder = createAwaitableSelectDoubleEqBuilder({
      data: [{ id: 100 }],
      error: null,
    });
    const moveBuilder = createUpdateInEqSelectBuilder({ data: [{ id: 100 }], error: null });
    const movedToUncategorizedCheckBuilder = createAwaitableSelectInDoubleEqBuilder({
      data: [{ id: 100 }],
      error: null,
    });
    const remainingOriginalCheckBuilder = createAwaitableSelectDoubleEqBuilder({
      data: [],
      error: null,
    });
    const rollbackBuilder = createUpdateInEqBuilder({ data: null, error: null });

    const fallbackSelectOriginalBuilder = createOrderBuilder({ data: [{ id: 100 }], error: null });
    const fallbackUpdateOriginalBuilder = createUpdateBuilder({ data: null, error: null });

    const supabase = { from: jest.fn() };
    supabase.from
      .mockReturnValueOnce(deletingCategoryBuilder)
      .mockReturnValueOnce(uncategorizedBuilder)
      .mockReturnValueOnce(contentsToMoveBuilder)
      .mockReturnValueOnce(moveBuilder)
      .mockReturnValueOnce(movedToUncategorizedCheckBuilder)
      .mockReturnValueOnce(remainingOriginalCheckBuilder)
      .mockReturnValueOnce(rollbackBuilder)
      .mockReturnValueOnce(fallbackSelectOriginalBuilder)
      .mockReturnValueOnce(fallbackUpdateOriginalBuilder);
    createClientSupabaseClientMock.mockReturnValue(supabase);

    const response = await deleteCategory(10, "documents");

    expect(response).toEqual({ success: false, error: reorderError });
    expect(fallbackSelectOriginalBuilder.order).toHaveBeenCalledWith("id", { ascending: true });
    expect(fallbackUpdateOriginalBuilder.update).toHaveBeenCalledWith({ display_order: 1 });
    expect(fallbackUpdateOriginalBuilder.eq).toHaveBeenCalledWith("id", 100);
    expect(reorderItemsInCategoryMock).toHaveBeenNthCalledWith(1, "documents", 1);
    expect(reorderItemsInCategoryMock).toHaveBeenNthCalledWith(2, "documents", 10);
    expect(reorderItemsInCategoryMock).toHaveBeenNthCalledWith(3, "documents", 1);
  });
});
