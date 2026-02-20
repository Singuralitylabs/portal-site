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

    // expect: 取得した配列をそのまま返す
    expect(result).toEqual(mockData);
    // expect: from 呼び出し時にテーブル名が正しい
    expect(supabaseStub.from).toHaveBeenCalledWith("documents");
    // expect: category_id で対象カテゴリに絞り込む
    expect(selectBuilder.eq).toHaveBeenCalledWith("category_id", 9);
    // expect: is_deleted=false で論理削除済みを除外
    expect(selectBuilder.eq).toHaveBeenCalledWith("is_deleted", false);
    // expect: display_order の昇順で並び替える
    expect(selectBuilder.order).toHaveBeenCalledWith("display_order", {
      ascending: true,
      nullsFirst: false,
    });
    // expect: excludeId で自分自身を除外する
    expect(selectBuilder.neq).toHaveBeenCalledWith("id", 3);
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

    // expect: クエリ失敗時は空配列を返す
    expect(result).toEqual([]);
    // expect: Supabase エラー内容をログ出力する
    expect(consoleSpy).toHaveBeenCalledWith("documents一覧取得エラー:", "fetch failed");

    consoleSpy.mockRestore();
  });

  /**
   * @description データが空でエラーも無い場合のフォールバックを検証する。
   */
  it("異常系：Supabase が空データを返した場合でも空配列を返す", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();
    const selectBuilder = createMockQueryBuilder({ data: undefined, error: null });
    const supabaseStub = { from: jest.fn().mockReturnValue(selectBuilder) };
    mockCreateClientSupabaseClient.mockReturnValue(supabaseStub as never);

    const result = await getItemsByCategory("videos", 5);

    // expect: データが無い場合でも空配列を返す
    expect(result).toEqual([]);
    // expect: エラーが無いのでログ出力は行われない
    expect(consoleSpy).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  /**
   * @description display_order が 0/null の要素を末尾へ回し、連番に振り直すことを検証する。
   */
  it("正常系：display_order が未設定(0/null)の要素を末尾に回して連番化する", async () => {
    const mockData = [
      { id: 1, name: "Doc A", display_order: 0 },
      { id: 2, name: "Doc B", display_order: 3 },
      { id: 3, name: "Doc C", display_order: null },
      { id: 4, name: "Doc D", display_order: 1 },
    ];
    const selectBuilder = createMockQueryBuilder({ data: mockData, error: null });
    const supabaseStub = { from: jest.fn().mockReturnValue(selectBuilder) };
    mockCreateClientSupabaseClient.mockReturnValue(supabaseStub as never);

    const result = await getItemsByCategory("documents", 2);

    expect(result).toEqual([
      { id: 4, name: "Doc D", display_order: 1 },
      { id: 2, name: "Doc B", display_order: 2 },
      { id: 1, name: "Doc A", display_order: 3 },
      { id: 3, name: "Doc C", display_order: 4 },
    ]); // 0/null は末尾へ寄せた上で display_order を連番で再採番することを確認
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
   * @description current 指定でも display_order 未指定時のフォールバックを検証する。
   */
  it("正常系：current 指定で display_order が無い場合は 1 を返す", async () => {
    const supabaseStub = { from: jest.fn().mockReturnValue(createMockQueryBuilder()) };
    mockCreateClientSupabaseClient.mockReturnValue(supabaseStub as never);

    const result = await calculateDisplayOrder("documents", 1, { type: "current" });

    // expect: current でも値が無い場合は 1 を返す
    expect(result).toBe(1);
    // expect: 値計算のため Supabase クライアントを生成する
    expect(mockCreateClientSupabaseClient).toHaveBeenCalled();
  });

  /**
   * @description 先頭へ配置するケースを検証する。
   */
  it("正常系：first 指定時は display_order=1 を返す", async () => {
    mockCreateClientSupabaseClient.mockReturnValue({} as never);

    const result = await calculateDisplayOrder("documents", 1, { type: "first" });

    // expect: 先頭配置のため常に 1 を返す
    expect(result).toBe(1);
  });

  /**
   * @description 最後尾へ配置するケースを検証する。
   */
  it("正常系：last 指定時は最大順序の後ろに配置する", async () => {
    const lastOrderBuilder = createMockQueryBuilder({ data: [{ display_order: 5 }], error: null });
    const supabaseStub = { from: jest.fn().mockReturnValue(lastOrderBuilder) };
    mockCreateClientSupabaseClient.mockReturnValue(supabaseStub as never);

    const result = await calculateDisplayOrder("videos", 4, { type: "last" });

    // expect: 既存の最大 display_order に +1 した値を返す
    expect(result).toBe(6);
    // expect: category_id で対象カテゴリに限定する
    expect(lastOrderBuilder.eq).toHaveBeenCalledWith("category_id", 4);
    // expect: is_deleted=false で有効レコードのみ取得する
    expect(lastOrderBuilder.eq).toHaveBeenCalledWith("is_deleted", false);
    // expect: limit(1) で最大値のみ参照する
    expect(lastOrderBuilder.limit).toHaveBeenCalledWith(1);
  });

  /**
   * @description last 指定で最大値が null の場合のフォールバックを検証する。
   */
  it("異常系：last 指定で最大 display_order が null の場合は 1 を返す", async () => {
    const lastOrderBuilder = createMockQueryBuilder({ data: [{ display_order: null }], error: null });
    const supabaseStub = { from: jest.fn().mockReturnValue(lastOrderBuilder) };
    mockCreateClientSupabaseClient.mockReturnValue(supabaseStub as never);

    const result = await calculateDisplayOrder("videos", 4, { type: "last" });

    // expect: display_order が null の場合でも 1 を返す
    expect(result).toBe(1);
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
   * @description last 指定で data が undefined の場合のフォールバックを検証する。
   */
  it("異常系：last 指定で data が undefined の場合も 1 を返す", async () => {
    const lastOrderBuilder = createMockQueryBuilder({ data: undefined, error: null });
    const supabaseStub = { from: jest.fn().mockReturnValue(lastOrderBuilder) };
    mockCreateClientSupabaseClient.mockReturnValue(supabaseStub as never);

    const result = await calculateDisplayOrder("videos", 4, { type: "last" });

    // expect: data 自体が無い場合でも 1 を返す
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

    // expect: 参照元の display_order に +1 した値を返す
    expect(result).toBe(11);
    // expect: afterId で対象レコードを特定する
    expect(afterBuilder.eq).toHaveBeenCalledWith("id", 25);
    // expect: single() で単一行を取得する
    expect(afterBuilder.single).toHaveBeenCalled();
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

    // expect: 同一カテゴリ内の対象行のみ取得する
    expect(selectBuilder.eq).toHaveBeenCalledWith("category_id", 7);
    // expect: display_order >= 基準値に絞り込む
    expect(selectBuilder.gte).toHaveBeenCalledWith("display_order", 3);
    // expect: excludeId で自身を除外する
    expect(selectBuilder.neq).toHaveBeenCalledWith("id", 99);
    // expect: 先頭の更新で display_order を 4→5 に上げる
    expect(firstUpdateBuilder.update).toHaveBeenCalledWith({ display_order: 5 });
    // expect: 先頭更新が id=2 に対して行われる
    expect(firstUpdateBuilder.eq).toHaveBeenCalledWith("id", 2);
    // expect: 次の更新で display_order を 3→4 に上げる
    expect(secondUpdateBuilder.update).toHaveBeenCalledWith({ display_order: 4 });
    // expect: 2件目の更新が id=1 に対して行われる
    expect(secondUpdateBuilder.eq).toHaveBeenCalledWith("id", 1);
  });

  /**
   * @description 影響レコードが存在しない場合に更新しないことを検証する。
   */
  it("異常系：対象レコードが無い場合は更新と neq を行わない", async () => {
    const selectBuilder = createMockQueryBuilder({ data: [], error: null });
    const supabaseStub = { from: jest.fn().mockReturnValue(selectBuilder) };
    mockCreateClientSupabaseClient.mockReturnValue(supabaseStub as never);

    await shiftDisplayOrder("videos", 8, 10);

    // expect: excludeId 未指定のため neq は呼ばれない
    expect(selectBuilder.neq).not.toHaveBeenCalled();
    // expect: 更新対象が無いので update も呼ばれない
    expect(selectBuilder.update).not.toHaveBeenCalled();
  });

  /**
   * @description display_order が null の場合に 0 から再計算されることを検証する。
   */
  it("異常系：display_order が null の場合は 1 に更新する", async () => {
    const selectBuilder = createMockQueryBuilder({
      data: [{ id: 7, display_order: null }],
      error: null,
    });
    const updateBuilder = createMockQueryBuilder();
    const supabaseStub = { from: jest.fn() };
    supabaseStub.from
      .mockReturnValueOnce(selectBuilder)
      .mockReturnValueOnce(updateBuilder);
    mockCreateClientSupabaseClient.mockReturnValue(supabaseStub as never);

    await shiftDisplayOrder("applications", 3, 1);

    // expect: display_order=null の場合でも 1 を設定する
    expect(updateBuilder.update).toHaveBeenCalledWith({ display_order: 1 });
    // expect: 更新対象 id を適切に絞り込む
    expect(updateBuilder.eq).toHaveBeenCalledWith("id", 7);
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

    // expect: 再採番前に同一カテゴリの全件を取得する
    expect(selectBuilder.eq).toHaveBeenCalledWith("category_id", 5);
    updateBuilders.forEach((builder, index) => {
      // expect: 各レコードの display_order を連番に更新する
      expect(builder.update).toHaveBeenCalledWith({ display_order: index + 1 });
      // expect: 更新対象が正しい id に限定される
      expect(builder.eq).toHaveBeenCalledWith("id", items[index].id);
    });
  });

  /**
   * @description 対象レコードが存在しない場合の早期 return を検証する。
   */
  it("異常系：カテゴリにレコードが無い場合は何も更新しない", async () => {
    const selectBuilder = createMockQueryBuilder({ data: [], error: null });
    const supabaseStub = { from: jest.fn().mockReturnValue(selectBuilder) };
    mockCreateClientSupabaseClient.mockReturnValue(supabaseStub as never);

    await reorderItemsInCategory("documents", 99);

    // expect: レコードが無い場合は更新処理を実行しない
    expect(selectBuilder.update).not.toHaveBeenCalled();
  });
});
