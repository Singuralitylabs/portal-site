import { fetchMasterManagementData } from "../../../app/services/api/master-server";
import { createServerSupabaseClient } from "../../../app/services/api/supabase-server";

jest.mock("../../../app/services/api/supabase-server", () => ({
  createServerSupabaseClient: jest.fn(),
}));

const createOrderBuilder = (result: { data: unknown[] | null; error: unknown }) => ({
  select: jest.fn().mockReturnThis(),
  order: jest.fn().mockResolvedValue(result),
});

const createInBuilder = (result: { data: unknown[] | null; error: unknown }) => ({
  select: jest.fn().mockReturnThis(),
  in: jest.fn().mockResolvedValue(result),
});

describe("fetchMasterManagementData", () => {
  const createServerSupabaseClientMock = createServerSupabaseClient as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("users 参照がRLSで0件になる論理削除ユーザーは退会済みユーザーとして扱う", async () => {
    const supabase = {
      from: jest
        .fn()
        .mockReturnValueOnce(
          createOrderBuilder({
            data: [
              {
                id: 1,
                name: "資料",
                category_id: 10,
                assignee: null,
                assignee_id: 999,
                description: null,
                url: "https://example.com",
                display_order: 1,
                is_deleted: false,
                created_by: 999,
                updated_by: 999,
                created_at: "2024-01-01T00:00:00Z",
                updated_at: "2024-01-02T00:00:00Z",
              },
            ],
            error: null,
          })
        )
        .mockReturnValueOnce(createOrderBuilder({ data: [], error: null }))
        .mockReturnValueOnce(createOrderBuilder({ data: [{ id: 10, name: "共通" }], error: null }))
        .mockReturnValueOnce(createOrderBuilder({ data: [], error: null }))
        .mockReturnValueOnce(createOrderBuilder({ data: [], error: null }))
        .mockReturnValueOnce(createInBuilder({ data: [{ id: 10, name: "共通" }], error: null }))
        .mockReturnValueOnce(createInBuilder({ data: [], error: null })),
    };
    createServerSupabaseClientMock.mockResolvedValue(supabase);

    const result = await fetchMasterManagementData();

    expect(result.error).toBeNull();
    const documents = result.data?.tables.find(table => table.tableName === "documents");
    const assignee = documents?.records[0].fields.find(field => field.key === "assignee_id");
    // users テーブルでは論理削除レコードが RLS で非表示になるため、参照 0 件として扱う。
    expect(assignee?.referenceLabel).toBe("退会済みユーザー");
  });

  it("マスター本体テーブルの取得エラーは後続処理を行わず返す", async () => {
    const documentsError = { message: "documents failed" };
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    const supabase = {
      from: jest
        .fn()
        .mockReturnValueOnce(createOrderBuilder({ data: null, error: documentsError }))
        .mockReturnValueOnce(createOrderBuilder({ data: [], error: null }))
        .mockReturnValueOnce(createOrderBuilder({ data: [], error: null }))
        .mockReturnValueOnce(createOrderBuilder({ data: [], error: null }))
        .mockReturnValueOnce(createOrderBuilder({ data: [], error: null })),
    };
    createServerSupabaseClientMock.mockResolvedValue(supabase);

    const result = await fetchMasterManagementData();

    expect(result).toEqual({ data: null, error: documentsError });
    expect(createServerSupabaseClientMock).toHaveBeenCalledTimes(1);
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("categories 参照の取得エラーはデータ取得エラーとして返す", async () => {
    const categoriesError = { message: "categories failed" };
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    const supabase = {
      from: jest
        .fn()
        .mockReturnValueOnce(
          createOrderBuilder({
            data: [
              {
                id: 1,
                name: "資料",
                category_id: 10,
                assignee: null,
                assignee_id: 999,
                description: null,
                url: "https://example.com",
                display_order: 1,
                is_deleted: false,
                created_by: 999,
                updated_by: 999,
                created_at: "2024-01-01T00:00:00Z",
                updated_at: "2024-01-02T00:00:00Z",
              },
            ],
            error: null,
          })
        )
        .mockReturnValueOnce(createOrderBuilder({ data: [], error: null }))
        .mockReturnValueOnce(createOrderBuilder({ data: [], error: null }))
        .mockReturnValueOnce(createOrderBuilder({ data: [], error: null }))
        .mockReturnValueOnce(createOrderBuilder({ data: [], error: null }))
        .mockReturnValueOnce(createInBuilder({ data: null, error: categoriesError }))
        .mockReturnValueOnce(createInBuilder({ data: [], error: null })),
    };
    createServerSupabaseClientMock.mockResolvedValue(supabase);

    const result = await fetchMasterManagementData();

    expect(result).toEqual({ data: null, error: categoriesError });
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("users 参照の取得エラーはデータ取得エラーとして返す", async () => {
    const usersError = { message: "users failed" };
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    const supabase = {
      from: jest
        .fn()
        .mockReturnValueOnce(createOrderBuilder({ data: [], error: null }))
        .mockReturnValueOnce(createOrderBuilder({ data: [], error: null }))
        .mockReturnValueOnce(createOrderBuilder({ data: [], error: null }))
        .mockReturnValueOnce(
          createOrderBuilder({
            data: [
              {
                id: 1,
                name: "アプリ",
                description: "説明",
                url: "https://example.com",
                category_id: 10,
                developer_id: 999,
                thumbnail_path: null,
                display_order: 1,
                is_deleted: false,
                created_by: 999,
                updated_by: 999,
                created_at: "2024-01-01T00:00:00Z",
                updated_at: "2024-01-02T00:00:00Z",
              },
            ],
            error: null,
          })
        )
        .mockReturnValueOnce(createOrderBuilder({ data: [], error: null }))
        .mockReturnValueOnce(createInBuilder({ data: [{ id: 10, name: "共通" }], error: null }))
        .mockReturnValueOnce(createInBuilder({ data: null, error: usersError })),
    };
    createServerSupabaseClientMock.mockResolvedValue(supabase);

    const result = await fetchMasterManagementData();

    expect(result).toEqual({ data: null, error: usersError });
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
