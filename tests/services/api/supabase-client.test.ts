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
import { deleteVideo, getVideosByCategory, registerVideo, updateVideo } from "../../../app/services/api/videos-client";
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

const supabaseClientActual = jest.requireActual(
  "../../../app/services/api/supabase-client"
) as typeof import("../../../app/services/api/supabase-client");

type QueryResult = { data: unknown; error: unknown };

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

const createUpdateBuilder = (result: QueryResult) => {
  const builder: { update?: jest.Mock; eq?: jest.Mock } = {};
  builder.update = jest.fn(() => builder);
  builder.eq = jest.fn(() => Promise.resolve(result));
  return builder as Required<typeof builder>;
};

const createInsertBuilder = (result: QueryResult) => {
  const builder: { insert?: jest.Mock } = {};
  builder.insert = jest.fn(() => Promise.resolve(result));
  return builder as Required<typeof builder>;
};

const createInsertSelectBuilder = (result: QueryResult) => {
  const builder: { insert?: jest.Mock; select?: jest.Mock } = {};
  builder.insert = jest.fn(() => builder);
  builder.select = jest.fn(() => Promise.resolve(result));
  return builder as Required<typeof builder>;
};

const createSelectSingleBuilder = (result: QueryResult) => {
  const builder: { select?: jest.Mock; eq?: jest.Mock; single?: jest.Mock } = {};
  builder.select = jest.fn(() => builder);
  builder.eq = jest.fn(() => builder);
  builder.single = jest.fn(() => Promise.resolve(result));
  return builder as Required<typeof builder>;
};

const createMaybeSingleBuilder = (result: QueryResult) => {
  const builder: { select?: jest.Mock; eq?: jest.Mock; maybeSingle?: jest.Mock } = {};
  builder.select = jest.fn(() => builder);
  builder.eq = jest.fn(() => builder);
  builder.maybeSingle = jest.fn(() => Promise.resolve(result));
  return builder as Required<typeof builder>;
};

const createAwaitableUpdateBuilder = (result: QueryResult) => {
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

describe("supabase-client", () => {
  const createBrowserClientMock = createBrowserClient as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("環境変数を利用して Supabase クライアントを生成する", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
    const mockClient = { from: jest.fn() };
    createBrowserClientMock.mockReturnValue(mockClient);

    const response = supabaseClientActual.createClientSupabaseClient();

    expect(createBrowserClientMock).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "anon-key"
    );
    expect(response).toBe(mockClient);
  });
});

describe("content client services", () => {
  const createClientSupabaseClientMock = createClientSupabaseClient as jest.Mock;
  const getItemsByCategoryMock = getItemsByCategory as jest.Mock;
  const calculateDisplayOrderMock = calculateDisplayOrder as jest.Mock;
  const shiftDisplayOrderMock = shiftDisplayOrder as jest.Mock;
  const reorderItemsInCategoryMock = reorderItemsInCategory as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe.each([
    { label: "application", getByCategory: getApplicationsByCategory },
    { label: "document", getByCategory: getDocumentsByCategory },
    { label: "video", getByCategory: getVideosByCategory },
  ])("getByCategory: $label", ({ getByCategory }) => {
    it("正常系: カテゴリー内アイテム一覧を取得できる", async () => {
      const items = [{ id: 1, name: "item", display_order: 1 }];
      getItemsByCategoryMock.mockResolvedValue(items);

      const response = await getByCategory(10, 2);

      expect(response).toEqual(items);
      expect(getItemsByCategoryMock).toHaveBeenCalledTimes(1);
    });
  });

  describe.each([
    { label: "application", deleteFn: deleteApplication },
    { label: "document", deleteFn: deleteDocument },
    { label: "video", deleteFn: deleteVideo },
  ])("delete: $label", ({ deleteFn }) => {
    it("正常系: 論理削除に成功する", async () => {
      const builder = createUpdateBuilder({ data: null, error: null });
      const supabase = { from: jest.fn(() => builder) };
      createClientSupabaseClientMock.mockReturnValue(supabase);

      const response = await deleteFn(1, 10);

      expect(response).toEqual({ success: true, error: null });
    });

    it("異常系: エラー時は失敗を返す", async () => {
      const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
      const error = { message: "failed" };
      const builder = createUpdateBuilder({ data: null, error });
      const supabase = { from: jest.fn(() => builder) };
      createClientSupabaseClientMock.mockReturnValue(supabase);

      const response = await deleteFn(2, 11);

      expect(response).toEqual({ success: false, error });
      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore();
    });
  });

  describe.each([
    {
      label: "application",
      registerFn: registerApplication,
      updateFn: updateApplication,
      registerPayload: {
        name: "App A",
        category_id: 1,
        description: "desc",
        url: "https://app.example.com",
        developer_id: 7,
        created_by: 10,
        position: { type: "first" as const },
      },
      updatePayload: {
        id: 1,
        name: "App A2",
        category_id: 2,
        description: "desc2",
        url: "https://app.example.com/2",
        developer_id: 8,
        updated_by: 11,
        position: { type: "after" as const, afterId: 3 },
      },
    },
    {
      label: "document",
      registerFn: registerDocument,
      updateFn: updateDocument,
      registerPayload: {
        name: "Doc A",
        category_id: 1,
        description: "desc",
        url: "https://doc.example.com",
        assignee: "owner",
        created_by: 10,
        position: { type: "first" as const },
      },
      updatePayload: {
        id: 1,
        name: "Doc A2",
        category_id: 2,
        description: "desc2",
        url: "https://doc.example.com/2",
        assignee: "owner2",
        updated_by: 11,
        position: { type: "after" as const, afterId: 3 },
      },
    },
    {
      label: "video",
      registerFn: registerVideo,
      updateFn: updateVideo,
      registerPayload: {
        name: "Video A",
        category_id: 1,
        description: "desc",
        url: "https://video.example.com",
        thumbnail_path: "/thumb.png",
        thumbnail_time: 12,
        length: 100,
        assignee: "owner",
        created_by: 10,
        position: { type: "first" as const },
      },
      updatePayload: {
        id: 1,
        name: "Video A2",
        category_id: 2,
        description: "desc2",
        url: "https://video.example.com/2",
        thumbnail_path: "/thumb2.png",
        thumbnail_time: 20,
        length: 120,
        assignee: "owner2",
        updated_by: 11,
        position: { type: "after" as const, afterId: 3 },
      },
    },
  ])("register/update: $label", ({ registerFn, updateFn, registerPayload, updatePayload }) => {
    it("register 正常系: 成功時に success=true を返す", async () => {
      calculateDisplayOrderMock.mockResolvedValue(3);
      shiftDisplayOrderMock.mockResolvedValue(undefined);
      reorderItemsInCategoryMock.mockResolvedValue(undefined);

      const insertBuilder = createInsertBuilder({ data: null, error: null });
      const supabase = { from: jest.fn(() => insertBuilder) };
      createClientSupabaseClientMock.mockReturnValue(supabase);

      const response = await (registerFn as (payload: typeof registerPayload) => Promise<unknown>)(
        registerPayload
      );

      expect(response).toEqual({ success: true, error: null });
      expect(reorderItemsInCategoryMock).toHaveBeenCalledTimes(1);
    });

    it("register 異常系: 失敗時に success=false を返す", async () => {
      const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
      calculateDisplayOrderMock.mockResolvedValue(3);
      shiftDisplayOrderMock.mockResolvedValue(undefined);
      reorderItemsInCategoryMock.mockResolvedValue(undefined);

      const error = { message: "insert failed" };
      const insertBuilder = createInsertBuilder({ data: null, error });
      const supabase = { from: jest.fn(() => insertBuilder) };
      createClientSupabaseClientMock.mockReturnValue(supabase);

      const response = await (registerFn as (payload: typeof registerPayload) => Promise<unknown>)(
        registerPayload
      );

      expect(response).toEqual({ success: false, error });
      expect(reorderItemsInCategoryMock).not.toHaveBeenCalled();
      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore();
    });

    it("update 正常系: カテゴリー変更時は再採番を2回実行する", async () => {
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

      const response = await (updateFn as (payload: typeof updatePayload) => Promise<unknown>)(
        updatePayload
      );

      expect(response).toEqual({ success: true, error: null });
      expect(reorderItemsInCategoryMock).toHaveBeenCalledTimes(2);
    });

    it("update 異常系: 失敗時に success=false を返す", async () => {
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

      const response = await (updateFn as (payload: typeof updatePayload) => Promise<unknown>)(
        updatePayload
      );

      expect(response).toEqual({ success: false, error });
      expect(reorderItemsInCategoryMock).not.toHaveBeenCalled();
      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore();
    });
  });
});

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

    expect(response).toEqual({ data: null, error });
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("fetchUserRoleById: 正常系/異常系", async () => {
    const successBuilder = createMaybeSingleBuilder({ data: { role: "admin" }, error: null });
    const supabaseSuccess = { from: jest.fn(() => successBuilder) };
    createClientSupabaseClientMock.mockReturnValue(supabaseSuccess);

    const success = await fetchUserRoleById({ authId: "auth-3" });
    expect(success).toEqual({ role: "admin", error: null });

    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    const error = { message: "not found" };
    const failedBuilder = createMaybeSingleBuilder({ data: null, error });
    const supabaseFailed = { from: jest.fn(() => failedBuilder) };
    createClientSupabaseClientMock.mockReturnValue(supabaseFailed);

    const failed = await fetchUserRoleById({ authId: "auth-4" });
    expect(failed).toEqual({ role: null, error });
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("fetchUserStatusById: 正常系/異常系", async () => {
    const successBuilder = createMaybeSingleBuilder({ data: { status: "active" }, error: null });
    const supabaseSuccess = { from: jest.fn(() => successBuilder) };
    createClientSupabaseClientMock.mockReturnValue(supabaseSuccess);

    const success = await fetchUserStatusById({ authId: "auth-5" });
    expect(success).toEqual({ status: "active", error: null });

    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    const error = { message: "not found" };
    const failedBuilder = createMaybeSingleBuilder({ data: null, error });
    const supabaseFailed = { from: jest.fn(() => failedBuilder) };
    createClientSupabaseClientMock.mockReturnValue(supabaseFailed);

    const failed = await fetchUserStatusById({ authId: "auth-6" });
    expect(failed).toEqual({ status: null, error });
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("fetchUserIdByAuthId: 正常系/異常系", async () => {
    const successBuilder = createSelectSingleBuilder({ data: { id: 42 }, error: null });
    const supabaseSuccess = { from: jest.fn(() => successBuilder) };
    createClientSupabaseClientMock.mockReturnValue(supabaseSuccess);

    const success = await fetchUserIdByAuthId({ authId: "auth-7" });
    expect(success).toEqual({ userId: 42, error: null });

    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    const error = { message: "not found" };
    const failedBuilder = createSelectSingleBuilder({ data: null, error });
    const supabaseFailed = { from: jest.fn(() => failedBuilder) };
    createClientSupabaseClientMock.mockReturnValue(supabaseFailed);

    const failed = await fetchUserIdByAuthId({ authId: "auth-8" });
    expect(failed).toEqual({ userId: null, error });
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  describe.each([
    { label: "approve", fn: approveUser },
    { label: "reject", fn: rejectUser },
  ])("$label user", ({ fn }) => {
    it("正常系: エラーなしを返す", async () => {
      const builder = createAwaitableUpdateBuilder({ data: null, error: null });
      const supabase = { from: jest.fn(() => builder) };
      createClientSupabaseClientMock.mockReturnValue(supabase);

      const response = await fn({ userId: 1 });

      expect(response).toEqual({ error: null });
    });

    it("異常系: エラーを返す", async () => {
      const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
      const error = { message: "failed" };
      const builder = createAwaitableUpdateBuilder({ data: null, error });
      const supabase = { from: jest.fn(() => builder) };
      createClientSupabaseClientMock.mockReturnValue(supabase);

      const response = await fn({ userId: 1 });

      expect(response).toEqual({ error });
      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore();
    });
  });
});
