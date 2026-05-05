import { createBrowserClient } from "@supabase/ssr";
import { createClientSupabaseClient } from "../../../app/services/api/supabase-client";
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
 * スクリプト概要:
 * このテストファイルは、クライアント側 API 層（`app/services/api/*-client.ts`）の
 * Supabase 呼び出しと戻り値ハンドリングを検証する。
 *
 * 主な目的:
 * - 正常系: 期待する戻り値（success/data/error）が返ること
 * - 異常系: 失敗時にエラーを返し、必要なログ・ロールバック分岐が動作すること
 * - 副作用: 表示順再採番などの補助処理が必要条件でのみ呼ばれること
 *
 * 主な定義:
 * - `QueryResult`: Supabase クエリモックの戻り値型（`data` / `error`）
 * - `ORIGINAL_ENV`: テスト前後で process.env を復元するための退避値
 * - `create*Builder`: Supabase のメソッドチェーンを模擬するビルダー群
 *
 * 処理ステップ（このテストスクリプト全体）:
 * - Step 1: 対象モジュールを import し、Supabase クライアント生成関数を jest.mock で差し替える
 * - Step 2: create*Builder 群でメソッドチェーンのモックを構築する
 * - Step 3: API 関数を実行し、戻り値（success/data/error）と副作用（再採番・ログ）を検証する
 */
// supabaseClientActual: モック化されたモジュールと分離して本体実装を直接検証するための参照。
const supabaseClientActual = jest.requireActual(
  "../../../app/services/api/supabase-client"
) as typeof import("../../../app/services/api/supabase-client");

// Supabase クエリ戻り値の共通型
type QueryResult = { data: unknown; error: unknown };

// ORIGINAL_ENV: createClientSupabaseClient 単体テストで環境変数を改変した後に戻すための退避値。
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
  builder.then = resolve => Promise.resolve(result).then(resolve);
  return builder as Required<typeof builder>;
};

// select(...).eq(...).order(...).limit(...) で終端するクエリ用モック
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

// select(...).eq(...).order(...) で終端するクエリ用モック
const createOrderBuilder = (result: QueryResult) => {
  const builder: { select?: jest.Mock; eq?: jest.Mock; order?: jest.Mock } = {};
  builder.select = jest.fn(() => builder);
  builder.eq = jest.fn(() => builder);
  builder.order = jest.fn(() => Promise.resolve(result));
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
  builder.update = jest.fn(() => builder);
  builder.in = jest.fn(() => builder);
  builder.eq = jest.fn(() => builder);
  builder.select = jest.fn(() => Promise.resolve(result));
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
    // Step 1: 環境変数と createBrowserClient の戻り値モックを準備する。
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
    const mockClient = { from: jest.fn() };
    createBrowserClientMock.mockReturnValue(mockClient);

    // Step 2: 対象関数を実行する。
    const response = supabaseClientActual.createClientSupabaseClient();

    // Step 3: 呼び出し引数（URL/KEY）と戻り値を検証する。
    // createBrowserClient が環境変数の URL / ANON KEY で呼ばれることを確認
    expect(createBrowserClientMock).toHaveBeenCalledWith("https://example.supabase.co", "anon-key");
    // ラッパー関数の戻り値として生成クライアントが返ることを確認
    expect(response).toBe(mockClient);
  });
});

// application/document/video の共通 CRUD テスト
describe("content client services", () => {
  // createClientSupabaseClientMock: 各 API 関数で利用する Supabase クライアント生成を差し替えるモック。
  const createClientSupabaseClientMock = createClientSupabaseClient as jest.Mock;
  // 下記4つは display-order ユーティリティ呼び出し有無を検証するためのモック参照。
  const getItemsByCategoryMock = getItemsByCategory as jest.Mock;
  const calculateDisplayOrderMock = calculateDisplayOrder as jest.Mock;
  const shiftDisplayOrderMock = shiftDisplayOrder as jest.Mock;
  const reorderItemsInCategoryMock = reorderItemsInCategory as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getByCategory: document", () => {
    it("正常系: カテゴリー内アイテム一覧を取得できる", async () => {
      // Step 1: 一覧取得のモック戻り値を準備する。
      const items = [{ id: 1, name: "item", display_order: 1 }];
      getItemsByCategoryMock.mockResolvedValue(items);

      // Step 2: document 取得関数を実行する。
      const response = await getDocumentsByCategory(10, 2);

      // Step 3: 戻り値と依存関数呼び出し回数を検証する。
      expect(response).toEqual(items);
      expect(getItemsByCategoryMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("delete: document", () => {
    it("正常系: 論理削除に成功する", async () => {
      // Step 1: update -> eq の成功モックを準備する。
      const builder = createUpdateBuilder({ data: null, error: null });
      const supabase = { from: jest.fn(() => builder) };
      createClientSupabaseClientMock.mockReturnValue(supabase);

      // Step 2: document 削除関数を実行する。
      const response = await deleteDocument(1, 10);

      // Step 3: 成功レスポンスを検証する。
      expect(response).toEqual({ success: true, error: null });
    });

    it("異常系: エラー時は失敗を返す", async () => {
      // Step 1: 失敗モックと console.error スパイを準備する。
      const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
      const error = { message: "failed" };
      const builder = createUpdateBuilder({ data: null, error });
      const supabase = { from: jest.fn(() => builder) };
      createClientSupabaseClientMock.mockReturnValue(supabase);

      // Step 2: document 削除関数を実行する。
      const response = await deleteDocument(2, 11);

      // Step 3: 失敗レスポンスとログ出力を検証する。
      expect(response).toEqual({ success: false, error });
      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore();
    });
  });

  describe("register/update: document", () => {
    const registerPayload = {
      name: "Doc A",
      category_id: 1,
      description: "desc",
      url: "https://doc.example.com",
      assignee_id: 1,
      created_by: 10,
      position: { type: "first" as const },
    };
    const updatePayload = {
      id: 1,
      name: "Doc A2",
      category_id: 2,
      description: "desc2",
      url: "https://doc.example.com/2",
      assignee_id: 2,
      updated_by: 11,
      position: { type: "after" as const, afterId: 3 },
    };

    it("register 正常系: 成功時に success=true を返す", async () => {
      // Step 1: 表示順計算/シフト/再採番と insert 成功モックを準備する。
      calculateDisplayOrderMock.mockResolvedValue(3);
      shiftDisplayOrderMock.mockResolvedValue(undefined);
      reorderItemsInCategoryMock.mockResolvedValue(undefined);

      const insertBuilder = createInsertBuilder({ data: null, error: null });
      const supabase = { from: jest.fn(() => insertBuilder) };
      createClientSupabaseClientMock.mockReturnValue(supabase);

      // Step 2: register 関数を実行する。
      const response = await registerDocument(registerPayload);

      // Step 3: 戻り値と再採番呼び出し回数を検証する。
      expect(response).toEqual({ success: true, error: null });
      expect(reorderItemsInCategoryMock).toHaveBeenCalledTimes(1);
    });

    it("register 異常系: 失敗時に success=false を返す", async () => {
      // Step 1: insert 失敗モックと console.error スパイを準備する。
      const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
      calculateDisplayOrderMock.mockResolvedValue(3);
      shiftDisplayOrderMock.mockResolvedValue(undefined);
      reorderItemsInCategoryMock.mockResolvedValue(undefined);

      const error = { message: "insert failed" };
      const insertBuilder = createInsertBuilder({ data: null, error });
      const supabase = { from: jest.fn(() => insertBuilder) };
      createClientSupabaseClientMock.mockReturnValue(supabase);

      // Step 2: register 関数を実行する。
      const response = await registerDocument(registerPayload);

      // Step 3: 失敗時の戻り値・再採番抑止・ログ出力を検証する。
      expect(response).toEqual({ success: false, error });
      expect(reorderItemsInCategoryMock).not.toHaveBeenCalled();
      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore();
    });

    it("register 異常系: 再採番例外時も success=false を返す", async () => {
      // Step 1: insert は成功し、再採番で例外が発生するモックを準備する。
      calculateDisplayOrderMock.mockResolvedValue(3);
      shiftDisplayOrderMock.mockResolvedValue(undefined);
      reorderItemsInCategoryMock.mockRejectedValueOnce(new Error("reorder failed"));

      const insertBuilder = createInsertBuilder({ data: null, error: null });
      const supabase = { from: jest.fn(() => insertBuilder) };
      createClientSupabaseClientMock.mockReturnValue(supabase);

      // Step 2: register 関数を実行する。
      const response = await registerDocument(registerPayload);

      // Step 3: 例外で落ちずに失敗レスポンスへ正規化されることを検証する。
      expect(response.success).toBe(false);
      expect(response.error).toBeInstanceOf(Error);
      expect((response.error as Error).message).toContain("reorder failed");
    });

    it("update 正常系: カテゴリー変更時は再採番を2回実行する", async () => {
      // Step 1: current 取得・更新成功・再採番系のモックを準備する。
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

      // Step 2: update 関数を実行する。
      const response = await updateDocument(updatePayload);

      // Step 3: 成功レスポンスと再採番回数（移動元/移動先）を検証する。
      expect(response).toEqual({ success: true, error: null });
      expect(reorderItemsInCategoryMock).toHaveBeenCalledTimes(2);
    });

    it("update 異常系: 失敗時に success=false を返す", async () => {
      // Step 1: 更新失敗モックと console.error スパイを準備する。
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

      // Step 2: update 関数を実行する。
      const response = await updateDocument(updatePayload);

      // Step 3: 失敗時の戻り値・再採番抑止・ログ出力を検証する。
      expect(response).toEqual({ success: false, error });
      expect(reorderItemsInCategoryMock).not.toHaveBeenCalled();
      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore();
    });

    it("update 異常系: 再採番例外時も success=false を返す", async () => {
      // Step 1: update は成功し、再採番で例外が発生するモックを準備する。
      calculateDisplayOrderMock.mockResolvedValue(4);
      shiftDisplayOrderMock.mockResolvedValue(undefined);
      reorderItemsInCategoryMock.mockRejectedValueOnce(new Error("reorder failed"));

      const currentBuilder = createSelectSingleBuilder({
        data: { display_order: 2, category_id: 1 },
        error: null,
      });
      const updateBuilder = createUpdateBuilder({ data: null, error: null });
      const supabase = { from: jest.fn() };
      supabase.from.mockReturnValueOnce(currentBuilder).mockReturnValueOnce(updateBuilder);
      createClientSupabaseClientMock.mockReturnValue(supabase);

      // Step 2: update 関数を実行する。
      const response = await updateDocument(updatePayload);

      // Step 3: 例外で落ちずに失敗レスポンスへ正規化されることを検証する。
      expect(response.success).toBe(false);
      expect(response.error).toBeInstanceOf(Error);
      expect((response.error as Error).message).toContain("reorder failed");
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
    // Step 1: insert->select 成功モックを準備する。
    const resultData = [{ id: 1 }];
    const builder = createInsertSelectBuilder({ data: resultData, error: null });
    const supabase = { from: jest.fn(() => builder) };
    createClientSupabaseClientMock.mockReturnValue(supabase);

    // Step 2: addNewUser を実行する。
    const response = await addNewUser({
      authId: "auth-1",
      email: "test@example.com",
      displayName: "test",
      avatarUrl: "https://example.com/avatar.png",
    });

    // Step 3: 戻り値が期待どおりか検証する。
    // 追加成功時に挿入結果(data)が返ることを確認
    expect(response).toEqual({ data: resultData, error: null });
  });

  it("addNewUser 異常系: エラー時は data=null を返す", async () => {
    // Step 1: 失敗モックと console.error スパイを準備する。
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    const error = { message: "insert failed" };
    const builder = createInsertSelectBuilder({ data: null, error });
    const supabase = { from: jest.fn(() => builder) };
    createClientSupabaseClientMock.mockReturnValue(supabase);

    // Step 2: addNewUser を実行する。
    const response = await addNewUser({
      authId: "auth-2",
      email: "test2@example.com",
      displayName: "test2",
      avatarUrl: "https://example.com/avatar2.png",
    });

    // Step 3: 失敗時の戻り値とログ出力を検証する。
    // 追加失敗時に data=null とエラーが返ることを確認
    expect(response).toEqual({ data: null, error });
    // 失敗時にエラーログが出力されることを確認
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("fetchUserRoleById: 正常系/異常系", async () => {
    // Step 1: 正常系モックで実行し、期待値を検証する。
    const successBuilder = createMaybeSingleBuilder({ data: { role: "admin" }, error: null });
    const supabaseSuccess = { from: jest.fn(() => successBuilder) };
    createClientSupabaseClientMock.mockReturnValue(supabaseSuccess);

    const success = await fetchUserRoleById({ authId: "auth-3" });
    // 正常系では role を返し error は null になることを確認
    expect(success).toEqual({ role: "admin", error: null });

    // Step 2: 異常系モックに切り替えて実行する。
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    const error = { message: "not found" };
    const failedBuilder = createMaybeSingleBuilder({ data: null, error });
    const supabaseFailed = { from: jest.fn(() => failedBuilder) };
    createClientSupabaseClientMock.mockReturnValue(supabaseFailed);

    const failed = await fetchUserRoleById({ authId: "auth-4" });
    // Step 3: 異常系の戻り値とログ出力を検証する。
    // 異常系では role=null とエラーを返すことを確認
    expect(failed).toEqual({ role: null, error });
    // 異常系でエラーログが出力されることを確認
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("fetchUserStatusById: 正常系/異常系", async () => {
    // Step 1: 正常系モックで実行し、status 取得を確認する。
    const successBuilder = createMaybeSingleBuilder({ data: { status: "active" }, error: null });
    const supabaseSuccess = { from: jest.fn(() => successBuilder) };
    createClientSupabaseClientMock.mockReturnValue(supabaseSuccess);

    const success = await fetchUserStatusById({ authId: "auth-5" });
    // 正常系では status を返し error は null になることを確認
    expect(success).toEqual({ status: "active", error: null });

    // Step 2: 異常系モックに切り替えて実行する。
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    const error = { message: "not found" };
    const failedBuilder = createMaybeSingleBuilder({ data: null, error });
    const supabaseFailed = { from: jest.fn(() => failedBuilder) };
    createClientSupabaseClientMock.mockReturnValue(supabaseFailed);

    const failed = await fetchUserStatusById({ authId: "auth-6" });
    // Step 3: 異常系の戻り値とログ出力を検証する。
    // 異常系では status=null とエラーを返すことを確認
    expect(failed).toEqual({ status: null, error });
    // 異常系でエラーログが出力されることを確認
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("fetchUserIdByAuthId: 正常系/異常系", async () => {
    // Step 1: 正常系モックで実行し、userId 取得を確認する。
    const successBuilder = createSelectSingleBuilder({ data: { id: 42 }, error: null });
    const supabaseSuccess = { from: jest.fn(() => successBuilder) };
    createClientSupabaseClientMock.mockReturnValue(supabaseSuccess);

    const success = await fetchUserIdByAuthId({ authId: "auth-7" });
    // 正常系では userId を返し error は null になることを確認
    expect(success).toEqual({ userId: 42, error: null });

    // Step 2: 異常系モックに切り替えて実行する。
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    const error = { message: "not found" };
    const failedBuilder = createSelectSingleBuilder({ data: null, error });
    const supabaseFailed = { from: jest.fn(() => failedBuilder) };
    createClientSupabaseClientMock.mockReturnValue(supabaseFailed);

    const failed = await fetchUserIdByAuthId({ authId: "auth-8" });
    // Step 3: 異常系の戻り値とログ出力を検証する。
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
      // Step 1: 承認/却下成功モックを準備する。
      const builder = createAwaitableUpdateBuilder({ data: null, error: null });
      const supabase = { from: jest.fn(() => builder) };
      createClientSupabaseClientMock.mockReturnValue(supabase);

      // Step 2: 対象関数を実行する。
      const response = await fn({ userId: 1 });

      // Step 3: 成功レスポンスを検証する。
      // 承認/却下処理が成功した場合は error=null を返すことを確認
      expect(response).toEqual({ error: null });
    });

    it("異常系: エラーを返す", async () => {
      // Step 1: 失敗モックと console.error スパイを準備する。
      const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
      const error = { message: "failed" };
      const builder = createAwaitableUpdateBuilder({ data: null, error });
      const supabase = { from: jest.fn(() => builder) };
      createClientSupabaseClientMock.mockReturnValue(supabase);

      // Step 2: 対象関数を実行する。
      const response = await fn({ userId: 1 });

      // Step 3: 失敗レスポンスとログ出力を検証する。
      // 承認/却下処理失敗時はエラーを返すことを確認
      expect(response).toEqual({ error });
      // 失敗時にエラーログが出力されることを確認
      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore();
    });
  });
});

describe("categories-client", () => {
  // categories-client の戻り値だけでなく、再採番呼び出し有無もあわせて検証する。
  const createClientSupabaseClientMock = createClientSupabaseClient as jest.Mock;
  const reorderItemsInCategoryMock = reorderItemsInCategory as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("registerCategory 正常系: 登録成功時に success=true を返す", async () => {
    // Step 1: 最大表示順取得・insert・再採番のモックを準備する。
    const maxOrderBuilder = createOrderLimitBuilder({ data: [{ display_order: 3 }], error: null });
    const insertBuilder = createInsertBuilder({ data: null, error: null });
    const reorderSelectBuilder = createOrderBuilder({ data: [], error: null });

    const supabase = { from: jest.fn() };
    supabase.from
      .mockReturnValueOnce(maxOrderBuilder)
      .mockReturnValueOnce(insertBuilder)
      .mockReturnValueOnce(reorderSelectBuilder);
    createClientSupabaseClientMock.mockReturnValue(supabase);

    // Step 2: registerCategory を実行する。
    const response = await registerCategory({
      category_type: "documents",
      name: "カテゴリA",
      description: "desc",
      position: { type: "last" },
    });

    // Step 3: 成功レスポンスを検証する。
    expect(response).toEqual({ success: true, error: null });
    // 再採番の呼び出し有無を明示検証: register 成功時は categories の再採番が実行される。
    expect(reorderSelectBuilder.order).toHaveBeenCalledTimes(1);
  });

  it("registerCategory 正常系: first 指定時はシフト後に登録して再採番する", async () => {
    // Step 1: シフト対象を複数件にした first 配置の成功モックを準備する。
    const shiftBuilder = createGteOrderBuilder({
      data: [
        { id: 2, display_order: 5 },
        { id: 1, display_order: 4 },
      ],
      error: null,
    });
    const shiftUpdateBuilder1 = createUpdateBuilder({ data: null, error: null });
    const shiftUpdateBuilder2 = createUpdateBuilder({ data: null, error: null });
    const insertBuilder = createInsertBuilder({ data: null, error: null });
    const reorderSelectBuilder = createOrderBuilder({
      data: [{ id: 1 }, { id: 2 }],
      error: null,
    });
    const reorderUpdateBuilder1 = createUpdateBuilder({ data: null, error: null });
    const reorderUpdateBuilder2 = createUpdateBuilder({ data: null, error: null });

    const supabase = { from: jest.fn() };
    supabase.from
      .mockReturnValueOnce(shiftBuilder)
      .mockReturnValueOnce(shiftUpdateBuilder1)
      .mockReturnValueOnce(shiftUpdateBuilder2)
      .mockReturnValueOnce(insertBuilder)
      .mockReturnValueOnce(reorderSelectBuilder)
      .mockReturnValueOnce(reorderUpdateBuilder1)
      .mockReturnValueOnce(reorderUpdateBuilder2);
    createClientSupabaseClientMock.mockReturnValue(supabase);

    // Step 2: registerCategory を実行する。
    const response = await registerCategory({
      category_type: "documents",
      name: "カテゴリA",
      description: "desc",
      position: { type: "first" },
    });

    // Step 3: 成功レスポンスとシフト更新内容を検証する。
    expect(response).toEqual({ success: true, error: null });
    expect(shiftUpdateBuilder1.update).toHaveBeenCalledWith({ display_order: 6 });
    expect(shiftUpdateBuilder1.eq).toHaveBeenCalledWith("id", 2);
    expect(shiftUpdateBuilder2.update).toHaveBeenCalledWith({ display_order: 5 });
    expect(shiftUpdateBuilder2.eq).toHaveBeenCalledWith("id", 1);
    expect(supabase.from).toHaveBeenNthCalledWith(1, "categories");
    expect(supabase.from).toHaveBeenNthCalledWith(2, "categories");
    expect(supabase.from).toHaveBeenNthCalledWith(3, "categories");
    expect(reorderSelectBuilder.order).toHaveBeenCalledTimes(1);
  });

  it("registerCategory 異常系: シフト対象が複数件でも逐次更新後に登録失敗時は再採番を試行する", async () => {
    // Step 1: first 配置のシフト対象を複数件にして、insert 失敗になるモックを準備する。
    const shiftBuilder = createGteOrderBuilder({
      data: [
        { id: 2, display_order: 5 },
        { id: 1, display_order: 4 },
      ],
      error: null,
    });
    const shiftUpdateBuilder1 = createUpdateBuilder({ data: null, error: null });
    const shiftUpdateBuilder2 = createUpdateBuilder({ data: null, error: null });
    const insertError = { message: "insert failed" };
    const insertBuilder = createInsertBuilder({ data: null, error: insertError });
    const reorderSelectBuilder = createOrderBuilder({ data: [], error: null });

    const supabase = { from: jest.fn() };
    supabase.from
      .mockReturnValueOnce(shiftBuilder)
      .mockReturnValueOnce(shiftUpdateBuilder1)
      .mockReturnValueOnce(shiftUpdateBuilder2)
      .mockReturnValueOnce(insertBuilder)
      .mockReturnValueOnce(reorderSelectBuilder);
    createClientSupabaseClientMock.mockReturnValue(supabase);

    // Step 2: registerCategory を実行する。
    const response = await registerCategory({
      category_type: "documents",
      name: "カテゴリA",
      description: "desc",
      position: { type: "first" },
    });

    // Step 3: 失敗を返しつつ、シフトが対象件数分だけ逐次更新されることを検証する。
    expect(response).toEqual({ success: false, error: insertError });
    expect(shiftUpdateBuilder1.update).toHaveBeenCalledWith({ display_order: 6 });
    expect(shiftUpdateBuilder1.eq).toHaveBeenCalledWith("id", 2);
    expect(shiftUpdateBuilder2.update).toHaveBeenCalledWith({ display_order: 5 });
    expect(shiftUpdateBuilder2.eq).toHaveBeenCalledWith("id", 1);
    expect(supabase.from).toHaveBeenNthCalledWith(1, "categories");
    expect(supabase.from).toHaveBeenNthCalledWith(2, "categories");
    expect(supabase.from).toHaveBeenNthCalledWith(3, "categories");

    // Step 4: 失敗時に再採番が試行されたことを検証する。
    expect(reorderSelectBuilder.order).toHaveBeenCalledTimes(1);
  });

  it("registerCategory 異常系: シフト途中の更新失敗時は再採番復旧を試行して失敗を返す", async () => {
    // Step 1: シフト2件目の更新で失敗し、復旧再採番が必要になるモックを準備する。
    const shiftBuilder = createGteOrderBuilder({
      data: [
        { id: 2, display_order: 5 },
        { id: 1, display_order: 4 },
      ],
      error: null,
    });
    const shiftUpdateBuilder1 = createUpdateBuilder({ data: null, error: null });
    const shiftUpdateBuilder2 = createUpdateBuilder({
      data: null,
      error: { message: "shift failed" },
    });
    const recoveryReorderSelectBuilder = createOrderBuilder({
      data: [{ id: 1 }, { id: 2 }],
      error: null,
    });
    const recoveryReorderUpdateBuilder1 = createUpdateBuilder({ data: null, error: null });
    const recoveryReorderUpdateBuilder2 = createUpdateBuilder({ data: null, error: null });

    const supabase = { from: jest.fn() };
    supabase.from
      .mockReturnValueOnce(shiftBuilder)
      .mockReturnValueOnce(shiftUpdateBuilder1)
      .mockReturnValueOnce(shiftUpdateBuilder2)
      .mockReturnValueOnce(recoveryReorderSelectBuilder)
      .mockReturnValueOnce(recoveryReorderUpdateBuilder1)
      .mockReturnValueOnce(recoveryReorderUpdateBuilder2);
    createClientSupabaseClientMock.mockReturnValue(supabase);

    // Step 2: registerCategory を実行する。
    const response = await registerCategory({
      category_type: "documents",
      name: "カテゴリA",
      description: "desc",
      position: { type: "first" },
    });

    // Step 3: 失敗レスポンスと、復旧用の再採番が試行されたことを検証する。
    expect(response.success).toBe(false);
    expect(response.error).toBeInstanceOf(Error);
    expect((response.error as Error).message).toContain("表示順更新に失敗しました");
    expect(recoveryReorderSelectBuilder.order).toHaveBeenCalledTimes(1);
  });

  it("registerCategory 正常系: 再採番途中失敗時は1回再試行して復旧できれば成功を返す", async () => {
    // Step 1: 再採番1回目で途中失敗し、2回目で成功するモックを準備する。
    const maxOrderBuilder = createOrderLimitBuilder({ data: [{ display_order: 3 }], error: null });
    const insertBuilder = createInsertBuilder({ data: null, error: null });

    const reorderSelectBuilder1 = createOrderBuilder({
      data: [{ id: 1 }, { id: 2 }],
      error: null,
    });
    const reorderUpdateFailBuilder = createUpdateBuilder({
      data: null,
      error: { message: "reorder failed" },
    });

    const reorderSelectBuilder2 = createOrderBuilder({
      data: [{ id: 1 }, { id: 2 }],
      error: null,
    });
    const reorderUpdateBuilder1 = createUpdateBuilder({ data: null, error: null });
    const reorderUpdateBuilder2 = createUpdateBuilder({ data: null, error: null });

    const supabase = { from: jest.fn() };
    supabase.from
      .mockReturnValueOnce(maxOrderBuilder)
      .mockReturnValueOnce(insertBuilder)
      .mockReturnValueOnce(reorderSelectBuilder1)
      .mockReturnValueOnce(reorderUpdateFailBuilder)
      .mockReturnValueOnce(reorderSelectBuilder2)
      .mockReturnValueOnce(reorderUpdateBuilder1)
      .mockReturnValueOnce(reorderUpdateBuilder2);
    createClientSupabaseClientMock.mockReturnValue(supabase);

    // Step 2: registerCategory を実行する。
    const response = await registerCategory({
      category_type: "documents",
      name: "カテゴリA",
      description: "desc",
      position: { type: "last" },
    });

    // Step 3: 再試行復旧後は成功を返し、再採番selectが2回呼ばれることを検証する。
    expect(response).toEqual({ success: true, error: null });
    expect(reorderSelectBuilder1.order).toHaveBeenCalledTimes(1);
    expect(reorderSelectBuilder2.order).toHaveBeenCalledTimes(1);
  });

  it("updateCategory 正常系: 更新成功時に success=true を返す", async () => {
    // Step 1: current 取得・更新・再採番のモックを準備する。
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

    // Step 2: updateCategory を実行する。
    const response = await updateCategory({
      id: 10,
      category_type: "documents",
      name: "カテゴリB",
      description: null,
      position: { type: "current" },
    });

    // Step 3: 成功レスポンスを検証する。
    expect(response).toEqual({ success: true, error: null });
    // 再採番の呼び出し有無を明示検証: update 成功時は categories の再採番が実行される。
    expect(reorderSelectBuilder.order).toHaveBeenCalledTimes(1);
  });

  it("updateCategory 正常系: after 指定時はシフト後に更新して再採番する", async () => {
    // Step 1: current 取得、after 基準取得、シフト、更新、再採番の成功モックを準備する。
    const currentBuilder = createSelectSingleBuilder({
      data: {
        display_order: 2,
        category_type: "documents",
        name: "カテゴリA",
        description: "old",
      },
      error: null,
    });
    const afterBuilder = createSelectSingleBuilder({
      data: { display_order: 4 },
      error: null,
    });
    const shiftBuilder = createGteOrderBuilder({
      data: [{ id: 7, display_order: 5 }],
      error: null,
    });
    const shiftUpdateBuilder = createUpdateBuilder({ data: null, error: null });
    const updateBuilder = createUpdateBuilder({ data: null, error: null });
    const reorderSelectBuilder = createOrderBuilder({
      data: [{ id: 1 }, { id: 2 }],
      error: null,
    });
    const reorderUpdateBuilder1 = createUpdateBuilder({ data: null, error: null });
    const reorderUpdateBuilder2 = createUpdateBuilder({ data: null, error: null });

    const supabase = { from: jest.fn() };
    supabase.from
      .mockReturnValueOnce(currentBuilder)
      .mockReturnValueOnce(afterBuilder)
      .mockReturnValueOnce(shiftBuilder)
      .mockReturnValueOnce(shiftUpdateBuilder)
      .mockReturnValueOnce(updateBuilder)
      .mockReturnValueOnce(reorderSelectBuilder)
      .mockReturnValueOnce(reorderUpdateBuilder1)
      .mockReturnValueOnce(reorderUpdateBuilder2);
    createClientSupabaseClientMock.mockReturnValue(supabase);

    // Step 2: updateCategory を実行する。
    const response = await updateCategory({
      id: 10,
      category_type: "documents",
      name: "カテゴリB",
      description: "new",
      position: { type: "after", afterId: 3 },
    });

    // Step 3: 成功レスポンスとシフト・再採番呼び出しを検証する。
    expect(response).toEqual({ success: true, error: null });
    expect(shiftUpdateBuilder.update).toHaveBeenCalledWith({ display_order: 6 });
    expect(shiftUpdateBuilder.eq).toHaveBeenCalledWith("id", 7);
    expect(reorderSelectBuilder.order).toHaveBeenCalledTimes(1);
  });

  it("updateCategory 異常系: シフト後に更新失敗した場合は再採番を試行して失敗を返す", async () => {
    // Step 1: first 配置のシフト成功後、update 失敗になるモックを準備する。
    const currentBuilder = createSelectSingleBuilder({
      data: { display_order: 2, category_type: "documents" },
      error: null,
    });
    const shiftBuilder = createGteOrderBuilder({ data: [], error: null });
    const updateError = { message: "update failed" };
    const updateBuilder = createUpdateBuilder({ data: null, error: updateError });
    const reorderSelectBuilder = createOrderBuilder({ data: [], error: null });

    const supabase = { from: jest.fn() };
    supabase.from
      .mockReturnValueOnce(currentBuilder)
      .mockReturnValueOnce(shiftBuilder)
      .mockReturnValueOnce(updateBuilder)
      .mockReturnValueOnce(reorderSelectBuilder);
    createClientSupabaseClientMock.mockReturnValue(supabase);

    // Step 2: updateCategory を実行する。
    const response = await updateCategory({
      id: 10,
      category_type: "documents",
      name: "カテゴリB",
      description: null,
      position: { type: "first" },
    });

    // Step 3: 失敗を返しつつ、再採番が試行されたことを検証する。
    expect(response).toEqual({ success: false, error: updateError });
    expect(reorderSelectBuilder.order).toHaveBeenCalledTimes(1);
  });

  it("updateCategory 異常系: 更新後の再採番失敗時は更新内容をロールバックして失敗を返す", async () => {
    // Step 1: update 成功後に再採番が失敗し、ロールバックへ遷移するモックを準備する。
    const currentBuilder = createSelectSingleBuilder({
      data: {
        display_order: 2,
        category_type: "documents",
        name: "旧カテゴリ",
        description: "old",
      },
      error: null,
    });
    const updateBuilder = createUpdateBuilder({ data: null, error: null });
    const reorderFailBuilder1 = createOrderBuilder({
      data: null,
      error: { message: "reorder failed" },
    });
    const reorderFailBuilder2 = createOrderBuilder({
      data: null,
      error: { message: "reorder failed" },
    });
    const rollbackUpdateBuilder = createUpdateBuilder({ data: null, error: null });
    const rollbackReorderSelectBuilder = createOrderBuilder({
      data: [{ id: 1 }, { id: 2 }],
      error: null,
    });
    const rollbackReorderUpdateBuilder1 = createUpdateBuilder({ data: null, error: null });
    const rollbackReorderUpdateBuilder2 = createUpdateBuilder({ data: null, error: null });

    const supabase = { from: jest.fn() };
    supabase.from
      .mockReturnValueOnce(currentBuilder)
      .mockReturnValueOnce(updateBuilder)
      .mockReturnValueOnce(reorderFailBuilder1)
      .mockReturnValueOnce(reorderFailBuilder2)
      .mockReturnValueOnce(rollbackUpdateBuilder)
      .mockReturnValueOnce(rollbackReorderSelectBuilder)
      .mockReturnValueOnce(rollbackReorderUpdateBuilder1)
      .mockReturnValueOnce(rollbackReorderUpdateBuilder2);
    createClientSupabaseClientMock.mockReturnValue(supabase);

    // Step 2: updateCategory を実行する。
    const response = await updateCategory({
      id: 10,
      category_type: "documents",
      name: "カテゴリB",
      description: "new",
      position: { type: "current" },
    });

    // Step 3: 失敗レスポンスとロールバック更新内容を検証する。
    expect(response.success).toBe(false);
    expect(response.error).toBeInstanceOf(Error);
    expect((response.error as Error).message).toContain("並び順再採番対象の取得に失敗しました");
    expect(rollbackUpdateBuilder.update).toHaveBeenCalledWith({
      category_type: "documents",
      name: "旧カテゴリ",
      description: "old",
      display_order: 2,
    });
    expect(rollbackUpdateBuilder.eq).toHaveBeenCalledWith("id", 10);
  });

  it("deleteCategory 正常系: 未分類へ移動して削除・再採番が完了する", async () => {
    // Step 1: deleteCategory の各ステップ（取得→移動→削除→再採番）のモックを準備する。
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

    // Step 2: deleteCategory を実行する。
    const response = await deleteCategory(10, "documents");

    // Step 3: 成功レスポンスを検証する。
    expect(response).toEqual({ success: true, error: null });
    expect(reorderItemsInCategoryMock).toHaveBeenCalledWith("documents", 1);
    // 再採番の呼び出し有無を明示検証: delete 成功時は categories の再採番が実行される。
    expect(reorderCategorySelectBuilder.order).toHaveBeenCalledTimes(1);
  });

  it("deleteCategory 異常系: カテゴリー再採番失敗時は削除と移動をロールバックして失敗を返す", async () => {
    // Step 1: 再採番失敗を含むロールバック経路のモックを準備する。
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
    const deleteBuilder = createUpdateBuilder({ data: null, error: null });
    const reorderCategoriesBuilder1 = createOrderBuilder({
      data: null,
      error: { message: "reorder categories failed" },
    });
    const reorderCategoriesBuilder2 = createOrderBuilder({
      data: null,
      error: { message: "reorder categories failed" },
    });
    const rollbackDeleteBuilder = createUpdateBuilder({ data: null, error: null });
    const rollbackMoveBuilder = createUpdateInEqBuilder({ data: null, error: null });

    const supabase = { from: jest.fn() };
    supabase.from
      .mockReturnValueOnce(deletingCategoryBuilder)
      .mockReturnValueOnce(uncategorizedBuilder)
      .mockReturnValueOnce(contentsToMoveBuilder)
      .mockReturnValueOnce(moveBuilder)
      .mockReturnValueOnce(movedToUncategorizedCheckBuilder)
      .mockReturnValueOnce(remainingOriginalCheckBuilder)
      .mockReturnValueOnce(deleteBuilder)
      .mockReturnValueOnce(reorderCategoriesBuilder1)
      .mockReturnValueOnce(reorderCategoriesBuilder2)
      .mockReturnValueOnce(rollbackDeleteBuilder)
      .mockReturnValueOnce(rollbackMoveBuilder);
    createClientSupabaseClientMock.mockReturnValue(supabase);

    // Step 2: deleteCategory を実行する。
    const response = await deleteCategory(10, "documents");

    // Step 3: 失敗レスポンスとロールバック呼び出しを検証する。
    expect(response.success).toBe(false);
    expect(response.error).toBeInstanceOf(Error);
    expect((response.error as Error).message).toContain("並び順再採番対象の取得に失敗しました");
    // 再採番の呼び出し有無を明示検証: 再採番処理が実行された上で失敗していることを確認する。
    expect(reorderCategoriesBuilder1.order).toHaveBeenCalledTimes(1);
    expect(reorderCategoriesBuilder2.order).toHaveBeenCalledTimes(1);
    expect(rollbackDeleteBuilder.eq).toHaveBeenCalledWith("id", 10);
    expect(rollbackMoveBuilder.eq).toHaveBeenNthCalledWith(1, "is_deleted", false);
    expect(rollbackMoveBuilder.eq).toHaveBeenNthCalledWith(2, "category_id", 1);
    expect(reorderItemsInCategoryMock).toHaveBeenNthCalledWith(1, "documents", 1);
    expect(reorderItemsInCategoryMock).toHaveBeenNthCalledWith(2, "documents", 10);
    expect(reorderItemsInCategoryMock).toHaveBeenNthCalledWith(3, "documents", 1);
  });

  it("deleteCategory 異常系: 未分類側再採番失敗時はロールバック後に双方再採番して失敗を返す", async () => {
    // Step 1: 未分類側再採番で失敗し、ロールバックと双方再採番へ進むモックを準備する。
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
    const deleteBuilder = createUpdateBuilder({ data: null, error: null });
    const rollbackDeleteBuilder = createUpdateBuilder({ data: null, error: null });
    const rollbackMoveBuilder = createUpdateInEqBuilder({ data: null, error: null });

    const supabase = { from: jest.fn() };
    supabase.from
      .mockReturnValueOnce(deletingCategoryBuilder)
      .mockReturnValueOnce(uncategorizedBuilder)
      .mockReturnValueOnce(contentsToMoveBuilder)
      .mockReturnValueOnce(moveBuilder)
      .mockReturnValueOnce(movedToUncategorizedCheckBuilder)
      .mockReturnValueOnce(remainingOriginalCheckBuilder)
      .mockReturnValueOnce(deleteBuilder)
      .mockReturnValueOnce(rollbackDeleteBuilder)
      .mockReturnValueOnce(rollbackMoveBuilder);
    createClientSupabaseClientMock.mockReturnValue(supabase);

    reorderItemsInCategoryMock
      .mockRejectedValueOnce(new Error("uncategorized reorder failed"))
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined);

    // Step 2: deleteCategory を実行する。
    const response = await deleteCategory(10, "documents");

    // Step 3: 失敗レスポンスとロールバック後の双方再採番呼び出しを検証する。
    expect(response.success).toBe(false);
    expect(response.error).toBeInstanceOf(Error);
    expect((response.error as Error).message).toContain("uncategorized reorder failed");
    expect(rollbackDeleteBuilder.eq).toHaveBeenCalledWith("id", 10);
    expect(rollbackMoveBuilder.eq).toHaveBeenNthCalledWith(1, "is_deleted", false);
    expect(rollbackMoveBuilder.eq).toHaveBeenNthCalledWith(2, "category_id", 1);
    expect(reorderItemsInCategoryMock).toHaveBeenNthCalledWith(1, "documents", 1);
    expect(reorderItemsInCategoryMock).toHaveBeenNthCalledWith(2, "documents", 10);
    expect(reorderItemsInCategoryMock).toHaveBeenNthCalledWith(3, "documents", 1);
  });
});
