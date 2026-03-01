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
import { deleteVideo, getVideosByCategory, registerVideo, updateVideo } from "../../../app/services/api/videos-client";
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

// select(...).eq(...).single() で完結するクエリ用モック
const createSelectSingleBuilder = (result: QueryResult) => {
  const builder: { select?: jest.Mock; eq?: jest.Mock; single?: jest.Mock } = {};
  builder.select = jest.fn(() => builder);
  builder.eq = jest.fn(() => builder);
  builder.single = jest.fn(() => Promise.resolve(result));
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
  builder.then = (resolve) => Promise.resolve(result).then(resolve);
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
    expect(createBrowserClientMock).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "anon-key"
    );
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
        assignee: "owner",
        created_by: 10,
        position: { type: "first" as const },
      },
      updatePayload: {
        id: 1,
        name: "Doc A2",
        category_id: 2,
        description: "desc2",
        url: "https://doc.example.com/2",
        assignee: "owner2",
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
        assignee: "owner",
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
        assignee: "owner2",
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

      const response = await (registerFn as (payload: typeof registerPayload) => Promise<unknown>)(
        registerPayload
      );

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

      const response = await (registerFn as (payload: typeof registerPayload) => Promise<unknown>)(
        registerPayload
      );

      // 登録失敗時に success=false とエラーが返ることを確認
      expect(response).toEqual({ success: false, error });
      // 失敗時は再採番を行わないことを確認
      expect(reorderItemsInCategoryMock).not.toHaveBeenCalled();
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
      const updateBuilder = createUpdateBuilder({ data: null, error: null });
      const supabase = { from: jest.fn() };
      supabase.from.mockReturnValueOnce(currentBuilder).mockReturnValueOnce(updateBuilder);
      createClientSupabaseClientMock.mockReturnValue(supabase);

      const response = await (updateFn as (payload: typeof updatePayload) => Promise<unknown>)(
        updatePayload
      );

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
      const updateBuilder = createUpdateBuilder({ data: null, error });
      const supabase = { from: jest.fn() };
      supabase.from.mockReturnValueOnce(currentBuilder).mockReturnValueOnce(updateBuilder);
      createClientSupabaseClientMock.mockReturnValue(supabase);

      const response = await (updateFn as (payload: typeof updatePayload) => Promise<unknown>)(
        updatePayload
      );

      // 更新失敗時に success=false とエラーが返ることを確認
      expect(response).toEqual({ success: false, error });
      // 失敗時は再採番を実行しないことを確認
      expect(reorderItemsInCategoryMock).not.toHaveBeenCalled();
      // 失敗時にエラーログが出力されることを確認
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
