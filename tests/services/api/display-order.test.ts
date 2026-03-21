import { reorderItemsInCategory } from "../../../app/services/api/utils/display-order";
import { createClientSupabaseClient } from "../../../app/services/api/supabase-client";

jest.mock("../../../app/services/api/supabase-client", () => ({
  createClientSupabaseClient: jest.fn(),
}));

type QueryResult = { data: unknown; error: { message: string } | null };

const createSelectOrderBuilder = (result: QueryResult) => {
  const builder: { select?: jest.Mock; eq?: jest.Mock; order?: jest.Mock } = {};
  builder.select = jest.fn(() => builder);
  builder.eq = jest.fn(() => builder);
  builder.order = jest.fn(() => Promise.resolve(result));
  return builder as Required<typeof builder>;
};

const createUpdateBuilder = (result: QueryResult) => {
  const builder: { update?: jest.Mock; eq?: jest.Mock } = {};
  builder.update = jest.fn(() => builder);
  builder.eq = jest.fn(() => Promise.resolve(result));
  return builder as Required<typeof builder>;
};

describe("display-order reorderItemsInCategory", () => {
  const createClientSupabaseClientMock = createClientSupabaseClient as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("デフォルトでは削除済みを除外して再採番する", async () => {
    const selectBuilder = createSelectOrderBuilder({
      data: [
        { id: 10, is_deleted: false },
        { id: 20, is_deleted: false },
      ],
      error: null,
    });
    const updateBuilder1 = createUpdateBuilder({ data: null, error: null });
    const updateBuilder2 = createUpdateBuilder({ data: null, error: null });

    const supabase = { from: jest.fn() };
    supabase.from
      .mockReturnValueOnce(selectBuilder)
      .mockReturnValueOnce(updateBuilder1)
      .mockReturnValueOnce(updateBuilder2);
    createClientSupabaseClientMock.mockReturnValue(supabase);

    await reorderItemsInCategory("documents", 1);

    expect(selectBuilder.eq).toHaveBeenNthCalledWith(1, "category_id", 1);
    expect(selectBuilder.eq).toHaveBeenNthCalledWith(2, "is_deleted", false);
    expect(updateBuilder1.update).toHaveBeenCalledWith({ display_order: 1 });
    expect(updateBuilder2.update).toHaveBeenCalledWith({ display_order: 2 });
  });

  it("includeDeleted=true でも削除済み行は更新対象に含めない", async () => {
    const selectBuilder = createSelectOrderBuilder({
      data: [
        { id: 10, is_deleted: false },
        { id: 20, is_deleted: true },
        { id: 30, is_deleted: false },
      ],
      error: null,
    });
    const updateBuilder1 = createUpdateBuilder({ data: null, error: null });
    const updateBuilder2 = createUpdateBuilder({ data: null, error: null });

    const supabase = { from: jest.fn() };
    supabase.from
      .mockReturnValueOnce(selectBuilder)
      .mockReturnValueOnce(updateBuilder1)
      .mockReturnValueOnce(updateBuilder2);
    createClientSupabaseClientMock.mockReturnValue(supabase);

    await reorderItemsInCategory("documents", 2, { includeDeleted: true });

    expect(selectBuilder.eq).toHaveBeenCalledTimes(1);
    expect(updateBuilder1.eq).toHaveBeenCalledWith("id", 10);
    expect(updateBuilder2.eq).toHaveBeenCalledWith("id", 30);
    expect(updateBuilder1.update).toHaveBeenCalledWith({ display_order: 1 });
    expect(updateBuilder2.update).toHaveBeenCalledWith({ display_order: 2 });
  });

  it("一覧取得でエラーなら例外を投げる", async () => {
    const selectBuilder = createSelectOrderBuilder({
      data: null,
      error: { message: "select failed" },
    });
    const supabase = { from: jest.fn(() => selectBuilder) };
    createClientSupabaseClientMock.mockReturnValue(supabase);

    await expect(reorderItemsInCategory("documents", 3)).rejects.toThrow(
      "並び順再採番対象の取得に失敗しました: select failed"
    );
  });

  it("更新でエラーなら例外を投げる", async () => {
    const selectBuilder = createSelectOrderBuilder({
      data: [{ id: 10, is_deleted: false }],
      error: null,
    });
    const updateBuilder = createUpdateBuilder({
      data: null,
      error: { message: "update failed" },
    });

    const supabase = { from: jest.fn() };
    supabase.from.mockReturnValueOnce(selectBuilder).mockReturnValueOnce(updateBuilder);
    createClientSupabaseClientMock.mockReturnValue(supabase);

    await expect(reorderItemsInCategory("documents", 4)).rejects.toThrow(
      "並び順再採番に失敗しました(id: 10): update failed"
    );
  });
});
