import { getServerAuth } from "../../app/services/auth/server-auth";
import { createServerSupabaseClient } from "../../app/services/api/supabase-server";

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
  single: jest.Mock;
};

/**
 * single が終端で結果を返すクエリビルダーを生成する。
 * @param result - 返却するクエリ結果
 * @returns チェーン可能なクエリビルダー
 */
const createQueryBuilder = (result: QueryResult) => {
  const builder: Partial<QueryBuilder> = {};

  builder.select = jest.fn(() => builder);
  builder.eq = jest.fn(() => builder);
  builder.single = jest.fn(() => Promise.resolve(result));

  return builder as QueryBuilder;
};

/**
 * Supabase クライアント生成関数をモック化する。
 */
jest.mock("../../app/services/api/supabase-server", () => ({
  ...jest.requireActual("../../app/services/api/supabase-server"),
  createServerSupabaseClient: jest.fn(),
}));

/**
 * server-auth の単体テスト。
 */
describe("getServerAuth", () => {
  /**
   * createServerSupabaseClient の Jest モック参照。
   */
  const createServerSupabaseClientMock = createServerSupabaseClient as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * 認証エラー時の動作を確認する。
   */
  it("認証エラー時は user=null を返す", async () => {
    const supabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
          error: { message: "auth failed" },
        }),
      },
      from: jest.fn(),
    };
    createServerSupabaseClientMock.mockResolvedValue(supabase);

    const response = await getServerAuth();

    // 認証エラー時の戻り値が期待どおりであることを確認
    expect(response).toEqual({ user: null, userStatus: null });
    // ユーザー情報取得が行われないことを確認
    expect(supabase.from).not.toHaveBeenCalled();
  });

  /**
   * 未認証時の動作を確認する。
   */
  it("未認証時は user=null を返す", async () => {
    const supabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
      from: jest.fn(),
    };
    createServerSupabaseClientMock.mockResolvedValue(supabase);

    const response = await getServerAuth();

    // 未認証時の戻り値が期待どおりであることを確認
    expect(response).toEqual({ user: null, userStatus: null });
    // ユーザー情報取得が行われないことを確認
    expect(supabase.from).not.toHaveBeenCalled();
  });

  /**
   * ユーザー情報取得失敗時の動作を確認する。
   */
  it("ユーザー情報取得に失敗した場合はエラー文言を返す", async () => {
    const user = { id: "auth-1" };
    const result = { data: null, error: { message: "not found" } };
    const builder = createQueryBuilder(result);
    const supabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user },
          error: null,
        }),
      },
      from: jest.fn(() => builder),
    };
    createServerSupabaseClientMock.mockResolvedValue(supabase);

    const response = await getServerAuth();

    // users テーブルへの問い合わせが行われることを確認
    expect(supabase.from).toHaveBeenCalledWith("users");
    // status カラムを取得していることを確認
    expect(builder.select).toHaveBeenCalledWith("status");
    // auth_id の条件が付与されることを確認
    expect(builder.eq).toHaveBeenCalledWith("auth_id", user.id);
    // 論理削除除外の条件が付与されることを確認
    expect(builder.eq).toHaveBeenCalledWith("is_deleted", false);
    // 単一取得が行われることを確認
    expect(builder.single).toHaveBeenCalled();
    // エラーメッセージが期待どおり返ることを確認
    expect(response).toEqual({
      user,
      userStatus: null,
      error: "ユーザー情報が見つかりません",
    });
  });

  /**
   * ユーザー情報が空の場合の動作を確認する。
   */
  it("ユーザー情報が空の場合はエラー文言を返す", async () => {
    const user = { id: "auth-2" };
    const result = { data: null, error: null };
    const builder = createQueryBuilder(result);
    const supabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user },
          error: null,
        }),
      },
      from: jest.fn(() => builder),
    };
    createServerSupabaseClientMock.mockResolvedValue(supabase);

    const response = await getServerAuth();

    // 空データ時にエラーメッセージが返ることを確認
    expect(response).toEqual({
      user,
      userStatus: null,
      error: "ユーザー情報が見つかりません",
    });
  });

  /**
   * ステータス別の戻り値を確認する。
   */
  it.each(["pending", "active", "rejected"])(
    "userStatus=%s を返す",
    async (status) => {
      const user = { id: "auth-3" };
      const result = { data: { status }, error: null };
      const builder = createQueryBuilder(result);
      const supabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user },
            error: null,
          }),
        },
        from: jest.fn(() => builder),
      };
      createServerSupabaseClientMock.mockResolvedValue(supabase);

      const response = await getServerAuth();

      // ステータスがそのまま返ることを確認
      expect(response).toEqual({
        user,
        userStatus: status,
      });
    }
  );

  /**
   * 例外発生時の動作を確認する。
   */
  it("例外時はサーバー認証エラーを返す", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    createServerSupabaseClientMock.mockRejectedValue(new Error("boom"));

    const response = await getServerAuth();

    // 例外時の戻り値が期待どおりであることを確認
    expect(response).toEqual({
      user: null,
      userStatus: null,
      error: "サーバー認証エラーが発生しました",
    });
    // エラーログが出力されることを確認
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});