import { mutateMasterRecordAction } from "@/app/services/api/master-actions";
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
  deleteCategory,
  registerCategory,
  updateCategory,
} from "../../../app/services/api/categories-client";
import {
  deleteVideo,
  getVideosByCategory,
  registerVideo,
  updateVideo,
} from "../../../app/services/api/videos-client";
import {
  addNewUser,
  approveUser,
  fetchUserIdByAuthId,
  fetchUserRoleById,
  fetchUserStatusById,
  rejectUser,
} from "../../../app/services/api/users-client";
import { getItemsByCategory } from "../../../app/services/api/utils/display-order";

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

jest.mock("@/app/services/api/master-actions", () => ({ mutateMasterRecordAction: jest.fn() }));

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
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "publishable-key";
    const mockClient = { from: jest.fn() };
    createBrowserClientMock.mockReturnValue(mockClient);

    const response = supabaseClientActual.createClientSupabaseClient();

    // createBrowserClient が環境変数の URL / Publishable key で呼ばれることを確認
    expect(createBrowserClientMock).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "publishable-key"
    );
    // ラッパー関数の戻り値として生成クライアントが返ることを確認
    expect(response).toBe(mockClient);
  });
});

// application/document/video の共通 CRUD テスト
describe("content client services", () => {
  beforeEach(() => jest.clearAllMocks());

  it.each([
    ["documents", getDocumentsByCategory],
    ["videos", getVideosByCategory],
    ["applications", getApplicationsByCategory],
  ] as const)("keeps %s category reads client-side", async (table, execute) => {
    const items = [{ id: 1, name: "Item", display_order: 1 }];
    (getItemsByCategory as jest.Mock).mockResolvedValue(items);
    expect(await execute(10, 2)).toEqual(items);
    expect(getItemsByCategory).toHaveBeenCalledWith(table, 10, 2);
  });

  it.each([
    ["documents", deleteDocument],
    ["videos", deleteVideo],
    ["applications", deleteApplication],
  ] as const)("delegates %s deletion without client audit IDs", async (table, execute) => {
    const action = mutateMasterRecordAction as jest.Mock;
    action.mockResolvedValue({ success: true, error: null });
    expect(await execute(7, 999)).toEqual({ success: true, error: null });
    expect(action).toHaveBeenCalledWith({ table, operation: "delete", id: 7 });
    const failure = { success: false, error: { message: "Rejected" } };
    action.mockResolvedValue(failure);
    expect(await execute(7, 999)).toEqual(failure);
  });

  it("delegates all content forms with placement and editable fields only", async () => {
    const action = mutateMasterRecordAction as jest.Mock;
    action.mockResolvedValue({ success: true, error: null });
    const content = {
      name: "Content",
      description: "Description",
      url: "https://example.com",
      category_id: 1,
      position: { type: "first" as const },
    };
    await registerDocument({ ...content, assignee_id: null, created_by: 999 });
    await updateDocument({ ...content, assignee_id: null, id: 7, updated_by: 999 });
    await registerVideo({
      ...content,
      assignee_id: null,
      created_by: 999,
      thumbnail_path: null,
      thumbnail_time: null,
      length: null,
    });
    await updateVideo({
      ...content,
      assignee_id: null,
      id: 7,
      updated_by: 999,
      thumbnail_path: null,
      thumbnail_time: null,
      length: null,
    });
    await registerApplication({
      ...content,
      developer_id: null,
      thumbnail_path: "app-thumb.png",
      created_by: 999,
    });
    await updateApplication({
      ...content,
      developer_id: null,
      thumbnail_path: "app-thumb.png",
      id: 7,
      updated_by: 999,
    });
    expect(action).toHaveBeenCalledTimes(6);
    expect(action.mock.calls[4][0].fields.thumbnail_path).toBe("app-thumb.png");
    expect(action.mock.calls[5][0].fields.thumbnail_path).toBe("app-thumb.png");
    for (const [input] of action.mock.calls) {
      expect(input.position).toEqual(content.position);
      expect(input.fields.name).toBe("Content");
      expect(input.fields).not.toHaveProperty("created_by");
      expect(input.fields).not.toHaveProperty("updated_by");
    }
  });
});

describe("categories-client", () => {
  beforeEach(() => jest.clearAllMocks());
  it("delegates edits and deletes with confirmation tokens", async () => {
    const action = mutateMasterRecordAction as jest.Mock;
    const failure = {
      success: false,
      error: { message: "Confirmation required" },
      confirmation: { token: "new", contents: [] },
    };
    action.mockResolvedValue(failure);
    const fields = { category_type: "documents" as const, name: "Category", description: null };
    const position = { type: "last" as const };
    expect(await registerCategory({ ...fields, position })).toEqual(failure);
    expect(await updateCategory({ ...fields, position, id: 7 }, "confirmed")).toEqual(failure);
    expect(action).toHaveBeenLastCalledWith({
      table: "categories",
      operation: "update",
      fields,
      position,
      id: 7,
      confirmationToken: "confirmed",
    });
    expect(await deleteCategory(7, "documents", "confirmed")).toEqual(failure);
    expect(action).toHaveBeenLastCalledWith({
      table: "categories",
      operation: "delete",
      id: 7,
      confirmationToken: "confirmed",
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
