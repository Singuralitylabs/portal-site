import { createClientSupabaseClient } from "../../app/services/api/supabase-client";
import { createBrowserClient } from "@supabase/ssr";
import {
  deleteApplication,
  getApplicationsByCategory,
  registerApplication,
  updateApplication,
} from "../../app/services/api/applications-client";
import {
  deleteDocument,
  getDocumentsByCategory,
  registerDocument,
  updateDocument,
} from "../../app/services/api/documents-client";
import {
  deleteVideo,
  getVideosByCategory,
  registerVideo,
  updateVideo,
} from "../../app/services/api/videos-client";
import {
  addNewUser,
  approveUser,
  fetchUserIdByAuthId,
  fetchUserRoleById,
  fetchUserStatusById,
  rejectUser,
} from "../../app/services/api/users-client";
import {
  calculateDisplayOrder,
  getItemsByCategory,
  reorderItemsInCategory,
  shiftDisplayOrder,
} from "../../app/services/api/utils/display-order";

/**
 * supabase-client の実体（createClientSupabaseClient）を参照する。
 */
const supabaseClientActual = jest.requireActual(
  "../../app/services/api/supabase-client"
) as typeof import("../../../app/services/api/supabase-client");

/**
 * Supabase クエリの最終戻り値を表す型。
 * @property data - クエリ結果
 * @property error - エラー情報
 */
type QueryResult = { data: unknown; error: unknown };

jest.mock("@supabase/ssr", () => ({
  createBrowserClient: jest.fn(),
}));

/**
 * Supabase クライアント生成関数をモック化する。
 */
jest.mock("../../app/services/api/supabase-client", () => ({
  ...jest.requireActual("../../app/services/api/supabase-client"),
  createClientSupabaseClient: jest.fn(),
}));

/**
 * display-order ユーティリティをモック化する。
 */
jest.mock("../../app/services/api/utils/display-order", () => ({
  getItemsByCategory: jest.fn(),
  calculateDisplayOrder: jest.fn(),
  shiftDisplayOrder: jest.fn(),
  reorderItemsInCategory: jest.fn(),
}));

/**
 * select().eq().single() で結果を返すクエリビルダーを生成する。
 * @param result - 返却するクエリ結果
 * @returns チェーン可能なクエリビルダー
 */
const createSelectBuilder = (result: QueryResult) => {
  const builder: { select?: jest.Mock; eq?: jest.Mock; single?: jest.Mock } = {};

  builder.select = jest.fn(() => builder);
  builder.eq = jest.fn(() => builder);
  builder.single = jest.fn(() => Promise.resolve(result));

  return builder as Required<typeof builder>;
};

/**
 * update().eq() で結果を返すクエリビルダーを生成する。
 * @param result - 返却するクエリ結果
 * @returns チェーン可能なクエリビルダー
 */
const createUpdateBuilder = (result: QueryResult) => {
  const builder: { update?: jest.Mock; eq?: jest.Mock } = {};

  builder.update = jest.fn(() => builder);
  builder.eq = jest.fn(() => Promise.resolve(result));

  return builder as Required<typeof builder>;
};

/**
 * insert() で結果を返すクエリビルダーを生成する。
 * @param result - 返却するクエリ結果
 * @returns チェーン可能なクエリビルダー
 */
const createInsertBuilder = (result: QueryResult) => {
  const builder: { insert?: jest.Mock } = {};

  builder.insert = jest.fn(() => Promise.resolve(result));

  return builder as Required<typeof builder>;
};

/**
 * insert().select() で結果を返すクエリビルダーを生成する。
 * @param result - 返却するクエリ結果
 * @returns チェーン可能なクエリビルダー
 */
const createInsertSelectBuilder = (result: QueryResult) => {
  const builder: { insert?: jest.Mock; select?: jest.Mock } = {};

  builder.insert = jest.fn(() => builder);
  builder.select = jest.fn(() => Promise.resolve(result));

  return builder as Required<typeof builder>;
};

/**
 * select().eq().eq().maybeSingle() で結果を返すクエリビルダーを生成する。
 * @param result - 返却するクエリ結果
 * @returns チェーン可能なクエリビルダー
 */
const createMaybeSingleBuilder = (result: QueryResult) => {
  const builder: { select?: jest.Mock; eq?: jest.Mock; maybeSingle?: jest.Mock } = {};

  builder.select = jest.fn(() => builder);
  builder.eq = jest.fn(() => builder);
  builder.maybeSingle = jest.fn(() => Promise.resolve(result));

  return builder as Required<typeof builder>;
};

/**
 * update().eq().eq() を await できるクエリビルダーを生成する。
 * @param result - 返却するクエリ結果
 * @returns チェーン可能なクエリビルダー
 */
const createUpdateFilterBuilder = (result: QueryResult) => {
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

/**
 * supabase-client の単体テスト。
 */
describe("supabase-client", () => {
  /**
   * createBrowserClient の Jest モック参照。
   */
  const createBrowserClientMock = createBrowserClient as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * createClientSupabaseClient の動作検証。
   */
  it("環境変数を利用して Supabase クライアントを生成する", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
    const mockClient = { from: jest.fn() };

    createBrowserClientMock.mockReturnValue(mockClient);

    const response = supabaseClientActual.createClientSupabaseClient();

    // console.log("createClientSupabaseClient response", response);

    // Supabase URL/Key でクライアント生成されたことを確認
    expect(createBrowserClientMock).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "anon-key"
    );
    // 生成されたクライアントが返ることを確認
    expect(response).toBe(mockClient);
  });
});

/**
 * applications-client の単体テスト。
 */
describe("applications-client", () => {
  /**
   * createClientSupabaseClient の Jest モック参照。
   */
  const createClientSupabaseClientMock = createClientSupabaseClient as jest.Mock;
  const getItemsByCategoryMock = getItemsByCategory as jest.Mock;
  const calculateDisplayOrderMock = calculateDisplayOrder as jest.Mock;
  const shiftDisplayOrderMock = shiftDisplayOrder as jest.Mock;
  const reorderItemsInCategoryMock = reorderItemsInCategory as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * getApplicationsByCategory のテスト。
   */
  describe("getApplicationsByCategory", () => {
    /**
     * 正常系: カテゴリー内アプリ一覧を取得できること。
     */
    it("正常系: カテゴリー内アプリ一覧を取得できる", async () => {
      const items = [{ id: 1, name: "app", display_order: 1 }];
      getItemsByCategoryMock.mockResolvedValue(items); // カテゴリー内取得の戻り値を設定

      const response = await getApplicationsByCategory(10, 2);

      // console.log("getApplicationsByCategory response", response);

      // カテゴリー内アプリ取得の引数が正しいことを確認
      expect(getItemsByCategoryMock).toHaveBeenCalledWith("applications", 10, 2);
      // 取得結果がそのまま返ることを確認
      expect(response).toEqual(items);
    });
  });

  /**
   * deleteApplication のテスト。
   */
  describe("deleteApplication", () => {
    /**
     * 正常系: アプリの論理削除に成功すること。
     */
    it("正常系: アプリの論理削除に成功する", async () => {
      const builder = createUpdateBuilder({ data: null, error: null });
      const supabase = { from: jest.fn(() => builder) };
      createClientSupabaseClientMock.mockReturnValue(supabase);

      const response = await deleteApplication(1, 10);

      // console.log("deleteApplication response", response);

      // applications テーブルに対する操作であることを確認
      expect(supabase.from).toHaveBeenCalledWith("applications");
      // 論理削除の更新内容が正しいことを確認
      expect(builder.update).toHaveBeenCalledWith({ is_deleted: true, updated_by: 10 });
      // 指定IDに対して更新していることを確認
      expect(builder.eq).toHaveBeenCalledWith("id", 1);
      // 成功レスポンスが返ることを確認
      expect(response).toEqual({ success: true, error: null });
    });

    /**
     * 異常系: エラー時に失敗を返すこと。
     */
    it("異常系: エラー時は失敗を返す", async () => {
      const consoleError = jest.spyOn(console, "error").mockImplementation(() => {}); // console.error を無効化
      const builder = createUpdateBuilder({ data: null, error: { message: "failed" } });
      const supabase = { from: jest.fn(() => builder) };
      createClientSupabaseClientMock.mockReturnValue(supabase);

      const response = await deleteApplication(2, 11);

      // console.log("deleteApplication error response", response);

      // 失敗時に success=false が返ることを確認
      expect(response).toEqual({ success: false, error: { message: "failed" } });
      // エラーログが出力されることを確認
      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore(); // console.error のモックを復元
    });
  });

  /**
   * registerApplication のテスト。
   */
  describe("registerApplication", () => {
    /**
     * 正常系: アプリ登録が成功し並び順が更新されること。
     */
    it("正常系: アプリ登録が成功する", async () => {
      const builder = createInsertBuilder({ data: null, error: null });
      const supabase = { from: jest.fn(() => builder) };
      createClientSupabaseClientMock.mockReturnValue(supabase);
      calculateDisplayOrderMock.mockResolvedValue(5); // 表示順計算の戻り値を設定

      const response = await registerApplication({
        name: "app",
        category_id: 3,
        description: "desc",
        url: "https://example.com",
        developer_id: 7,
        created_by: 1,
        position: { type: "first" },
      });

      // console.log("registerApplication response", response);

      // display_order 計算に渡す引数が正しいことを確認
      expect(calculateDisplayOrderMock).toHaveBeenCalledWith("applications", 3, {
        type: "first",
      });
      // シフト処理が呼ばれることを確認
      expect(shiftDisplayOrderMock).toHaveBeenCalledWith("applications", 3, 5);
      // applications テーブルに対する操作であることを確認
      expect(supabase.from).toHaveBeenCalledWith("applications");
      // insert が実行されることを確認
      expect(builder.insert).toHaveBeenCalled();
      // 並び順の再計算が行われることを確認
      expect(reorderItemsInCategoryMock).toHaveBeenCalledWith("applications", 3);
      // 成功レスポンスが返ることを確認
      expect(response).toEqual({ success: true, error: null });
    });

    /**
     * 異常系: 登録に失敗した場合はエラーを返すこと。
     */
    it("異常系: 登録に失敗した場合はエラーを返す", async () => {
      const consoleError = jest.spyOn(console, "error").mockImplementation(() => {}); // console.error を無効化
      const builder = createInsertBuilder({ data: null, error: { message: "failed" } });
      const supabase = { from: jest.fn(() => builder) };
      createClientSupabaseClientMock.mockReturnValue(supabase);
      calculateDisplayOrderMock.mockResolvedValue(2); // 表示順計算の戻り値を設定

      const response = await registerApplication({
        name: "app",
        category_id: 3,
        description: "desc",
        url: "https://example.com",
        developer_id: 7,
        created_by: 1,
        position: { type: "last" },
      });

      // console.log("registerApplication error response", response);

      // 失敗時に success=false が返ることを確認
      expect(response).toEqual({ success: false, error: { message: "failed" } });
      // エラーログが出力されることを確認
      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore(); // console.error のモックを復元
    });
  });

  /**
   * updateApplication のテスト。
   */
  describe("updateApplication", () => {
    /**
     * 正常系: 更新後に並び順を再計算すること。
     */
    it("正常系: 更新後に並び順を再計算する", async () => {
      const selectBuilder = createSelectBuilder({
        data: { display_order: 2, category_id: 1 },
        error: null,
      });
      const updateBuilder = createUpdateBuilder({ data: null, error: null });
      const supabase = {
        from: jest
          .fn()
          .mockImplementationOnce(() => selectBuilder) // 1回目の from で selectBuilder を返す
          .mockImplementationOnce(() => updateBuilder), // 2回目の from で updateBuilder を返す
      };
      createClientSupabaseClientMock.mockReturnValue(supabase);
      calculateDisplayOrderMock.mockResolvedValue(4); // 表示順計算の戻り値を設定

      const response = await updateApplication({
        id: 1,
        name: "app",
        category_id: 2,
        description: "desc",
        url: "https://example.com",
        developer_id: 7,
        updated_by: 9,
        position: { type: "after", id: 3 },
      });

      // console.log("updateApplication response", response);

      // select の取得カラムが正しいことを確認
      expect(selectBuilder.select).toHaveBeenCalledWith("display_order, category_id");
      // 対象IDで検索していることを確認
      expect(selectBuilder.eq).toHaveBeenCalledWith("id", 1);
      // single が呼ばれることを確認
      expect(selectBuilder.single).toHaveBeenCalled();
      // display_order 計算の引数が正しいことを確認
      expect(calculateDisplayOrderMock).toHaveBeenCalledWith(
        "applications",
        2,
        { type: "after", id: 3 },
        2
      );
      // シフト処理が呼ばれることを確認
      expect(shiftDisplayOrderMock).toHaveBeenCalledWith("applications", 2, 4, 1);
      // update が実行されることを確認
      expect(updateBuilder.update).toHaveBeenCalled();
      // 対象IDで更新していることを確認
      expect(updateBuilder.eq).toHaveBeenCalledWith("id", 1);
      // 新カテゴリで並び順再計算されることを確認
      expect(reorderItemsInCategoryMock).toHaveBeenCalledWith("applications", 2);
      // 旧カテゴリでも並び順再計算されることを確認
      expect(reorderItemsInCategoryMock).toHaveBeenCalledWith("applications", 1);
      // 成功レスポンスが返ることを確認
      expect(response).toEqual({ success: true, error: null });
    });

    /**
     * 正常系: 現在アプリ情報がない場合も更新できること。
     */
    it("正常系: 現在アプリ情報がない場合も更新できる", async () => {
      const selectBuilder = createSelectBuilder({ data: null, error: null });
      const updateBuilder = createUpdateBuilder({ data: null, error: null });
      const supabase = {
        from: jest
          .fn()
          .mockImplementationOnce(() => selectBuilder) // 1回目の from で selectBuilder を返す
          .mockImplementationOnce(() => updateBuilder), // 2回目の from で updateBuilder を返す
      };
      createClientSupabaseClientMock.mockReturnValue(supabase);
      calculateDisplayOrderMock.mockResolvedValue(6); // 表示順計算の戻り値を設定

      const response = await updateApplication({
        id: 2,
        name: "app",
        category_id: 5,
        description: "desc",
        url: "https://example.com",
        developer_id: 7,
        updated_by: 9,
        position: { type: "last" },
      });

      // console.log("updateApplication no current response", response);

      // current がない場合は第四引数が undefined になることを確認
      expect(calculateDisplayOrderMock).toHaveBeenCalledWith(
        "applications",
        5,
        { type: "last" },
        undefined
      );
      // シフト処理が呼ばれないことを確認
      expect(shiftDisplayOrderMock).not.toHaveBeenCalled();
      // update が実行されることを確認
      expect(updateBuilder.update).toHaveBeenCalled();
      // 並び順再計算が1回のみであることを確認
      expect(reorderItemsInCategoryMock).toHaveBeenCalledTimes(1);
      // 現カテゴリで並び順再計算されることを確認
      expect(reorderItemsInCategoryMock).toHaveBeenCalledWith("applications", 5);
      // 成功レスポンスが返ることを確認
      expect(response).toEqual({ success: true, error: null });
    });

    /**
     * 異常系: 更新に失敗した場合はエラーを返すこと。
     */
    it("異常系: 更新に失敗した場合はエラーを返す", async () => {
      const consoleError = jest.spyOn(console, "error").mockImplementation(() => {}); // console.error を無効化
      const selectBuilder = createSelectBuilder({
        data: { display_order: 2, category_id: 1 },
        error: null,
      });
      const updateBuilder = createUpdateBuilder({ data: null, error: { message: "failed" } });
      const supabase = {
        from: jest
          .fn()
          .mockImplementationOnce(() => selectBuilder) // 1回目の from で selectBuilder を返す
          .mockImplementationOnce(() => updateBuilder), // 2回目の from で updateBuilder を返す
      };
      createClientSupabaseClientMock.mockReturnValue(supabase);
      calculateDisplayOrderMock.mockResolvedValue(4); // 表示順計算の戻り値を設定

      const response = await updateApplication({
        id: 1,
        name: "app",
        category_id: 2,
        description: "desc",
        url: "https://example.com",
        developer_id: 7,
        updated_by: 9,
        position: { type: "last" },
      });

      // console.log("updateApplication error response", response);

      // 失敗時に success=false が返ることを確認
      expect(response).toEqual({ success: false, error: { message: "failed" } });
      // エラーログが出力されることを確認
      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore(); // console.error のモックを復元
    });
  });
});

/**
 * documents-client の単体テスト。
 */
describe("documents-client", () => {
  /**
   * createClientSupabaseClient の Jest モック参照。
   */
  const createClientSupabaseClientMock = createClientSupabaseClient as jest.Mock;
  const getItemsByCategoryMock = getItemsByCategory as jest.Mock;
  const calculateDisplayOrderMock = calculateDisplayOrder as jest.Mock;
  const shiftDisplayOrderMock = shiftDisplayOrder as jest.Mock;
  const reorderItemsInCategoryMock = reorderItemsInCategory as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * getDocumentsByCategory のテスト。
   */
  describe("getDocumentsByCategory", () => {
    /**
     * 正常系: カテゴリー内資料一覧を取得できること。
     */
    it("正常系: カテゴリー内資料一覧を取得できる", async () => {
      const items = [{ id: 1, name: "doc", display_order: 1 }];
      getItemsByCategoryMock.mockResolvedValue(items); // カテゴリー内取得の戻り値を設定

      const response = await getDocumentsByCategory(10, 2);

      // console.log("getDocumentsByCategory response", response);

      // カテゴリー内資料取得の引数が正しいことを確認
      expect(getItemsByCategoryMock).toHaveBeenCalledWith("documents", 10, 2);
      // 取得結果がそのまま返ることを確認
      expect(response).toEqual(items);
    });
  });

  /**
   * deleteDocument のテスト。
   */
  describe("deleteDocument", () => {
    /**
     * 正常系: 資料の論理削除に成功すること。
     */
    it("正常系: 資料の論理削除に成功する", async () => {
      const builder = createUpdateBuilder({ data: null, error: null });
      const supabase = { from: jest.fn(() => builder) };
      createClientSupabaseClientMock.mockReturnValue(supabase);

      const response = await deleteDocument(1, 10);

      // console.log("deleteDocument response", response);

      // documents テーブルに対する操作であることを確認
      expect(supabase.from).toHaveBeenCalledWith("documents");
      // 論理削除の更新内容が正しいことを確認
      expect(builder.update).toHaveBeenCalledWith({ is_deleted: true, updated_by: 10 });
      // 指定IDに対して更新していることを確認
      expect(builder.eq).toHaveBeenCalledWith("id", 1);
      // 成功レスポンスが返ることを確認
      expect(response).toEqual({ success: true, error: null });
    });

    /**
     * 異常系: エラー時に失敗を返すこと。
     */
    it("異常系: エラー時は失敗を返す", async () => {
      const consoleError = jest.spyOn(console, "error").mockImplementation(() => {}); // console.error を無効化
      const builder = createUpdateBuilder({ data: null, error: { message: "failed" } });
      const supabase = { from: jest.fn(() => builder) };
      createClientSupabaseClientMock.mockReturnValue(supabase);

      const response = await deleteDocument(2, 11);

      // console.log("deleteDocument error response", response);

      // 失敗時に success=false が返ることを確認
      expect(response).toEqual({ success: false, error: { message: "failed" } });
      // エラーログが出力されることを確認
      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore(); // console.error のモックを復元
    });
  });

  /**
   * registerDocument のテスト。
   */
  describe("registerDocument", () => {
    /**
     * 正常系: 資料登録が成功し並び順が更新されること。
     */
    it("正常系: 資料登録が成功する", async () => {
      const builder = createInsertBuilder({ data: null, error: null });
      const supabase = { from: jest.fn(() => builder) };
      createClientSupabaseClientMock.mockReturnValue(supabase);
      calculateDisplayOrderMock.mockResolvedValue(5); // 表示順計算の戻り値を設定

      const response = await registerDocument({
        name: "doc",
        category_id: 3,
        description: "desc",
        url: "https://example.com",
        assignee: "owner",
        created_by: 1,
        position: { type: "first" },
      });

      // console.log("registerDocument response", response);

      // display_order 計算に渡す引数が正しいことを確認
      expect(calculateDisplayOrderMock).toHaveBeenCalledWith("documents", 3, {
        type: "first",
      });
      // シフト処理が呼ばれることを確認
      expect(shiftDisplayOrderMock).toHaveBeenCalledWith("documents", 3, 5);
      // documents テーブルに対する操作であることを確認
      expect(supabase.from).toHaveBeenCalledWith("documents");
      // insert が実行されることを確認
      expect(builder.insert).toHaveBeenCalled();
      // 並び順の再計算が行われることを確認
      expect(reorderItemsInCategoryMock).toHaveBeenCalledWith("documents", 3);
      // 成功レスポンスが返ることを確認
      expect(response).toEqual({ success: true, error: null });
    });

    /**
     * 異常系: 登録に失敗した場合はエラーを返すこと。
     */
    it("異常系: 登録に失敗した場合はエラーを返す", async () => {
      const consoleError = jest.spyOn(console, "error").mockImplementation(() => {}); // console.error を無効化
      const builder = createInsertBuilder({ data: null, error: { message: "failed" } });
      const supabase = { from: jest.fn(() => builder) };
      createClientSupabaseClientMock.mockReturnValue(supabase);
      calculateDisplayOrderMock.mockResolvedValue(2); // 表示順計算の戻り値を設定

      const response = await registerDocument({
        name: "doc",
        category_id: 3,
        description: "desc",
        url: "https://example.com",
        assignee: "owner",
        created_by: 1,
        position: { type: "last" },
      });

      // console.log("registerDocument error response", response);

      // 失敗時に success=false が返ることを確認
      expect(response).toEqual({ success: false, error: { message: "failed" } });
      // エラーログが出力されることを確認
      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore(); // console.error のモックを復元
    });
  });

  /**
   * updateDocument のテスト。
   */
  describe("updateDocument", () => {
    /**
     * 正常系: 更新後に並び順を再計算すること。
     */
    it("正常系: 更新後に並び順を再計算する", async () => {
      const selectBuilder = createSelectBuilder({
        data: { display_order: 2, category_id: 1 },
        error: null,
      });
      const updateBuilder = createUpdateBuilder({ data: null, error: null });
      const supabase = {
        from: jest
          .fn()
          .mockImplementationOnce(() => selectBuilder) // 1回目の from で selectBuilder を返す
          .mockImplementationOnce(() => updateBuilder), // 2回目の from で updateBuilder を返す
      };
      createClientSupabaseClientMock.mockReturnValue(supabase);
      calculateDisplayOrderMock.mockResolvedValue(4); // 表示順計算の戻り値を設定

      const response = await updateDocument({
        id: 1,
        name: "doc",
        category_id: 2,
        description: "desc",
        url: "https://example.com",
        assignee: "owner",
        updated_by: 9,
        position: { type: "after", id: 3 },
      });

      // console.log("updateDocument response", response);

      // select の取得カラムが正しいことを確認
      expect(selectBuilder.select).toHaveBeenCalledWith("display_order, category_id");
      // 対象IDで検索していることを確認
      expect(selectBuilder.eq).toHaveBeenCalledWith("id", 1);
      // single が呼ばれることを確認
      expect(selectBuilder.single).toHaveBeenCalled();
      // display_order 計算の引数が正しいことを確認
      expect(calculateDisplayOrderMock).toHaveBeenCalledWith(
        "documents",
        2,
        { type: "after", id: 3 },
        2
      );
      // シフト処理が呼ばれることを確認
      expect(shiftDisplayOrderMock).toHaveBeenCalledWith("documents", 2, 4, 1);
      // update が実行されることを確認
      expect(updateBuilder.update).toHaveBeenCalled();
      // 対象IDで更新していることを確認
      expect(updateBuilder.eq).toHaveBeenCalledWith("id", 1);
      // 新カテゴリで並び順再計算されることを確認
      expect(reorderItemsInCategoryMock).toHaveBeenCalledWith("documents", 2);
      // 旧カテゴリでも並び順再計算されることを確認
      expect(reorderItemsInCategoryMock).toHaveBeenCalledWith("documents", 1);
      // 成功レスポンスが返ることを確認
      expect(response).toEqual({ success: true, error: null });
    });

    /**
     * 正常系: 現在資料情報がない場合も更新できること。
     */
    it("正常系: 現在資料情報がない場合も更新できる", async () => {
      const selectBuilder = createSelectBuilder({ data: null, error: null });
      const updateBuilder = createUpdateBuilder({ data: null, error: null });
      const supabase = {
        from: jest
          .fn()
          .mockImplementationOnce(() => selectBuilder) // 1回目の from で selectBuilder を返す
          .mockImplementationOnce(() => updateBuilder), // 2回目の from で updateBuilder を返す
      };
      createClientSupabaseClientMock.mockReturnValue(supabase);
      calculateDisplayOrderMock.mockResolvedValue(6); // 表示順計算の戻り値を設定

      const response = await updateDocument({
        id: 2,
        name: "doc",
        category_id: 5,
        description: "desc",
        url: "https://example.com",
        assignee: "owner",
        updated_by: 9,
        position: { type: "last" },
      });

      // console.log("updateDocument no current response", response);

      // current がない場合は第四引数が undefined になることを確認
      expect(calculateDisplayOrderMock).toHaveBeenCalledWith(
        "documents",
        5,
        { type: "last" },
        undefined
      );
      // シフト処理が呼ばれないことを確認
      expect(shiftDisplayOrderMock).not.toHaveBeenCalled();
      // update が実行されることを確認
      expect(updateBuilder.update).toHaveBeenCalled();
      // 並び順再計算が1回のみであることを確認
      expect(reorderItemsInCategoryMock).toHaveBeenCalledTimes(1);
      // 現カテゴリで並び順再計算されることを確認
      expect(reorderItemsInCategoryMock).toHaveBeenCalledWith("documents", 5);
      // 成功レスポンスが返ることを確認
      expect(response).toEqual({ success: true, error: null });
    });

    /**
     * 異常系: 更新に失敗した場合はエラーを返すこと。
     */
    it("異常系: 更新に失敗した場合はエラーを返す", async () => {
      const consoleError = jest.spyOn(console, "error").mockImplementation(() => {}); // console.error を無効化
      const selectBuilder = createSelectBuilder({
        data: { display_order: 2, category_id: 1 },
        error: null,
      });
      const updateBuilder = createUpdateBuilder({ data: null, error: { message: "failed" } });
      const supabase = {
        from: jest
          .fn()
          .mockImplementationOnce(() => selectBuilder) // 1回目の from で selectBuilder を返す
          .mockImplementationOnce(() => updateBuilder), // 2回目の from で updateBuilder を返す
      };
      createClientSupabaseClientMock.mockReturnValue(supabase);
      calculateDisplayOrderMock.mockResolvedValue(4); // 表示順計算の戻り値を設定

      const response = await updateDocument({
        id: 1,
        name: "doc",
        category_id: 2,
        description: "desc",
        url: "https://example.com",
        assignee: "owner",
        updated_by: 9,
        position: { type: "last" },
      });

      // console.log("updateDocument error response", response);

      // 失敗時に success=false が返ることを確認
      expect(response).toEqual({ success: false, error: { message: "failed" } });
      // エラーログが出力されることを確認
      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore(); // console.error のモックを復元
    });
  });
});

/**
 * videos-client の単体テスト。
 */
describe("videos-client", () => {
  /**
   * createClientSupabaseClient の Jest モック参照。
   */
  const createClientSupabaseClientMock = createClientSupabaseClient as jest.Mock;
  const getItemsByCategoryMock = getItemsByCategory as jest.Mock;
  const calculateDisplayOrderMock = calculateDisplayOrder as jest.Mock;
  const shiftDisplayOrderMock = shiftDisplayOrder as jest.Mock;
  const reorderItemsInCategoryMock = reorderItemsInCategory as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * getVideosByCategory のテスト。
   */
  describe("getVideosByCategory", () => {
    /**
     * 正常系: カテゴリー内動画一覧を取得できること。
     */
    it("正常系: カテゴリー内動画一覧を取得できる", async () => {
      const items = [{ id: 1, name: "video", display_order: 1 }];
      getItemsByCategoryMock.mockResolvedValue(items); // カテゴリー内取得の戻り値を設定

      const response = await getVideosByCategory(10, 2);

      // console.log("getVideosByCategory response", response);

      // カテゴリー内動画取得の引数が正しいことを確認
      expect(getItemsByCategoryMock).toHaveBeenCalledWith("videos", 10, 2);
      // 取得結果がそのまま返ることを確認
      expect(response).toEqual(items);
    });
  });

  /**
   * deleteVideo のテスト。
   */
  describe("deleteVideo", () => {
    /**
     * 正常系: 動画の論理削除に成功すること。
     */
    it("正常系: 動画の論理削除に成功する", async () => {
      const builder = createUpdateBuilder({ data: null, error: null });
      const supabase = { from: jest.fn(() => builder) };
      createClientSupabaseClientMock.mockReturnValue(supabase);

      const response = await deleteVideo(1, 10);

      // console.log("deleteVideo response", response);

      // videos テーブルに対する操作であることを確認
      expect(supabase.from).toHaveBeenCalledWith("videos");
      // 論理削除の更新内容が正しいことを確認
      expect(builder.update).toHaveBeenCalledWith({ is_deleted: true, updated_by: 10 });
      // 指定IDに対して更新していることを確認
      expect(builder.eq).toHaveBeenCalledWith("id", 1);
      // 成功レスポンスが返ることを確認
      expect(response).toEqual({ success: true, error: null });
    });

    /**
     * 異常系: エラー時に失敗を返すこと。
     */
    it("異常系: エラー時は失敗を返す", async () => {
      const consoleError = jest.spyOn(console, "error").mockImplementation(() => {}); // console.error を無効化
      const builder = createUpdateBuilder({ data: null, error: { message: "failed" } });
      const supabase = { from: jest.fn(() => builder) };
      createClientSupabaseClientMock.mockReturnValue(supabase);

      const response = await deleteVideo(2, 11);

      // console.log("deleteVideo error response", response);

      // 失敗時に success=false が返ることを確認
      expect(response).toEqual({ success: false, error: { message: "failed" } });
      // エラーログが出力されることを確認
      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore(); // console.error のモックを復元
    });
  });

  /**
   * registerVideo のテスト。
   */
  describe("registerVideo", () => {
    /**
     * 正常系: 動画登録が成功し並び順が更新されること。
     */
    it("正常系: 動画登録が成功する", async () => {
      const builder = createInsertBuilder({ data: null, error: null });
      const supabase = { from: jest.fn(() => builder) };
      createClientSupabaseClientMock.mockReturnValue(supabase);
      calculateDisplayOrderMock.mockResolvedValue(5); // 表示順計算の戻り値を設定

      const response = await registerVideo({
        name: "video",
        category_id: 3,
        description: "desc",
        url: "https://example.com",
        thumbnail_path: "/thumb.png",
        thumbnail_time: 10,
        length: 120,
        assignee: "owner",
        created_by: 1,
        position: { type: "first" },
      });

      // console.log("registerVideo response", response);

      // display_order 計算に渡す引数が正しいことを確認
      expect(calculateDisplayOrderMock).toHaveBeenCalledWith("videos", 3, {
        type: "first",
      });
      // シフト処理が呼ばれることを確認
      expect(shiftDisplayOrderMock).toHaveBeenCalledWith("videos", 3, 5);
      // videos テーブルに対する操作であることを確認
      expect(supabase.from).toHaveBeenCalledWith("videos");
      // insert が実行されることを確認
      expect(builder.insert).toHaveBeenCalled();
      // 並び順の再計算が行われることを確認
      expect(reorderItemsInCategoryMock).toHaveBeenCalledWith("videos", 3);
      // 成功レスポンスが返ることを確認
      expect(response).toEqual({ success: true, error: null });
    });

    /**
     * 異常系: 登録に失敗した場合はエラーを返すこと。
     */
    it("異常系: 登録に失敗した場合はエラーを返す", async () => {
      const consoleError = jest.spyOn(console, "error").mockImplementation(() => {}); // console.error を無効化
      const builder = createInsertBuilder({ data: null, error: { message: "failed" } });
      const supabase = { from: jest.fn(() => builder) };
      createClientSupabaseClientMock.mockReturnValue(supabase);
      calculateDisplayOrderMock.mockResolvedValue(2); // 表示順計算の戻り値を設定

      const response = await registerVideo({
        name: "video",
        category_id: 4,
        description: "desc",
        url: "https://example.com",
        thumbnail_path: "/thumb.png",
        thumbnail_time: 10,
        length: 120,
        assignee: "owner",
        created_by: 2,
        position: { type: "last" },
      });

      // console.log("registerVideo error response", response);

      // last の場合はシフトしないことを確認
      expect(shiftDisplayOrderMock).not.toHaveBeenCalled();
      // 失敗時に success=false が返ることを確認
      expect(response).toEqual({ success: false, error: { message: "failed" } });
      // エラーログが出力されることを確認
      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore(); // console.error のモックを復元
    });
  });

  /**
   * updateVideo のテスト。
   */
  describe("updateVideo", () => {
    /**
     * 正常系: 更新後に並び順を再計算し、カテゴリー変更時は元のカテゴリーも再計算すること。
     */
    it("正常系: 更新後に並び順を再計算しカテゴリー変更時は元も再計算する", async () => {
      const selectBuilder = createSelectBuilder({
        data: { display_order: 2, category_id: 1 },
        error: null,
      });
      const updateBuilder = createUpdateBuilder({ data: null, error: null });
      const supabase = {
        from: jest
          .fn()
          .mockImplementationOnce(() => selectBuilder) // 1回目の from で selectBuilder を返す
          .mockImplementationOnce(() => updateBuilder), // 2回目の from で updateBuilder を返す
      };
      createClientSupabaseClientMock.mockReturnValue(supabase);
      calculateDisplayOrderMock.mockResolvedValue(4); // 表示順計算の戻り値を設定

      const response = await updateVideo({
        id: 1,
        name: "video",
        category_id: 2,
        description: "desc",
        url: "https://example.com",
        thumbnail_path: "/thumb.png",
        thumbnail_time: 10,
        length: 120,
        assignee: "owner",
        updated_by: 9,
        position: { type: "after", id: 3 },
      });

      // console.log("updateVideo response", response);

      // select の取得カラムが正しいことを確認
      expect(selectBuilder.select).toHaveBeenCalledWith("display_order, category_id");
      // 対象IDで検索していることを確認
      expect(selectBuilder.eq).toHaveBeenCalledWith("id", 1);
      // single が呼ばれることを確認
      expect(selectBuilder.single).toHaveBeenCalled();
      // display_order 計算の引数が正しいことを確認
      expect(calculateDisplayOrderMock).toHaveBeenCalledWith(
        "videos",
        2,
        { type: "after", id: 3 },
        2
      );
      // シフト処理が呼ばれることを確認
      expect(shiftDisplayOrderMock).toHaveBeenCalledWith("videos", 2, 4, 1);
      // update が実行されることを確認
      expect(updateBuilder.update).toHaveBeenCalled();
      // 対象IDで更新していることを確認
      expect(updateBuilder.eq).toHaveBeenCalledWith("id", 1);
      // 新カテゴリで並び順再計算されることを確認
      expect(reorderItemsInCategoryMock).toHaveBeenCalledWith("videos", 2);
      // 旧カテゴリでも並び順再計算されることを確認
      expect(reorderItemsInCategoryMock).toHaveBeenCalledWith("videos", 1);
      // 成功レスポンスが返ることを確認
      expect(response).toEqual({ success: true, error: null });
    });

    /**
     * 正常系: 現在カテゴリが取得できない場合は現カテゴリのみ再計算すること。
     */
    it("正常系: 現在カテゴリが取得できない場合は現カテゴリのみ再計算する", async () => {
      const selectBuilder = createSelectBuilder({ data: null, error: null });
      const updateBuilder = createUpdateBuilder({ data: null, error: null });
      const supabase = {
        from: jest
          .fn()
          .mockImplementationOnce(() => selectBuilder) // 1回目の from で selectBuilder を返す
          .mockImplementationOnce(() => updateBuilder), // 2回目の from で updateBuilder を返す
      };
      createClientSupabaseClientMock.mockReturnValue(supabase);
      calculateDisplayOrderMock.mockResolvedValue(8); // 表示順計算の戻り値を設定

      const response = await updateVideo({
        id: 4,
        name: "video",
        category_id: 6,
        description: "desc",
        url: "https://example.com",
        thumbnail_path: "/thumb.png",
        thumbnail_time: 8,
        length: 60,
        assignee: "owner",
        updated_by: 10,
        position: { type: "last" },
      });

      // console.log("updateVideo no current category response", response);

      // currentDisplayOrder が undefined で渡されることを確認
      expect(calculateDisplayOrderMock).toHaveBeenCalledWith(
        "videos",
        6,
        { type: "last" },
        undefined
      );
      // last の場合はシフトしないことを確認
      expect(shiftDisplayOrderMock).not.toHaveBeenCalled();
      // 現カテゴリのみ再計算されることを確認
      expect(reorderItemsInCategoryMock).toHaveBeenCalledTimes(1);
      // 現カテゴリで並び順再計算されることを確認
      expect(reorderItemsInCategoryMock).toHaveBeenCalledWith("videos", 6);
      // 成功レスポンスが返ることを確認
      expect(response).toEqual({ success: true, error: null });
    });

    /**
     * 正常系: カテゴリー変更がない場合は現在カテゴリーのみ再計算すること。
     */
    it("正常系: カテゴリー変更がない場合は現在カテゴリーのみ再計算する", async () => {
      const selectBuilder = createSelectBuilder({
        data: { display_order: 3, category_id: 4 },
        error: null,
      });
      const updateBuilder = createUpdateBuilder({ data: null, error: null });
      const supabase = {
        from: jest
          .fn()
          .mockImplementationOnce(() => selectBuilder) // 1回目の from で selectBuilder を返す
          .mockImplementationOnce(() => updateBuilder), // 2回目の from で updateBuilder を返す
      };
      createClientSupabaseClientMock.mockReturnValue(supabase);
      calculateDisplayOrderMock.mockResolvedValue(7); // 表示順計算の戻り値を設定

      const response = await updateVideo({
        id: 2,
        name: "video",
        category_id: 4,
        description: "desc",
        url: "https://example.com",
        thumbnail_path: "/thumb.png",
        thumbnail_time: 12,
        length: 90,
        assignee: "owner",
        updated_by: 9,
        position: { type: "last" },
      });

      // console.log("updateVideo same category response", response);

      // last の場合はシフトしないことを確認
      expect(shiftDisplayOrderMock).not.toHaveBeenCalled();
      // 同一カテゴリのみ再計算されることを確認
      expect(reorderItemsInCategoryMock).toHaveBeenCalledTimes(1);
      // 現カテゴリで並び順再計算されることを確認
      expect(reorderItemsInCategoryMock).toHaveBeenCalledWith("videos", 4);
      // 成功レスポンスが返ることを確認
      expect(response).toEqual({ success: true, error: null });
    });

    /**
     * 異常系: 更新に失敗した場合はエラーを返すこと。
     */
    it("異常系: 更新に失敗した場合はエラーを返す", async () => {
      const consoleError = jest.spyOn(console, "error").mockImplementation(() => {}); // console.error を無効化
      const selectBuilder = createSelectBuilder({
        data: { display_order: 2, category_id: 1 },
        error: null,
      });
      const updateBuilder = createUpdateBuilder({ data: null, error: { message: "failed" } });
      const supabase = {
        from: jest
          .fn()
          .mockImplementationOnce(() => selectBuilder) // 1回目の from で selectBuilder を返す
          .mockImplementationOnce(() => updateBuilder), // 2回目の from で updateBuilder を返す
      };
      createClientSupabaseClientMock.mockReturnValue(supabase);
      calculateDisplayOrderMock.mockResolvedValue(4); // 表示順計算の戻り値を設定

      const response = await updateVideo({
        id: 3,
        name: "video",
        category_id: 2,
        description: "desc",
        url: "https://example.com",
        thumbnail_path: "/thumb.png",
        thumbnail_time: 10,
        length: 120,
        assignee: "owner",
        updated_by: 9,
        position: { type: "last" },
      });

      // console.log("updateVideo error response", response);

      // 失敗時に success=false が返ることを確認
      expect(response).toEqual({ success: false, error: { message: "failed" } });
      // エラーログが出力されることを確認
      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore(); // console.error のモックを復元
    });
  });
});

/**
 * users-client の単体テスト。
 */
describe("users-client", () => {
  /**
   * createClientSupabaseClient の Jest モック参照。
   */
  const createClientSupabaseClientMock = createClientSupabaseClient as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * addNewUser のテスト。
   */
  describe("addNewUser", () => {
    /**
     * 正常系: ユーザー追加が成功すること。
     */
    it("正常系: ユーザー追加が成功する", async () => {
      const builder = createInsertSelectBuilder({
        data: [{ id: 1 }],
        error: null,
      });
      const supabase = { from: jest.fn(() => builder) };
      createClientSupabaseClientMock.mockReturnValue(supabase);

      const response = await addNewUser({
        authId: "auth-1",
        email: "user@example.com",
        displayName: "User",
        avatarUrl: "https://example.com/avatar.png",
      });

      // console.log("addNewUser response", response);

      // users テーブルに対する操作であることを確認
      expect(supabase.from).toHaveBeenCalledWith("users");
      // 挿入するユーザー情報が正しいことを確認
      expect(builder.insert).toHaveBeenCalledWith([
        {
          auth_id: "auth-1",
          email: "user@example.com",
          display_name: "User",
          avatar_url: "https://example.com/avatar.png",
          role: "member",
          status: "pending",
          is_deleted: false,
        },
      ]);
      // select が呼ばれることを確認
      expect(builder.select).toHaveBeenCalled();
      // 成功レスポンスが返ることを確認
      expect(response).toEqual({ data: [{ id: 1 }], error: null });
    });

    /**
     * 異常系: ユーザー追加に失敗した場合はエラーを返すこと。
     */
    it("異常系: ユーザー追加に失敗した場合はエラーを返す", async () => {
      const consoleError = jest.spyOn(console, "error").mockImplementation(() => {}); // console.error を無効化
      const builder = createInsertSelectBuilder({
        data: null,
        error: { message: "failed" },
      });
      const supabase = { from: jest.fn(() => builder) };
      createClientSupabaseClientMock.mockReturnValue(supabase);

      const response = await addNewUser({
        authId: "auth-2",
        email: "user2@example.com",
        displayName: "User2",
      });

      // console.log("addNewUser error response", response);

      // 失敗時に data=null が返ることを確認
      expect(response).toEqual({ data: null, error: { message: "failed" } });
      // エラーログが出力されることを確認
      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore(); // console.error のモックを復元
    });
  });

  /**
   * fetchUserRoleById のテスト。
   */
  describe("fetchUserRoleById", () => {
    /**
     * 正常系: ユーザーロールを取得できること。
     */
    it("正常系: ユーザーロールを取得できる", async () => {
      const builder = createMaybeSingleBuilder({
        data: { role: "admin" },
        error: null,
      });
      const supabase = { from: jest.fn(() => builder) };
      createClientSupabaseClientMock.mockReturnValue(supabase);

      const response = await fetchUserRoleById({ authId: "auth-1" });

      // console.log("fetchUserRoleById response", response);

      // role を選択していることを確認
      expect(builder.select).toHaveBeenCalledWith("role");
      // auth_id で絞り込んでいることを確認
      expect(builder.eq).toHaveBeenCalledWith("auth_id", "auth-1");
      // is_deleted=false で絞り込んでいることを確認
      expect(builder.eq).toHaveBeenCalledWith("is_deleted", false);
      // maybeSingle が呼ばれることを確認
      expect(builder.maybeSingle).toHaveBeenCalled();
      // 取得した role が返ることを確認
      expect(response).toEqual({ role: "admin", error: null });
    });

    /**
     * 異常系: データなしの場合は null を返すこと。
     */
    it("異常系: データなしの場合は null を返す", async () => {
      const consoleError = jest.spyOn(console, "error").mockImplementation(() => {}); // console.error を無効化
      const builder = createMaybeSingleBuilder({ data: null, error: null });
      const supabase = { from: jest.fn(() => builder) };
      createClientSupabaseClientMock.mockReturnValue(supabase);

      const response = await fetchUserRoleById({ authId: "auth-2" });

      // console.log("fetchUserRoleById no data response", response);

      // データなしの場合は role=null が返ることを確認
      expect(response).toEqual({ role: null, error: null });
      // エラーログが出力されることを確認
      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore(); // console.error のモックを復元
    });

    /**
     * 異常系: エラー時は null を返すこと。
     */
    it("異常系: エラー時は null を返す", async () => {
      const consoleError = jest.spyOn(console, "error").mockImplementation(() => {}); // console.error を無効化
      const builder = createMaybeSingleBuilder({
        data: null,
        error: { message: "failed" },
      });
      const supabase = { from: jest.fn(() => builder) };
      createClientSupabaseClientMock.mockReturnValue(supabase);

      const response = await fetchUserRoleById({ authId: "auth-3" });

      // console.log("fetchUserRoleById error response", response);

      // エラー時は role=null が返ることを確認
      expect(response).toEqual({ role: null, error: { message: "failed" } });
      // エラーログが出力されることを確認
      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore(); // console.error のモックを復元
    });
  });

  /**
   * fetchUserStatusById のテスト。
   */
  describe("fetchUserStatusById", () => {
    /**
     * 正常系: ユーザーステータスを取得できること。
     */
    it("正常系: ユーザーステータスを取得できる", async () => {
      const builder = createMaybeSingleBuilder({
        data: { status: "active" },
        error: null,
      });
      const supabase = { from: jest.fn(() => builder) };
      createClientSupabaseClientMock.mockReturnValue(supabase);

      const response = await fetchUserStatusById({ authId: "auth-4" });

      // console.log("fetchUserStatusById response", response);

      // status を選択していることを確認
      expect(builder.select).toHaveBeenCalledWith("status");
      // auth_id で絞り込んでいることを確認
      expect(builder.eq).toHaveBeenCalledWith("auth_id", "auth-4");
      // is_deleted=false で絞り込んでいることを確認
      expect(builder.eq).toHaveBeenCalledWith("is_deleted", false);
      // maybeSingle が呼ばれることを確認
      expect(builder.maybeSingle).toHaveBeenCalled();
      // 取得した status が返ることを確認
      expect(response).toEqual({ status: "active", error: null });
    });

    /**
     * 異常系: データなしの場合は null を返すこと。
     */
    it("異常系: データなしの場合は null を返す", async () => {
      const consoleError = jest.spyOn(console, "error").mockImplementation(() => {}); // console.error を無効化
      const builder = createMaybeSingleBuilder({ data: null, error: null });
      const supabase = { from: jest.fn(() => builder) };
      createClientSupabaseClientMock.mockReturnValue(supabase);

      const response = await fetchUserStatusById({ authId: "auth-5" });

      // console.log("fetchUserStatusById no data response", response);

      // データなしの場合は status=null が返ることを確認
      expect(response).toEqual({ status: null, error: null });
      // エラーログが出力されることを確認
      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore(); // console.error のモックを復元
    });

    /**
     * 異常系: エラー時は null を返すこと。
     */
    it("異常系: エラー時は null を返す", async () => {
      const consoleError = jest.spyOn(console, "error").mockImplementation(() => {}); // console.error を無効化
      const builder = createMaybeSingleBuilder({
        data: null,
        error: { message: "failed" },
      });
      const supabase = { from: jest.fn(() => builder) };
      createClientSupabaseClientMock.mockReturnValue(supabase);

      const response = await fetchUserStatusById({ authId: "auth-6" });

      // console.log("fetchUserStatusById error response", response);

      // エラー時は status=null が返ることを確認
      expect(response).toEqual({ status: null, error: { message: "failed" } });
      // エラーログが出力されることを確認
      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore(); // console.error のモックを復元
    });
  });

  /**
   * fetchUserIdByAuthId のテスト。
   */
  describe("fetchUserIdByAuthId", () => {
    /**
     * 正常系: ユーザーIDを取得できること。
     */
    it("正常系: ユーザーIDを取得できる", async () => {
      const builder = createSelectBuilder({
        data: { id: 12 },
        error: null,
      });
      const supabase = { from: jest.fn(() => builder) };
      createClientSupabaseClientMock.mockReturnValue(supabase);

      const response = await fetchUserIdByAuthId({ authId: "auth-7" });

      // console.log("fetchUserIdByAuthId response", response);

      // id を選択していることを確認
      expect(builder.select).toHaveBeenCalledWith("id");
      // auth_id で絞り込んでいることを確認
      expect(builder.eq).toHaveBeenCalledWith("auth_id", "auth-7");
      // is_deleted=false で絞り込んでいることを確認
      expect(builder.eq).toHaveBeenCalledWith("is_deleted", false);
      // single が呼ばれることを確認
      expect(builder.single).toHaveBeenCalled();
      // 取得した userId が返ることを確認
      expect(response).toEqual({ userId: 12, error: null });
    });

    /**
     * 異常系: エラーメッセージが空の場合は既定文言を出力すること。
     */
    it("異常系: エラーメッセージが空の場合は既定文言を出力する", async () => {
      const consoleError = jest.spyOn(console, "error").mockImplementation(() => {}); // console.error を無効化
      const builder = createSelectBuilder({
        data: null,
        error: { message: "" },
      });
      const supabase = { from: jest.fn(() => builder) };
      createClientSupabaseClientMock.mockReturnValue(supabase);

      const response = await fetchUserIdByAuthId({ authId: "auth-9" });

      // console.log("fetchUserIdByAuthId empty message response", response);
      // console.log("fetchUserIdByAuthId empty message consoleError", consoleError);

      // エラー時に userId=null が返ることを確認
      expect(response).toEqual({ userId: null, error: { message: "" } });
      // 既定文言でエラーログが出力されることを確認
      expect(consoleError).toHaveBeenCalledWith(
        "Supabase ユーザーID取得エラー:",
        "ユーザーが見つかりません"
      );
      consoleError.mockRestore(); // console.error のモックを復元
    });

    /**
     * 異常系: エラー時は null を返すこと。
     */
    it("異常系: エラー時は null を返す", async () => {
      const consoleError = jest.spyOn(console, "error").mockImplementation(() => {}); // console.error を無効化
      const builder = createSelectBuilder({
        data: null,
        error: { message: "failed" },
      });
      const supabase = { from: jest.fn(() => builder) };
      createClientSupabaseClientMock.mockReturnValue(supabase);

      const response = await fetchUserIdByAuthId({ authId: "auth-8" });

      // console.log("fetchUserIdByAuthId error response", response);

      // エラー時に userId=null が返ることを確認
      expect(response).toEqual({ userId: null, error: { message: "failed" } });
      // エラーログが出力されることを確認
      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore(); // console.error のモックを復元
    });
  });

  /**
   * approveUser のテスト。
   */
  describe("approveUser", () => {
    /**
     * 正常系: 承認更新が成功すること。
     */
    it("正常系: 承認更新が成功する", async () => {
      const builder = createUpdateFilterBuilder({ data: null, error: null });
      const supabase = { from: jest.fn(() => builder) };
      createClientSupabaseClientMock.mockReturnValue(supabase);

      const response = await approveUser({ userId: 10 });

      // console.log("approveUser response", response);

      // users テーブルに対する操作であることを確認
      expect(supabase.from).toHaveBeenCalledWith("users");
      // 更新内容に status と updated_at が含まれることを確認
      expect(builder.update).toHaveBeenCalledWith({
        status: "active",
        updated_at: expect.any(String),
      });
      // 対象IDで更新していることを確認
      expect(builder.eq).toHaveBeenCalledWith("id", 10);
      // is_deleted=false で絞り込んでいることを確認
      expect(builder.eq).toHaveBeenCalledWith("is_deleted", false);
      // 成功レスポンスが返ることを確認
      expect(response).toEqual({ error: null });
    });

    /**
     * 異常系: 更新失敗時はエラーを返すこと。
     */
    it("異常系: 更新失敗時はエラーを返す", async () => {
      const consoleError = jest.spyOn(console, "error").mockImplementation(() => {}); // console.error を無効化
      const builder = createUpdateFilterBuilder({
        data: null,
        error: { message: "failed" },
      });
      const supabase = { from: jest.fn(() => builder) };
      createClientSupabaseClientMock.mockReturnValue(supabase);

      const response = await approveUser({ userId: 11 });

      // console.log("approveUser error response", response);

      // エラーが返ることを確認
      expect(response).toEqual({ error: { message: "failed" } });
      // エラーログが出力されることを確認
      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore(); // console.error のモックを復元
    });
  });

  /**
   * rejectUser のテスト。
   */
  describe("rejectUser", () => {
    /**
     * 正常系: 否認更新が成功すること。
     */
    it("正常系: 否認更新が成功する", async () => {
      const builder = createUpdateFilterBuilder({ data: null, error: null });
      const supabase = { from: jest.fn(() => builder) };
      createClientSupabaseClientMock.mockReturnValue(supabase);

      const response = await rejectUser({ userId: 12 });

      // console.log("rejectUser response", response);

      // users テーブルに対する操作であることを確認
      expect(supabase.from).toHaveBeenCalledWith("users");
      // 更新内容に status と updated_at が含まれることを確認
      expect(builder.update).toHaveBeenCalledWith({
        status: "rejected",
        updated_at: expect.any(String),
      });
      // 対象IDで更新していることを確認
      expect(builder.eq).toHaveBeenCalledWith("id", 12);
      // is_deleted=false で絞り込んでいることを確認
      expect(builder.eq).toHaveBeenCalledWith("is_deleted", false);
      // 成功レスポンスが返ることを確認
      expect(response).toEqual({ error: null });
    });

    /**
     * 異常系: 更新失敗時はエラーを返すこと。
     */
    it("異常系: 更新失敗時はエラーを返す", async () => {
      const consoleError = jest.spyOn(console, "error").mockImplementation(() => {}); // console.error を無効化
      const builder = createUpdateFilterBuilder({
        data: null,
        error: { message: "failed" },
      });
      const supabase = { from: jest.fn(() => builder) };
      createClientSupabaseClientMock.mockReturnValue(supabase);

      const response = await rejectUser({ userId: 13 });

      // console.log("rejectUser error response", response);

      // エラーが返ることを確認
      expect(response).toEqual({ error: { message: "failed" } });
      // エラーログが出力されることを確認
      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore(); // console.error のモックを復元
    });
  });
});
