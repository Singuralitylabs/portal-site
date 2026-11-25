import { updateUserPositionTagsInServer } from "../../../app/services/api/users-server";
import {
  createServerSupabaseClient,
  getServerCurrentUser,
} from "../../../app/services/api/supabase-server";

/**
 * updateUserPositionTagsInServer の単体テスト（役職タグ変更の認可ロジック）。
 * - 対象スクリプト: app/services/api/users-server.ts
 * - 検証観点:
 *   1) admin / maintainer は役職タグを置き換えられる（重複IDは除去される）
 *   2) member など admin・maintainer 以外は 42501 を返し、DB操作を行わない
 *   3) 認証・ロール取得・削除・挿入の各エラーをそのまま返す
 *   4) 空配列の場合は削除のみ行い、挿入しない
 *
 * 注意: ここで検証するのはアプリ層の判定のみ。最終的な防御は RLS（docs/database.md 4.7）が担う。
 */

jest.mock("../../../app/services/api/supabase-server", () => ({
  ...jest.requireActual("../../../app/services/api/supabase-server"),
  createServerSupabaseClient: jest.fn(),
  getServerCurrentUser: jest.fn(),
}));

type Result = { data?: unknown; error: unknown };

type SupabaseMockOptions = {
  currentUser?: Result;
  deleteResult?: Result;
  insertResult?: Result;
};

const createSupabaseMock = ({
  currentUser = { data: { role: "admin" }, error: null },
  deleteResult = { error: null },
  insertResult = { error: null },
}: SupabaseMockOptions = {}) => {
  const usersBuilder = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue(currentUser),
  };
  const deleteBuilder = {
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockResolvedValue(deleteResult),
  };
  const insertBuilder = {
    insert: jest.fn().mockResolvedValue(insertResult),
  };

  const positionTagsCalls = [deleteBuilder, insertBuilder];
  let positionTagsIndex = 0;

  const supabase = {
    from: jest.fn((table: string) => {
      if (table === "users") {
        return usersBuilder;
      }
      if (table === "position_tags") {
        return positionTagsCalls[positionTagsIndex++];
      }
      throw new Error(`想定外のテーブル: ${table}`);
    }),
  };

  return { supabase, usersBuilder, deleteBuilder, insertBuilder };
};

const authenticatedAs = (authId: string) => {
  (getServerCurrentUser as jest.Mock).mockResolvedValue({ authId, error: null });
};

describe("updateUserPositionTagsInServer", () => {
  const createServerSupabaseClientMock = createServerSupabaseClient as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
    authenticatedAs("auth-user-1");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it.each(["admin", "maintainer"])(
    "role が %s の場合は既存の役職タグを削除し、重複を除いて挿入する",
    async role => {
      const { supabase, deleteBuilder, insertBuilder } = createSupabaseMock({
        currentUser: { data: { role }, error: null },
      });
      createServerSupabaseClientMock.mockResolvedValue(supabase);

      const result = await updateUserPositionTagsInServer(42, [1, 2, 2, 3]);

      expect(result).toBeNull();
      expect(deleteBuilder.eq).toHaveBeenCalledWith("user_id", 42);
      expect(insertBuilder.insert).toHaveBeenCalledWith([
        { user_id: 42, position_id: 1 },
        { user_id: 42, position_id: 2 },
        { user_id: 42, position_id: 3 },
      ]);
    }
  );

  it("role が member の場合は 42501 を返し、削除・挿入を行わない", async () => {
    const { supabase, deleteBuilder, insertBuilder } = createSupabaseMock({
      currentUser: { data: { role: "member" }, error: null },
    });
    createServerSupabaseClientMock.mockResolvedValue(supabase);

    const result = await updateUserPositionTagsInServer(42, [1]);

    expect(result).toMatchObject({ code: "42501" });
    expect(deleteBuilder.delete).not.toHaveBeenCalled();
    expect(insertBuilder.insert).not.toHaveBeenCalled();
  });

  it("認証エラーが発生した場合はそのエラーを返す", async () => {
    const authError = { name: "AuthApiError", message: "unauthorized", status: 401 };
    (getServerCurrentUser as jest.Mock).mockResolvedValue({ authId: "", error: authError });
    const { supabase, deleteBuilder } = createSupabaseMock();
    createServerSupabaseClientMock.mockResolvedValue(supabase);

    const result = await updateUserPositionTagsInServer(42, [1]);

    expect(result).toBe(authError);
    expect(deleteBuilder.delete).not.toHaveBeenCalled();
  });

  it("authId が空の場合は PGRST116 を返す", async () => {
    authenticatedAs("");
    const { supabase, deleteBuilder } = createSupabaseMock();
    createServerSupabaseClientMock.mockResolvedValue(supabase);

    const result = await updateUserPositionTagsInServer(42, [1]);

    expect(result).toMatchObject({ code: "PGRST116" });
    expect(deleteBuilder.delete).not.toHaveBeenCalled();
  });

  it("ロール取得でエラーが発生した場合はそのエラーを返す", async () => {
    const roleError = {
      code: "500",
      message: "db error",
      details: "",
      hint: "",
      name: "PostgrestError",
    };
    const { supabase, deleteBuilder } = createSupabaseMock({
      currentUser: { data: null, error: roleError },
    });
    createServerSupabaseClientMock.mockResolvedValue(supabase);

    const result = await updateUserPositionTagsInServer(42, [1]);

    expect(result).toBe(roleError);
    expect(deleteBuilder.delete).not.toHaveBeenCalled();
  });

  it("削除でエラーが発生した場合は挿入せずにエラーを返す", async () => {
    const deleteError = {
      code: "500",
      message: "delete failed",
      details: "",
      hint: "",
      name: "PostgrestError",
    };
    const { supabase, insertBuilder } = createSupabaseMock({
      deleteResult: { error: deleteError },
    });
    createServerSupabaseClientMock.mockResolvedValue(supabase);

    const result = await updateUserPositionTagsInServer(42, [1]);

    expect(result).toBe(deleteError);
    expect(insertBuilder.insert).not.toHaveBeenCalled();
  });

  it("挿入でエラーが発生した場合はそのエラーを返す", async () => {
    const insertError = {
      code: "23503",
      message: "fk violation",
      details: "",
      hint: "",
      name: "PostgrestError",
    };
    const { supabase } = createSupabaseMock({
      insertResult: { error: insertError },
    });
    createServerSupabaseClientMock.mockResolvedValue(supabase);

    const result = await updateUserPositionTagsInServer(42, [1]);

    expect(result).toBe(insertError);
  });

  it("positionIds が空配列の場合は削除のみ行い、挿入しない", async () => {
    const { supabase, deleteBuilder, insertBuilder } = createSupabaseMock();
    createServerSupabaseClientMock.mockResolvedValue(supabase);

    const result = await updateUserPositionTagsInServer(42, []);

    expect(result).toBeNull();
    expect(deleteBuilder.delete).toHaveBeenCalled();
    expect(insertBuilder.insert).not.toHaveBeenCalled();
  });
});
