import { fetchDocuments } from "../../../app/services/api/documents-server";
import { fetchApplications } from "../../../app/services/api/applications-server";
import { fetchCategoriesByType } from "../../../app/services/api/categories-server";
import { fetchVideoById, fetchVideos } from "../../../app/services/api/videos-server";
import {
  fetchActiveUsers,
  fetchApprovalUsers,
  fetchUserStatusByIdInServer,
  fetchUserInfoByAuthId,
  fetchUserByAuthIdInServer,
  updateUserProfileServerInServer,
} from "../../../app/services/api/users-server";
import { createServerSupabaseClient } from "../../../app/services/api/supabase-server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * supabase-server の実体（createServerSupabaseClient / getServerCurrentUser）を参照する。
 */
const supabaseServerActual = jest.requireActual(
  "../../../app/services/api/supabase-server"
) as typeof import("../../../app/services/api/supabase-server");

/**
 * Supabase クエリの最終戻り値を表す型。
 * @property data - クエリ結果
 * @property error - エラー情報
 */
type QueryResult = { data: unknown; error: unknown };

/**
 * Supabase のクエリビルダー互換モック。
 * チェーン呼び出しに必要なメソッドを最小限定義する。
 */
type QueryBuilder = {
  select: jest.Mock;
  eq: jest.Mock;
  order: jest.Mock;
  maybeSingle: jest.Mock;
  update: jest.Mock;
  single: jest.Mock;
};

/**
 * 指定した終端メソッドで結果を返すクエリビルダーを生成する。
 * @param finalMethod - 最終的に解決されるメソッド名
 * @param result - 返却するクエリ結果
 * @returns チェーン可能なクエリビルダー
 */
const createQueryBuilder = (finalMethod: keyof QueryBuilder, result: QueryResult) => { // クエリビルダー生成の処理を開始
  const builder: Partial<QueryBuilder> = {};

  builder.select = jest.fn(() => builder);
  builder.eq = jest.fn(() => builder);
  builder.order = jest.fn(() => Promise.resolve(result));
  builder.maybeSingle = jest.fn(() => Promise.resolve(result));
  builder.update = jest.fn(() => builder);
  builder.single = jest.fn(() => Promise.resolve(result));

  builder.order = finalMethod === "order" ? builder.order : jest.fn(() => builder);
  builder.maybeSingle = finalMethod === "maybeSingle" ? builder.maybeSingle : jest.fn(() => builder);
  builder.single = finalMethod === "single" ? builder.single : jest.fn(() => builder);

  return builder as QueryBuilder;
};

/**
 * eq が最終呼び出しで結果を返すクエリビルダーを生成する。
 * @param eqCallCount - eq の呼び出し回数
 * @param result - 返却するクエリ結果
 * @returns チェーン可能なクエリビルダー
 */
const createQueryBuilderWithEqResult = (eqCallCount: number, result: QueryResult) => { // eq 終端のクエリビルダー生成を開始
  const builder: Partial<QueryBuilder> = {};
  let callIndex = 0;

  builder.select = jest.fn(() => builder);
  builder.order = jest.fn(() => builder);
  builder.maybeSingle = jest.fn(() => builder);
  builder.update = jest.fn(() => builder);
  builder.single = jest.fn(() => builder);
  builder.eq = jest.fn(() => {
    callIndex += 1;
    if (callIndex >= eqCallCount) {
      return Promise.resolve(result);
    }
    return builder;
  });

  return builder as QueryBuilder;
};

/**
 * Supabase クライアント生成関数をモック化する。
 */
jest.mock("../../../app/services/api/supabase-server", () => ({
  ...jest.requireActual("../../../app/services/api/supabase-server"),
  createServerSupabaseClient: jest.fn(),
}));

/**
 * Supabase SSR クライアントをモック化する。
 */
jest.mock("@supabase/ssr", () => ({
  createServerClient: jest.fn(),
}));

/**
 * Next.js cookies をモック化する。
 */
jest.mock("next/headers", () => ({
  cookies: jest.fn(),
}));

/**
 * Supabase サーバの単体テスト。
 * Supabase クライアントは完全にモックし、副作用を排除する。
 */
describe("Supabase サーバの単体テスト", () => {
  /**
   * createServerSupabaseClient の Jest モック参照。
   */
  const createServerSupabaseClientMock = createServerSupabaseClient as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * documents サービスのテスト。
   */
  describe("fetchDocuments", () => {
    /**
     * 正常系: 資料一覧が取得できること。
     */
    it("正常系: 資料一覧を取得できる", async () => {
      const result = { data: [{ id: 1 }], error: null };
      const builder = createQueryBuilder("order", result); // クエリビルダーを生成
      const supabase = {
        from: jest.fn(() => builder),
      };
      createServerSupabaseClientMock.mockResolvedValue(supabase); // Supabase クライアント生成をモック

      const response = await fetchDocuments();

      // console.log("fetchDocuments response", response);

      // Supabase クライアント生成が1回呼ばれることを確認
      expect(createServerSupabaseClientMock).toHaveBeenCalledTimes(1);
      // documents テーブルに対する操作であることを確認
      expect(supabase.from).toHaveBeenCalledWith("documents");
      // select の取得カラムが正しいことを確認
      expect(builder.select).toHaveBeenCalledWith("*, category:categories (name)");
      // is_deleted=false で絞り込んでいることを確認
      expect(builder.eq).toHaveBeenCalledWith("is_deleted", false);
      // 表示順で並べ替えていることを確認
      expect(builder.order).toHaveBeenCalledWith("display_order");
      // 取得結果が期待通り返ることを確認
      expect(response).toEqual({ data: result.data, error: null });
    });

    /**
     * 異常系: エラー時に data が null で返ること。
     */
    it("異常系: エラー時は data=null を返す", async () => {
      const consoleError = jest.spyOn(console, "error").mockImplementation(() => {}); // console.error をモック
      const result = { data: null, error: { message: "failed" } };
      const builder = createQueryBuilder("order", result); // クエリビルダーを生成
      const supabase = {
        from: jest.fn(() => builder),
      };
      createServerSupabaseClientMock.mockResolvedValue(supabase); // Supabase クライアント生成をモック

      const response = await fetchDocuments();

      // console.log("fetchDocuments error response", response);

      // エラー時に data=null が返ることを確認
      expect(response).toEqual({ data: null, error: result.error });
      // エラーログが出力されることを確認
      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore(); // console.error のモックを復元
    });
  });

  /**
   * applications サービスのテスト。
   */
  describe("fetchApplications", () => {
    /**
     * 正常系: アプリ一覧が取得できること。
     */
    it("正常系: アプリ一覧を取得できる", async () => {
      const result = { data: [{ id: 1 }], error: null };
      const builder = createQueryBuilder("order", result); // クエリビルダーを生成
      const supabase = {
        from: jest.fn(() => builder),
      };
      createServerSupabaseClientMock.mockResolvedValue(supabase); // Supabase クライアント生成をモック

      const response = await fetchApplications();

      // console.log("fetchApplications response", response);

      // applications テーブルに対する操作であることを確認
      expect(supabase.from).toHaveBeenCalledWith("applications");
      // select の取得カラムが正しいことを確認
      expect(builder.select).toHaveBeenCalledWith(
        "*, category:categories (name), developer:users!applications_developer_id_fkey (display_name)"
      );
      // is_deleted=false で絞り込んでいることを確認
      expect(builder.eq).toHaveBeenCalledWith("is_deleted", false);
      // 表示順で並べ替えていることを確認
      expect(builder.order).toHaveBeenCalledWith("display_order");
      // 取得結果が期待通り返ることを確認
      expect(response).toEqual({ data: result.data, error: null });
    });

    /**
     * 異常系: エラー時に data が null で返ること。
     */
    it("異常系: エラー時は data=null を返す", async () => {
      const consoleError = jest.spyOn(console, "error").mockImplementation(() => {}); // console.error をモック
      const result = { data: null, error: { message: "failed" } };
      const builder = createQueryBuilder("order", result); // クエリビルダーを生成
      const supabase = {
        from: jest.fn(() => builder),
      };
      createServerSupabaseClientMock.mockResolvedValue(supabase); // Supabase クライアント生成をモック

      const response = await fetchApplications();

      // console.log("fetchApplications error response", response);

      // エラー時に data=null が返ることを確認
      expect(response).toEqual({ data: null, error: result.error });
      // エラーログが出力されることを確認
      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore(); // console.error のモックを復元
    });
  });

  /**
   * categories サービスのテスト。
   */
  describe("fetchCategoriesByType", () => {
    /**
     * 正常系: カテゴリー一覧が取得できること。
     */
    it("正常系: カテゴリー一覧を取得できる", async () => {
      const result = { data: [{ id: 1, name: "category" }], error: null };
      const builder = createQueryBuilder("order", result); // クエリビルダーを生成
      const supabase = {
        from: jest.fn(() => builder),
      };
      createServerSupabaseClientMock.mockResolvedValue(supabase); // Supabase クライアント生成をモック

      const response = await fetchCategoriesByType("document");

      // console.log("fetchCategoriesByType response", response);

      // categories テーブルに対する操作であることを確認
      expect(supabase.from).toHaveBeenCalledWith("categories");
      // select の取得カラムが正しいことを確認
      expect(builder.select).toHaveBeenCalledWith("id, name");
      // category_type で絞り込んでいることを確認
      expect(builder.eq).toHaveBeenCalledWith("category_type", "document");
      // is_deleted=false で絞り込んでいることを確認
      expect(builder.eq).toHaveBeenCalledWith("is_deleted", false);
      // 表示順で並べ替えていることを確認
      expect(builder.order).toHaveBeenCalledWith("display_order");
      // 取得結果が期待通り返ることを確認
      expect(response).toEqual({ data: result.data, error: null });
    });

    /**
     * 異常系: エラー時に data が null で返ること。
     */
    it("異常系: エラー時は data=null を返す", async () => {
      const consoleError = jest.spyOn(console, "error").mockImplementation(() => {}); // console.error をモック
      const result = { data: null, error: { message: "failed" } };
      const builder = createQueryBuilder("order", result); // クエリビルダーを生成
      const supabase = {
        from: jest.fn(() => builder),
      };
      createServerSupabaseClientMock.mockResolvedValue(supabase); // Supabase クライアント生成をモック

      const response = await fetchCategoriesByType("video");

      // console.log("fetchCategoriesByType error response", response);

      // エラー時に data=null が返ることを確認
      expect(response).toEqual({ data: null, error: result.error });
      // エラーログが出力されることを確認
      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore(); // console.error のモックを復元
    });
  });

  /**
   * videos サービスのテスト。
   */
  describe("fetchVideos", () => {
    /**
     * 正常系: 動画一覧が取得できること。
     */
    it("正常系: 動画一覧を取得できる", async () => {
      const result = { data: [{ id: 1 }], error: null };
      const builder = createQueryBuilder("order", result); // order 終端のクエリビルダーを生成
      const supabase = {
        from: jest.fn(() => builder),
      };
      createServerSupabaseClientMock.mockResolvedValue(supabase); // サーバー用 Supabase クライアント生成をモック

      const response = await fetchVideos();

      // console.log("fetchVideos response", response);

      // videos テーブルに対する操作であることを確認
      expect(supabase.from).toHaveBeenCalledWith("videos");
      // select の取得カラムが正しいことを確認
      expect(builder.select).toHaveBeenCalledWith("*, category:categories (name)");
      // is_deleted=false で絞り込んでいることを確認
      expect(builder.eq).toHaveBeenCalledWith("is_deleted", false);
      // 表示順で並べ替えていることを確認
      expect(builder.order).toHaveBeenCalledWith("display_order");
      // 取得結果が期待通り返ることを確認
      expect(response).toEqual({ data: result.data, error: null });
    });

    /**
     * 異常系: エラー時に data が null で返ること。
     */
    it("異常系: エラー時は data=null を返す", async () => {
      const consoleError = jest.spyOn(console, "error").mockImplementation(() => {}); // console.error を無効化
      const result = { data: null, error: { message: "failed" } };
      const builder = createQueryBuilder("order", result); // order 終端のクエリビルダーを生成
      const supabase = {
        from: jest.fn(() => builder),
      };
      createServerSupabaseClientMock.mockResolvedValue(supabase); // サーバー用 Supabase クライアント生成をモック

      const response = await fetchVideos();

      // console.log("fetchVideos error response", response);

      // エラー時に data=null が返ることを確認
      expect(response).toEqual({ data: null, error: result.error });
      // エラーログが出力されることを確認
      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore(); // console.error のモックを復元
    });
  });

  /**
   * videos サービスの詳細取得テスト。
   */
  describe("fetchVideoById", () => {
    /**
     * 正常系: 動画詳細が取得できること。
     */
    it("正常系: 動画詳細を取得できる", async () => {
      const result = { data: { id: 1 }, error: null };
      const builder = createQueryBuilder("maybeSingle", result); // maybeSingle 終端のクエリビルダーを生成
      const supabase = {
        from: jest.fn(() => builder),
      };
      createServerSupabaseClientMock.mockResolvedValue(supabase); // サーバー用 Supabase クライアント生成をモック

      const response = await fetchVideoById(1);

      // console.log("fetchVideoById response", response);

      // videos テーブルに対する操作であることを確認
      expect(supabase.from).toHaveBeenCalledWith("videos");
      // select の取得カラムが正しいことを確認
      expect(builder.select).toHaveBeenCalledWith("*, category:categories(name)");
      // 対象IDで絞り込んでいることを確認
      expect(builder.eq).toHaveBeenCalledWith("id", 1);
      // is_deleted=false で絞り込んでいることを確認
      expect(builder.eq).toHaveBeenCalledWith("is_deleted", false);
      // maybeSingle が呼ばれることを確認
      expect(builder.maybeSingle).toHaveBeenCalled();
      // 取得結果が期待通り返ることを確認
      expect(response).toEqual({ data: result.data, error: null });
    });

    /**
     * 異常系: エラー時に data が null で返ること。
     */
    it("異常系: エラー時は data=null を返す", async () => {
      const consoleError = jest.spyOn(console, "error").mockImplementation(() => {}); // console.error を無効化
      const result = { data: null, error: { message: "failed" } };
      const builder = createQueryBuilder("maybeSingle", result); // maybeSingle 終端のクエリビルダーを生成
      const supabase = {
        from: jest.fn(() => builder),
      };
      createServerSupabaseClientMock.mockResolvedValue(supabase); // サーバー用 Supabase クライアント生成をモック

      const response = await fetchVideoById(99);

      // console.log("fetchVideoById error response", response);

      // エラー時に data=null が返ることを確認
      expect(response).toEqual({ data: null, error: result.error });
      // エラーログが出力されることを確認
      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore(); // console.error のモックを復元
    });
  });

  /**
   * users サービスのステータス取得テスト。
   */
  describe("fetchUserStatusByIdInServer", () => {
    /**
     * 正常系: ステータスが取得できること。
     */
    it("正常系: ステータスを取得できる", async () => {
      const result = { data: { status: "active" }, error: null };
      const builder = createQueryBuilder("maybeSingle", result); // maybeSingle 終端のクエリビルダーを生成
      const supabase = {
        from: jest.fn(() => builder),
      };
      createServerSupabaseClientMock.mockResolvedValue(supabase); // サーバー用 Supabase クライアント生成をモック

      const response = await fetchUserStatusByIdInServer({ authId: "auth-1" });

      // console.log("fetchUserStatusByIdInServer response", response);

      // users テーブルに対する操作であることを確認
      expect(supabase.from).toHaveBeenCalledWith("users");
      // status を選択していることを確認
      expect(builder.select).toHaveBeenCalledWith("status");
      // auth_id で絞り込んでいることを確認
      expect(builder.eq).toHaveBeenCalledWith("auth_id", "auth-1");
      // is_deleted=false で絞り込んでいることを確認
      expect(builder.eq).toHaveBeenCalledWith("is_deleted", false);
      // ステータス取得結果が期待通り返ることを確認
      expect(response).toEqual({ status: "active", error: null });
    });

    /**
     * 異常系: データなしの場合に null を返すこと。
     */
    it("異常系: データなしの場合は null を返す", async () => {
      const consoleError = jest.spyOn(console, "error").mockImplementation(() => {}); // console.error を無効化
      const result = { data: null, error: null };
      const builder = createQueryBuilder("maybeSingle", result); // maybeSingle 終端のクエリビルダーを生成
      const supabase = {
        from: jest.fn(() => builder),
      };
      createServerSupabaseClientMock.mockResolvedValue(supabase); // サーバー用 Supabase クライアント生成をモック

      const response = await fetchUserStatusByIdInServer({ authId: "auth-2" });

      // console.log("fetchUserStatusByIdInServer no data response", response);

      // データなしの場合は status=null が返ることを確認
      expect(response).toEqual({ status: null, error: null });
      // エラーログが出力されることを確認
      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore(); // console.error のモックを復元
    });

    /**
     * 異常系: エラー時に null を返すこと。
     */
    it("異常系: エラー時は null を返す", async () => {
      const consoleError = jest.spyOn(console, "error").mockImplementation(() => {}); // console.error を無効化
      const result = { data: null, error: { message: "failed" } };
      const builder = createQueryBuilder("maybeSingle", result); // maybeSingle 終端のクエリビルダーを生成
      const supabase = {
        from: jest.fn(() => builder),
      };
      createServerSupabaseClientMock.mockResolvedValue(supabase); // サーバー用 Supabase クライアント生成をモック

      const response = await fetchUserStatusByIdInServer({ authId: "auth-3" });

      // console.log("fetchUserStatusByIdInServer error response", response);

      // エラー時は status=null が返ることを確認
      expect(response).toEqual({ status: null, error: result.error });
      // エラーログが出力されることを確認
      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore(); // console.error のモックを復元
    });
  });

  /**
   * users サービスのユーザー情報取得テスト。
   */
  describe("fetchUserInfoByAuthId", () => {
    /**
     * 正常系: ユーザー情報が取得できること。
     */
    it("正常系: ユーザー情報を取得できる", async () => {
      const result = { data: { id: 10, role: "admin" }, error: null };
      const builder = createQueryBuilder("maybeSingle", result); // maybeSingle 終端のクエリビルダーを生成
      const supabase = {
        from: jest.fn(() => builder),
      };
      createServerSupabaseClientMock.mockResolvedValue(supabase); // サーバー用 Supabase クライアント生成をモック

      const response = await fetchUserInfoByAuthId({ authId: "auth-3" });

      // console.log("fetchUserInfoByAuthId response", response);

      // select の取得カラムが正しいことを確認
      expect(builder.select).toHaveBeenCalledWith("id, role");
      // auth_id で絞り込んでいることを確認
      expect(builder.eq).toHaveBeenCalledWith("auth_id", "auth-3");
      // is_deleted=false で絞り込んでいることを確認
      expect(builder.eq).toHaveBeenCalledWith("is_deleted", false);
      // 取得結果が期待通り返ることを確認
      expect(response).toEqual({ id: 10, role: "admin", error: null });
    });

    /**
     * 異常系: データなしの場合は空値を返すこと。
     */
    it("異常系: データなしの場合は空値を返す", async () => {
      const consoleError = jest.spyOn(console, "error").mockImplementation(() => {}); // console.error を無効化
      const result = { data: null, error: null };
      const builder = createQueryBuilder("maybeSingle", result); // maybeSingle 終端のクエリビルダーを生成
      const supabase = {
        from: jest.fn(() => builder),
      };
      createServerSupabaseClientMock.mockResolvedValue(supabase); // サーバー用 Supabase クライアント生成をモック

      const response = await fetchUserInfoByAuthId({ authId: "auth-4" });

      // console.log("fetchUserInfoByAuthId no data response", response);

      // データなしの場合は空値が返ることを確認
      expect(response).toEqual({ id: 0, role: "", error: null });
      // エラーログが出力されることを確認
      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore(); // console.error のモックを復元
    });

    /**
     * 異常系: エラー時は空値を返すこと。
     */
    it("異常系: エラー時は空値を返す", async () => {
      const consoleError = jest.spyOn(console, "error").mockImplementation(() => {}); // console.error を無効化
      const result = { data: null, error: { message: "failed" } };
      const builder = createQueryBuilder("maybeSingle", result); // maybeSingle 終端のクエリビルダーを生成
      const supabase = {
        from: jest.fn(() => builder),
      };
      createServerSupabaseClientMock.mockResolvedValue(supabase); // サーバー用 Supabase クライアント生成をモック

      const response = await fetchUserInfoByAuthId({ authId: "auth-5" });

      // console.log("fetchUserInfoByAuthId error response", response);

      // エラー時は空値が返ることを確認
      expect(response).toEqual({ id: 0, role: "", error: result.error });
      // エラーログが出力されることを確認
      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore(); // console.error のモックを復元
    });
  });

  /**
   * users サービスの会員一覧取得テスト。
   */
  describe("fetchActiveUsers", () => {
    /**
     * 正常系: 会員一覧が取得・整形されること。
     */
    it("正常系: 会員一覧を取得できる", async () => {
      const result = {
        data: [
          {
            id: 1,
            display_name: "ユーザー1",
            bio: "bio1",
            avatar_url: "avatar1",
            x_url: "https://x.com/user1",
            facebook_url: null,
            instagram_url: null,
            github_url: "https://github.com/user1",
            portfolio_url: null,
            position_tags: [
              { positions: { id: 1, name: "role1", is_deleted: false } },
              { positions: { id: 2, name: "role2", is_deleted: true } },
            ],
          },
          {
            id: 2,
            display_name: "ユーザー2",
            bio: "bio2",
            avatar_url: "avatar2",
            x_url: null,
            facebook_url: null,
            instagram_url: "https://instagram.com/user2",
            github_url: null,
            portfolio_url: "https://portfolio.example.com/user2",
            position_tags: [{ positions: [{ id: 3, name: "role3", is_deleted: false }] }],
          },
        ],
        error: null,
      };
      const builder = createQueryBuilder("order", result); // order 終端のクエリビルダーを生成
      const supabase = {
        from: jest.fn(() => builder),
      };
      createServerSupabaseClientMock.mockResolvedValue(supabase); // サーバー用 Supabase クライアント生成をモック

      const response = await fetchActiveUsers();

      // console.log("fetchActiveUsers response", response);

      // select の取得カラムが正しいことを確認
      expect(builder.select).toHaveBeenCalledWith(
        "id, display_name, bio, avatar_url, x_url, facebook_url, instagram_url, github_url, portfolio_url, position_tags(positions(id, name, is_deleted))"
      );
      // status=active で絞り込んでいることを確認
      expect(builder.eq).toHaveBeenCalledWith("status", "active");
      // is_deleted=false で絞り込んでいることを確認
      expect(builder.eq).toHaveBeenCalledWith("is_deleted", false);
      // position_tags の is_deleted=false で絞り込んでいることを確認
      expect(builder.eq).toHaveBeenCalledWith("position_tags.positions.is_deleted", false);
      // 作成日時順で並べ替えていることを確認
      expect(builder.order).toHaveBeenCalledWith("created_at", { ascending: true });
      // 変換後データが期待通りであることを確認
      expect(response.data).toEqual([
        {
          id: 1,
          display_name: "ユーザー1",
          bio: "bio1",
          avatar_url: "avatar1",
          x_url: "https://x.com/user1",
          facebook_url: null,
          instagram_url: null,
          github_url: "https://github.com/user1",
          portfolio_url: null,
          position_tags: [{ positions: { id: 1, name: "role1", is_deleted: false } }],
        },
        {
          id: 2,
          display_name: "ユーザー2",
          bio: "bio2",
          avatar_url: "avatar2",
          x_url: null,
          facebook_url: null,
          instagram_url: "https://instagram.com/user2",
          github_url: null,
          portfolio_url: "https://portfolio.example.com/user2",
          position_tags: [{ positions: { id: 3, name: "role3", is_deleted: false } }],
        },
      ]);
      // エラーがないことを確認
      expect(response.error).toBeNull();
    });

    /**
     * 異常系: エラー時に data が null で返ること。
     */
    it("異常系: エラー時は data=null を返す", async () => {
      const consoleError = jest.spyOn(console, "error").mockImplementation(() => {}); // console.error を無効化
      const result = { data: null, error: { message: "failed" } };
      const builder = createQueryBuilder("order", result); // order 終端のクエリビルダーを生成
      const supabase = {
        from: jest.fn(() => builder),
      };
      createServerSupabaseClientMock.mockResolvedValue(supabase); // サーバー用 Supabase クライアント生成をモック

      const response = await fetchActiveUsers();

      // console.log("fetchActiveUsers error response", response);

      // エラー時に data=null が返ることを確認
      expect(response).toEqual({ data: null, error: result.error });
      // エラーログが出力されることを確認
      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore(); // console.error のモックを復元
    });

    /**
     * 境界: data が null の場合は null を返すこと。
     */
    it("境界: data が null の場合は null を返す", async () => {
      const result = { data: null, error: null };
      const builder = createQueryBuilder("order", result); // order 終端のクエリビルダーを生成
      const supabase = {
        from: jest.fn(() => builder),
      };
      createServerSupabaseClientMock.mockResolvedValue(supabase); // サーバー用 Supabase クライアント生成をモック

      const response = await fetchActiveUsers();

      // console.log("fetchActiveUsers null response", response);

      // data が null の場合は null を返すことを確認
      expect(response).toEqual({ data: null, error: null });
    });

    /**
     * 境界: positions が空配列/未定義の場合は除外されること。
     */
    it("境界: positions が空配列/未定義の場合は除外される", async () => {
      const result = {
        data: [
          {
            id: 3,
            display_name: "ユーザー3",
            bio: "bio3",
            avatar_url: "avatar3",
            position_tags: [
              { positions: [] },
              { positions: undefined },
              { positions: { id: 4, name: "role4", is_deleted: false } },
            ],
          },
        ],
        error: null,
      };
      const builder = createQueryBuilder("order", result); // order 終端のクエリビルダーを生成
      const supabase = {
        from: jest.fn(() => builder),
      };
      createServerSupabaseClientMock.mockResolvedValue(supabase); // サーバー用 Supabase クライアント生成をモック

      const response = await fetchActiveUsers();

      // console.log("fetchActiveUsers empty positions response", response);

      // positions が空/未定義の要素が除外されることを確認
      expect(response.data).toEqual([
        {
          id: 3,
          display_name: "ユーザー3",
          bio: "bio3",
          avatar_url: "avatar3",
          position_tags: [{ positions: { id: 4, name: "role4", is_deleted: false } }],
        },
      ]);
      // エラーがないことを確認
      expect(response.error).toBeNull();
    });
  });

  /**
   * users サービスの承認待ちユーザー取得テスト。
   */
  describe("fetchApprovalUsers", () => {
    /**
     * 正常系: 承認待ちユーザー一覧を取得できること。
     */
    it("正常系: 承認待ちユーザー一覧を取得できる", async () => {
      const result = { data: [{ id: 1, display_name: "user", email: "a@b" }], error: null };
      const builder = createQueryBuilderWithEqResult(2, result); // eq 終端のクエリビルダーを生成
      const supabase = {
        from: jest.fn(() => builder),
      };
      createServerSupabaseClientMock.mockResolvedValue(supabase); // サーバー用 Supabase クライアント生成をモック

      const response = await fetchApprovalUsers();

      // console.log("fetchApprovalUsers response", response);

      // select の取得カラムが正しいことを確認
      expect(builder.select).toHaveBeenCalledWith("id, display_name, email");
      // is_deleted=false で絞り込んでいることを確認
      expect(builder.eq).toHaveBeenCalledWith("is_deleted", false);
      // status=pending で絞り込んでいることを確認
      expect(builder.eq).toHaveBeenCalledWith("status", "pending");
      // 取得結果が期待通り返ることを確認
      expect(response).toEqual({ data: result.data, error: null });
    });

    /**
     * 異常系: エラー時に data が null で返ること。
     */
    it("異常系: エラー時は data=null を返す", async () => {
      const consoleError = jest.spyOn(console, "error").mockImplementation(() => {}); // console.error を無効化
      const result = { data: null, error: { message: "failed" } };
      const builder = createQueryBuilderWithEqResult(2, result); // eq 終端のクエリビルダーを生成
      const supabase = {
        from: jest.fn(() => builder),
      };
      createServerSupabaseClientMock.mockResolvedValue(supabase); // サーバー用 Supabase クライアント生成をモック

      const response = await fetchApprovalUsers();

      // console.log("fetchApprovalUsers error response", response);

      // エラー時に data=null が返ることを確認
      expect(response).toEqual({ data: null, error: result.error });
      // エラーログが出力されることを確認
      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore(); // console.error のモックを復元
    });
  });

  /**
   * users サービスのユーザー詳細取得テスト。
   */
  describe("fetchUserByAuthIdInServer", () => {
    /**
     * 正常系: ユーザー詳細を取得できること。
     */
    it("正常系: ユーザー詳細を取得できる", async () => {
      const result = { data: { id: 1, auth_id: "auth-5" }, error: null };
      const builder = createQueryBuilder("maybeSingle", result); // maybeSingle 終端のクエリビルダーを生成
      const supabase = {
        from: jest.fn(() => builder),
      };
      createServerSupabaseClientMock.mockResolvedValue(supabase); // サーバー用 Supabase クライアント生成をモック

      const response = await fetchUserByAuthIdInServer({ authId: "auth-5" });

      // console.log("fetchUserByAuthIdInServer response", response);

      // select の取得カラムが正しいことを確認
      expect(builder.select).toHaveBeenCalledWith("*");
      // auth_id で絞り込んでいることを確認
      expect(builder.eq).toHaveBeenCalledWith("auth_id", "auth-5");
      // is_deleted=false で絞り込んでいることを確認
      expect(builder.eq).toHaveBeenCalledWith("is_deleted", false);
      // 取得結果が期待通り返ることを確認
      expect(response).toEqual({ data: result.data, error: null });
    });

    /**
     * 異常系: エラー時に data が null で返ること。
     */
    it("異常系: エラー時は data=null を返す", async () => {
      const consoleError = jest.spyOn(console, "error").mockImplementation(() => {}); // console.error を無効化
      const result = { data: null, error: { message: "failed" } };
      const builder = createQueryBuilder("maybeSingle", result); // maybeSingle 終端のクエリビルダーを生成
      const supabase = {
        from: jest.fn(() => builder),
      };
      createServerSupabaseClientMock.mockResolvedValue(supabase); // サーバー用 Supabase クライアント生成をモック

      const response = await fetchUserByAuthIdInServer({ authId: "auth-6" });

      // console.log("fetchUserByAuthIdInServer error response", response);

      // エラー時に data=null が返ることを確認
      expect(response).toEqual({ data: null, error: result.error });
      // エラーログが出力されることを確認
      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore(); // console.error のモックを復元
    });

    /**
     * 異常系: データなしの場合は data=null を返すこと。
     */
    it("異常系: データなしの場合は data=null を返す", async () => {
      const consoleError = jest.spyOn(console, "error").mockImplementation(() => {}); // console.error を無効化
      const result = { data: null, error: null };
      const builder = createQueryBuilder("maybeSingle", result); // maybeSingle 終端のクエリビルダーを生成
      const supabase = {
        from: jest.fn(() => builder),
      };
      createServerSupabaseClientMock.mockResolvedValue(supabase); // サーバー用 Supabase クライアント生成をモック

      const response = await fetchUserByAuthIdInServer({ authId: "auth-7" });

      // console.log("fetchUserByAuthIdInServer no data response", response);

      // データなしの場合に data=null が返ることを確認
      expect(response).toEqual({ data: null, error: null });
      // エラーログが出力されることを確認
      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore(); // console.error のモックを復元
    });
  });

  /**
   * users サービスのプロフィール更新テスト。
   */
  describe("updateUserProfileServerInServer", () => {
    /**
     * 正常系: 更新成功時は null を返すこと。
     */
    it("正常系: 更新が成功した場合は null を返す", async () => {
      const result = { data: { id: 1 }, error: null };
      const builder = createQueryBuilder("single", result); // single 終端のクエリビルダーを生成
      const supabase = {
        from: jest.fn(() => builder),
      };
      createServerSupabaseClientMock.mockResolvedValue(supabase); // サーバー用 Supabase クライアント生成をモック

      const response = await updateUserProfileServerInServer({
        id: 1,
        displayName: "テストユーザー",
        bio: "テスト",
        x_url: null,
        facebook_url: null,
        instagram_url: null,
        github_url: null,
        portfolio_url: null,
      });

      // console.log("updateUserProfileServerInServer response", response);

      // update の更新内容が正しいことを確認
      expect(builder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          display_name: "テストユーザー",
          bio: "テスト",
          updated_at: expect.any(String),
        })
      );
      // 対象IDで更新していることを確認
      expect(builder.eq).toHaveBeenCalledWith("id", 1);
      // select が呼ばれることを確認
      expect(builder.select).toHaveBeenCalled();
      // single が呼ばれることを確認
      expect(builder.single).toHaveBeenCalled();
      // 成功時は null が返ることを確認
      expect(response).toBeNull();
    });

    /**
     * 異常系: 更新失敗時はエラーを返すこと。
     */
    it("異常系: 更新に失敗した場合はエラーを返す", async () => {
      const consoleError = jest.spyOn(console, "error").mockImplementation(() => {}); // console.error を無効化
      const result = { data: null, error: { message: "update failed" } };
      const builder = createQueryBuilder("single", result); // single 終端のクエリビルダーを生成
      const supabase = {
        from: jest.fn(() => builder),
      };
      createServerSupabaseClientMock.mockResolvedValue(supabase); // サーバー用 Supabase クライアント生成をモック

      const response = await updateUserProfileServerInServer({
        id: 2,
        displayName: "テストユーザー",
        bio: "テスト",
        x_url: null,
        facebook_url: null,
        instagram_url: null,
        github_url: null,
        portfolio_url: null,
      });

      // console.log("updateUserProfileServerInServer error response", response);

      // エラー内容が返ることを確認
      expect(response).toEqual(result.error);
      // エラーログが出力されることを確認
      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore(); // console.error のモックを復元
    });
  });
});

/**
 * supabase-server.ts の単体テスト。
 */
describe("supabase-server", () => {
  const createServerClientMock = createServerClient as jest.Mock;
  const cookiesMock = cookies as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * createServerSupabaseClient の動作検証。
   */
  describe("createServerSupabaseClient", () => {
    it("cookieStore から cookies を渡して Supabase クライアントを生成する", async () => {
      const cookieStore = {
        getAll: jest.fn(() => [{ name: "session", value: "value" }]),
        set: jest.fn(),
      };
      const mockSupabase = { from: jest.fn() };

      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";

      cookiesMock.mockResolvedValue(cookieStore); // cookies 取得の戻り値を設定
      createServerClientMock.mockReturnValue(mockSupabase);

      const response = await supabaseServerActual.createServerSupabaseClient();

      // console.log("createServerSupabaseClient response", response);

      // Supabase URL/Key でクライアント生成されたことを確認
      expect(createServerClientMock).toHaveBeenCalledWith(
        "https://example.supabase.co",
        "anon-key",
        expect.any(Object)
      );

      const options = createServerClientMock.mock.calls[0][2];
      // cookieStore の値が渡されることを確認
      expect(options.cookies.getAll()).toEqual([{ name: "session", value: "value" }]);

      options.cookies.setAll([
        {
          name: "session",
          value: "value",
          options: {},
        },
      ]);
      // cookieStore.set が呼ばれることを確認
      expect(cookieStore.set).toHaveBeenCalledWith("session", "value", {});
      // 生成された Supabase クライアントが返ることを確認
      expect(response).toBe(mockSupabase);
    });

    it("cookieStore.set が失敗しても例外を投げない", async () => {
      const cookieStore = {
        getAll: jest.fn(() => [{ name: "session", value: "value" }]),
        set: jest.fn(() => {
          throw new Error("set failed");
        }),
      };
      const mockSupabase = { from: jest.fn() };

      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";

      cookiesMock.mockResolvedValue(cookieStore); // cookies 取得の戻り値を設定
      createServerClientMock.mockReturnValue(mockSupabase);

      const response = await supabaseServerActual.createServerSupabaseClient();

      // console.log("createServerSupabaseClient set error response", response);

      const options = createServerClientMock.mock.calls[0][2];
      // setAll で例外が発生しても投げないことを確認
      expect(() =>
        options.cookies.setAll([
          {
            name: "session",
            value: "value",
            options: {},
          },
        ])
      ).not.toThrow();
      // 生成された Supabase クライアントが返ることを確認
      expect(response).toBe(mockSupabase);
    });
  });

  /**
   * getServerCurrentUser の動作検証。
   */
  describe("getServerCurrentUser", () => {
    it("正常系: 認証ユーザーの authId を返す", async () => {
      const cookieStore = {
        getAll: jest.fn(() => []),
        set: jest.fn(),
      };
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({ // getUser の戻り値を設定
            data: { user: { id: "auth-123" } },
            error: null,
          }),
        },
      };

      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";

      cookiesMock.mockResolvedValue(cookieStore); // cookies 取得の戻り値を設定
      createServerClientMock.mockReturnValue(mockSupabase);

      const response = await supabaseServerActual.getServerCurrentUser();

      // console.log("getServerCurrentUser response", response);

      // getUser が1回呼ばれることを確認
      expect(mockSupabase.auth.getUser).toHaveBeenCalledTimes(1);
      // authId が返ることを確認
      expect(response).toEqual({ authId: "auth-123", error: null });
    });

    it("異常系: エラー時は authId 空文字を返す", async () => {
      const consoleError = jest.spyOn(console, "error").mockImplementation(() => {}); // console.error を無効化
      const cookieStore = {
        getAll: jest.fn(() => []),
        set: jest.fn(),
      };
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({ // getUser の戻り値を設定
            data: null,
            error: { message: "failed" },
          }),
        },
      };

      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";

      cookiesMock.mockResolvedValue(cookieStore); // cookies 取得の戻り値を設定
      createServerClientMock.mockReturnValue(mockSupabase);

      const response = await supabaseServerActual.getServerCurrentUser();

      // console.log("getServerCurrentUser error response", response);

      // getUser が1回呼ばれることを確認
      expect(mockSupabase.auth.getUser).toHaveBeenCalledTimes(1);
      // エラー時に空文字が返ることを確認
      expect(response).toEqual({ authId: "", error: { message: "failed" } });
      // エラーログが出力されることを確認
      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore(); // console.error のモックを復元
    });

    it("異常系: データなしの場合は authId 空文字を返す", async () => {
      const consoleError = jest.spyOn(console, "error").mockImplementation(() => {}); // console.error を無効化
      const cookieStore = {
        getAll: jest.fn(() => []),
        set: jest.fn(),
      };
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({ // getUser の戻り値を設定
            data: null,
            error: null,
          }),
        },
      };

      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";

      cookiesMock.mockResolvedValue(cookieStore); // cookies 取得の戻り値を設定
      createServerClientMock.mockReturnValue(mockSupabase);

      const response = await supabaseServerActual.getServerCurrentUser();

      // console.log("getServerCurrentUser no data response", response);

      // getUser が1回呼ばれることを確認
      expect(mockSupabase.auth.getUser).toHaveBeenCalledTimes(1);
      // データなしの場合に空文字が返ることを確認
      expect(response).toEqual({ authId: "", error: null });
      // 既定文言でエラーログが出力されることを確認
      expect(consoleError).toHaveBeenCalledWith(
        "認証ユーザー情報取得エラー:",
        "No data found"
      );
      consoleError.mockRestore(); // console.error のモックを復元
    });
  });
});
