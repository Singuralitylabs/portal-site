jest.mock("../../../../app/services/api/supabase-client", () => ({
  createClientSupabaseClient: jest.fn(),
}));

import { createClientSupabaseClient } from "../../../../app/services/api/supabase-client";
import {
  calculateDisplayOrder,
  getItemsByCategory,
  reorderItemsInCategory,
  shiftDisplayOrder,
} from "../../../../app/services/api/utils/display-order";

type QueryResponse<T> = {
  data?: T;
  error?: { message: string } | null;
};

type ChainableKey = "select" | "eq" | "neq" | "gte" | "order" | "limit" | "update";

type MockQueryBuilder<T> = {
  [Key in ChainableKey]: jest.Mock<MockQueryBuilder<T>, unknown[]>;
} & {
  single: jest.Mock<Promise<QueryResponse<T>>, []>;
  then: <TResult1 = QueryResponse<T>, TResult2 = never>(
    onfulfilled?: ((value: QueryResponse<T>) => TResult1 | PromiseLike<TResult1>) | undefined,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | undefined
  ) => Promise<TResult1 | TResult2>;
};

const createMockQueryBuilder = <T>(
  response: QueryResponse<T> = { data: undefined, error: null }
): MockQueryBuilder<T> => {
  const builder: MockQueryBuilder<T> = {
    select: jest.fn(),
    eq: jest.fn(),
    neq: jest.fn(),
    gte: jest.fn(),
    order: jest.fn(),
    limit: jest.fn(),
    update: jest.fn(),
    single: jest.fn(async () => response),
    then: (onfulfilled, onrejected) => Promise.resolve(response).then(onfulfilled, onrejected),
  };

  const chainableMethods: ChainableKey[] = [
    "select",
    "eq",
    "neq",
    "gte",
    "order",
    "limit",
    "update",
  ];

  chainableMethods.forEach((method) => {
    builder[method].mockReturnValue(builder);
  });

  return builder;
};

const mockCreateClientSupabaseClient =
  createClientSupabaseClient as jest.MockedFunction<typeof createClientSupabaseClient>;

beforeEach(() => {
  jest.clearAllMocks();
});

/**
 * @description getItemsByCategory の単体テストを定義する。
 */
describe("getItemsByCategory", () => {
  /**
   * @description excludeId を考慮したクエリでアイテムを取得できることを検証する。
   */
  it("正常系：excludeId 指定時に対象カテゴリのアイテムを取得できる", async () => {
    const mockData = [
      { id: 1, name: "Doc A", display_order: 1 },
      { id: 3, name: "Doc C", display_order: 2 },
    ];
    const selectBuilder = createMockQueryBuilder({ data: mockData, error: null });
    const supabaseStub = { from: jest.fn().mockReturnValue(selectBuilder) };
    mockCreateClientSupabaseClient.mockReturnValue(supabaseStub as never);

    const result = await getItemsByCategory("documents", 9, 3);

    expect(result).toEqual(mockData);
  });

  /**
   * @description Supabase エラー時に空配列を返す挙動を検証する。
   */
  it("異常系：Supabase エラー時にログ出力し空配列を返す", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();
    const selectBuilder = createMockQueryBuilder({
      data: undefined,
      error: { message: "fetch failed" },
    });
    const supabaseStub = { from: jest.fn().mockReturnValue(selectBuilder) };
    mockCreateClientSupabaseClient.mockReturnValue(supabaseStub as never);

    const result = await getItemsByCategory("documents", 1);

    expect(result).toEqual([]);
    expect(consoleSpy).toHaveBeenCalledWith("documents一覧取得エラー:", "fetch failed");

    consoleSpy.mockRestore();
  });
});

/**
 * @description calculateDisplayOrder の単体テストを定義する。
 */
describe("calculateDisplayOrder", () => {
  /**
   * @description 編集時に current を指定した場合の挙動を検証する。
   */
  it("正常系：current 指定時は Supabase を呼ばず現在の順序を返す", async () => {
    const result = await calculateDisplayOrder("documents", 1, { type: "current" }, 7);

    // expect: 現在の display_order をそのまま返す
    expect(result).toBe(7);
    // expect: Supabase クエリを発行しない
    expect(mockCreateClientSupabaseClient).not.toHaveBeenCalled();
  });

  /**
   * @description 最後尾へ配置するケースを検証する。
   */
  it("正常系：last 指定時は最大順序の後ろに配置する", async () => {
    const lastOrderBuilder = createMockQueryBuilder({ data: [{ display_order: 5 }], error: null });
    const supabaseStub = { from: jest.fn().mockReturnValue(lastOrderBuilder) };
    mockCreateClientSupabaseClient.mockReturnValue(supabaseStub as never);

    const result = await calculateDisplayOrder("videos", 4, { type: "last" });

    expect(result).toBe(6);
  });

  /**
   * @description last 指定でも対象データが無い場合のフォールバックを検証する。
   */
  it("異常系：last 指定でデータが無い場合は 1 を返す", async () => {
    const lastOrderBuilder = createMockQueryBuilder({ data: [], error: null });
    const supabaseStub = { from: jest.fn().mockReturnValue(lastOrderBuilder) };
    mockCreateClientSupabaseClient.mockReturnValue(supabaseStub as never);

    const result = await calculateDisplayOrder("videos", 4, { type: "last" });

    // expect: データが無い場合は 1 を返す
    expect(result).toBe(1);
  });

  /**
   * @description 指定 ID の直後に配置するケースを検証する。
   */
  it("正常系：after 指定時は基準 ID の直後に配置する", async () => {
    const afterBuilder = createMockQueryBuilder({ data: { display_order: 10 }, error: null });
    const supabaseStub = { from: jest.fn().mockReturnValue(afterBuilder) };
    mockCreateClientSupabaseClient.mockReturnValue(supabaseStub as never);

    const result = await calculateDisplayOrder("applications", 2, {
      type: "after",
      afterId: 25,
    });

    expect(result).toBe(11);
  });

  /**
   * @description after 指定でも参照レコード不在時のフォールバックを検証する。
   */
  it("異常系：after 指定かつ参照データなしの場合は 1 を返す", async () => {
    const afterBuilder = createMockQueryBuilder({ data: null, error: null });
    const supabaseStub = { from: jest.fn().mockReturnValue(afterBuilder) };
    mockCreateClientSupabaseClient.mockReturnValue(supabaseStub as never);

    const result = await calculateDisplayOrder("applications", 2, {
      type: "after",
      afterId: 100,
    });

    // expect: 参照データが無い場合は 1 を返す
    expect(result).toBe(1);
  });
});

/**
 * @description shiftDisplayOrder の単体テストを定義する。
 */
describe("shiftDisplayOrder", () => {
  /**
   * @description 指定位置以降の display_order を再配置する挙動を検証する。
   */
  it("正常系：指定位置以降を +1 し excludeId を除外する", async () => {
    const affectedItems = [
      { id: 2, display_order: 4 },
      { id: 1, display_order: 3 },
    ];
    const selectBuilder = createMockQueryBuilder({ data: affectedItems, error: null });
    const firstUpdateBuilder = createMockQueryBuilder();
    const secondUpdateBuilder = createMockQueryBuilder();
    const supabaseStub = { from: jest.fn() };
    supabaseStub.from
      .mockReturnValueOnce(selectBuilder)
      .mockReturnValueOnce(firstUpdateBuilder)
      .mockReturnValueOnce(secondUpdateBuilder);
    mockCreateClientSupabaseClient.mockReturnValue(supabaseStub as never);

    await shiftDisplayOrder("documents", 7, 3, 99);

    expect(firstUpdateBuilder.update).toHaveBeenCalledWith({ display_order: 5 });
    expect(firstUpdateBuilder.eq).toHaveBeenCalledWith("id", 2);
    expect(secondUpdateBuilder.update).toHaveBeenCalledWith({ display_order: 4 });
    expect(secondUpdateBuilder.eq).toHaveBeenCalledWith("id", 1);
  });
});

/**
 * @description reorderItemsInCategory の単体テストを定義する。
 */
describe("reorderItemsInCategory", () => {
  /**
   * @description display_order を 1 から振り直す処理を検証する。
   */
  it("正常系：カテゴリ内の display_order を 1 から振り直す", async () => {
    const items = [{ id: 11 }, { id: 42 }, { id: 99 }];
    const selectBuilder = createMockQueryBuilder({ data: items, error: null });
    const updateBuilders = items.map(() => createMockQueryBuilder());
    const supabaseStub = { from: jest.fn() };
    supabaseStub.from.mockReturnValueOnce(selectBuilder);
    updateBuilders.forEach((builder) => {
      supabaseStub.from.mockReturnValueOnce(builder);
    });
    mockCreateClientSupabaseClient.mockReturnValue(supabaseStub as never);

    await reorderItemsInCategory("videos", 5);

    updateBuilders.forEach((builder, index) => {
      expect(builder.update).toHaveBeenCalledWith({ display_order: index + 1 });
      expect(builder.eq).toHaveBeenCalledWith("id", items[index].id);
    });
  });
});
