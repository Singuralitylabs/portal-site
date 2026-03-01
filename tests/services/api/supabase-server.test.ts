import { fetchApplications } from "../../../app/services/api/applications-server";
import { fetchCategoriesByType } from "../../../app/services/api/categories-server";
import { fetchDocuments } from "../../../app/services/api/documents-server";
import { createServerSupabaseClient } from "../../../app/services/api/supabase-server";
import {
  fetchActiveUsers,
  fetchApprovalUsers,
  fetchUserByAuthIdInServer,
  fetchUserInfoByAuthId,
  fetchUserStatusByIdInServer,
  updateUserProfileServerInServer,
} from "../../../app/services/api/users-server";
import { fetchVideoById, fetchVideos } from "../../../app/services/api/videos-server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const supabaseServerActual = jest.requireActual(
  "../../../app/services/api/supabase-server"
) as typeof import("../../../app/services/api/supabase-server");

type QueryResult = { data: unknown; error: unknown };

jest.mock("../../../app/services/api/supabase-server", () => ({
  ...jest.requireActual("../../../app/services/api/supabase-server"),
  createServerSupabaseClient: jest.fn(),
}));

jest.mock("@supabase/ssr", () => ({
  createServerClient: jest.fn(),
}));

jest.mock("next/headers", () => ({
  cookies: jest.fn(),
}));

const createOrderBuilder = (result: QueryResult) => {
  const builder: { select?: jest.Mock; eq?: jest.Mock; order?: jest.Mock } = {};
  builder.select = jest.fn(() => builder);
  builder.eq = jest.fn(() => builder);
  builder.order = jest.fn(() => Promise.resolve(result));
  return builder as Required<typeof builder>;
};

const createMaybeSingleBuilder = (result: QueryResult) => {
  const builder: { select?: jest.Mock; eq?: jest.Mock; maybeSingle?: jest.Mock } = {};
  builder.select = jest.fn(() => builder);
  builder.eq = jest.fn(() => builder);
  builder.maybeSingle = jest.fn(() => Promise.resolve(result));
  return builder as Required<typeof builder>;
};

const createEqTerminatingBuilder = (eqCallCount: number, result: QueryResult) => {
  const builder: { select?: jest.Mock; eq?: jest.Mock } = {};
  let calls = 0;
  builder.select = jest.fn(() => builder);
  builder.eq = jest.fn(() => {
    calls += 1;
    if (calls >= eqCallCount) {
      return Promise.resolve(result);
    }
    return builder;
  });
  return builder as Required<typeof builder>;
};

const createUpdateSelectSingleBuilder = (result: QueryResult) => {
  const builder: { update?: jest.Mock; eq?: jest.Mock; select?: jest.Mock; single?: jest.Mock } = {};
  builder.update = jest.fn(() => builder);
  builder.eq = jest.fn(() => builder);
  builder.select = jest.fn(() => builder);
  builder.single = jest.fn(() => Promise.resolve(result));
  return builder as Required<typeof builder>;
};

describe("server API services", () => {
  const createServerSupabaseClientMock = createServerSupabaseClient as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe.each([
    { label: "fetchDocuments", run: () => fetchDocuments() },
    { label: "fetchApplications", run: () => fetchApplications() },
    { label: "fetchCategoriesByType", run: () => fetchCategoriesByType("document") },
    { label: "fetchVideos", run: () => fetchVideos() },
  ])("$label", ({ run }) => {
    it("正常系: 一覧を返す", async () => {
      const result = { data: [{ id: 1 }], error: null };
      const builder = createOrderBuilder(result);
      const supabase = { from: jest.fn(() => builder) };
      createServerSupabaseClientMock.mockResolvedValue(supabase);

      const response = await run();

      expect(response).toEqual({ data: result.data, error: null });
    });

    it("異常系: エラー時は data=null を返す", async () => {
      const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
      const result = { data: null, error: { message: "failed" } };
      const builder = createOrderBuilder(result);
      const supabase = { from: jest.fn(() => builder) };
      createServerSupabaseClientMock.mockResolvedValue(supabase);

      const response = await run();

      expect(response).toEqual({ data: null, error: result.error });
      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore();
    });
  });

  describe("fetchVideoById", () => {
    it("正常系: 単一動画を返す", async () => {
      const result = { data: { id: 1 }, error: null };
      const builder = createMaybeSingleBuilder(result);
      const supabase = { from: jest.fn(() => builder) };
      createServerSupabaseClientMock.mockResolvedValue(supabase);

      const response = await fetchVideoById(1);

      expect(response).toEqual({ data: result.data, error: null });
    });

    it("異常系: エラー時は data=null を返す", async () => {
      const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
      const result = { data: null, error: { message: "failed" } };
      const builder = createMaybeSingleBuilder(result);
      const supabase = { from: jest.fn(() => builder) };
      createServerSupabaseClientMock.mockResolvedValue(supabase);

      const response = await fetchVideoById(1);

      expect(response).toEqual({ data: null, error: result.error });
      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore();
    });
  });

  describe("users-server", () => {
    it("fetchUserStatusByIdInServer: 正常系/異常系", async () => {
      const successBuilder = createMaybeSingleBuilder({ data: { status: "active" }, error: null });
      createServerSupabaseClientMock.mockResolvedValue({ from: jest.fn(() => successBuilder) });

      const success = await fetchUserStatusByIdInServer({ authId: "auth-1" });
      expect(success).toEqual({ status: "active", error: null });

      const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
      const error = { message: "not found" };
      const failBuilder = createMaybeSingleBuilder({ data: null, error });
      createServerSupabaseClientMock.mockResolvedValue({ from: jest.fn(() => failBuilder) });

      const failed = await fetchUserStatusByIdInServer({ authId: "auth-2" });
      expect(failed).toEqual({ status: null, error });
      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore();
    });

    it("fetchUserInfoByAuthId: 正常系/異常系", async () => {
      const successBuilder = createMaybeSingleBuilder({ data: { id: 1, role: "admin" }, error: null });
      createServerSupabaseClientMock.mockResolvedValue({ from: jest.fn(() => successBuilder) });

      const success = await fetchUserInfoByAuthId({ authId: "auth-3" });
      expect(success).toEqual({ id: 1, role: "admin", error: null });

      const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
      const error = { message: "not found" };
      const failBuilder = createMaybeSingleBuilder({ data: null, error });
      createServerSupabaseClientMock.mockResolvedValue({ from: jest.fn(() => failBuilder) });

      const failed = await fetchUserInfoByAuthId({ authId: "auth-4" });
      expect(failed).toEqual({ id: 0, role: "", error });
      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore();
    });

    it("fetchActiveUsers: 正常系で変換済みデータを返す", async () => {
      const result = {
        data: [
          {
            id: 1,
            display_name: "user",
            bio: "bio",
            avatar_url: "a",
            x_url: null,
            facebook_url: null,
            instagram_url: null,
            github_url: null,
            portfolio_url: null,
            position_tags: [
              { positions: { id: 1, name: "dev", is_deleted: false } },
              { positions: { id: 2, name: "old", is_deleted: true } },
            ],
          },
        ],
        error: null,
      };
      const builder = createOrderBuilder(result);
      createServerSupabaseClientMock.mockResolvedValue({ from: jest.fn(() => builder) });

      const response = await fetchActiveUsers();

      expect(response).toEqual({
        data: [
          expect.objectContaining({
            id: 1,
            position_tags: [{ positions: { id: 1, name: "dev", is_deleted: false } }],
          }),
        ],
        error: null,
      });
    });

    it("fetchApprovalUsers: 正常系/異常系", async () => {
      const successBuilder = createEqTerminatingBuilder(2, {
        data: [{ id: 1, display_name: "pending", email: "p@example.com" }],
        error: null,
      });
      createServerSupabaseClientMock.mockResolvedValue({ from: jest.fn(() => successBuilder) });

      const success = await fetchApprovalUsers();
      expect(success).toEqual({
        data: [{ id: 1, display_name: "pending", email: "p@example.com" }],
        error: null,
      });

      const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
      const error = { message: "failed" };
      const failBuilder = createEqTerminatingBuilder(2, { data: null, error });
      createServerSupabaseClientMock.mockResolvedValue({ from: jest.fn(() => failBuilder) });

      const failed = await fetchApprovalUsers();
      expect(failed).toEqual({ data: null, error });
      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore();
    });

    it("fetchUserByAuthIdInServer: 正常系/異常系", async () => {
      const successBuilder = createMaybeSingleBuilder({ data: { id: 9, auth_id: "auth-9" }, error: null });
      createServerSupabaseClientMock.mockResolvedValue({ from: jest.fn(() => successBuilder) });

      const success = await fetchUserByAuthIdInServer({ authId: "auth-9" });
      expect(success).toEqual({ data: { id: 9, auth_id: "auth-9" }, error: null });

      const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
      const error = { message: "not found" };
      const failBuilder = createMaybeSingleBuilder({ data: null, error });
      createServerSupabaseClientMock.mockResolvedValue({ from: jest.fn(() => failBuilder) });

      const failed = await fetchUserByAuthIdInServer({ authId: "auth-10" });
      expect(failed).toEqual({ data: null, error });
      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore();
    });

    it("updateUserProfileServerInServer: 正常系/異常系", async () => {
      const successBuilder = createUpdateSelectSingleBuilder({ data: { id: 1 }, error: null });
      createServerSupabaseClientMock.mockResolvedValue({ from: jest.fn(() => successBuilder) });

      const success = await updateUserProfileServerInServer({
        id: 1,
        displayName: "name",
        bio: "bio",
        x_url: null,
        facebook_url: null,
        instagram_url: null,
        github_url: null,
        portfolio_url: null,
      });
      expect(success).toBeNull();

      const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
      const error = { message: "failed" };
      const failBuilder = createUpdateSelectSingleBuilder({ data: null, error });
      createServerSupabaseClientMock.mockResolvedValue({ from: jest.fn(() => failBuilder) });

      const failed = await updateUserProfileServerInServer({
        id: 1,
        displayName: "name",
        bio: "bio",
        x_url: null,
        facebook_url: null,
        instagram_url: null,
        github_url: null,
        portfolio_url: null,
      });
      expect(failed).toEqual(error);
      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore();
    });
  });
});

describe("supabase-server module", () => {
  const createServerClientMock = createServerClient as jest.Mock;
  const cookiesMock = cookies as jest.Mock;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("createServerSupabaseClient: 環境変数を利用してクライアントを生成する", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";

    const cookieStore = { getAll: jest.fn(() => []), set: jest.fn() };
    cookiesMock.mockResolvedValue(cookieStore);

    const mockClient = { auth: { getUser: jest.fn() } };
    createServerClientMock.mockReturnValue(mockClient);

    const response = await supabaseServerActual.createServerSupabaseClient();

    expect(createServerClientMock).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "anon-key",
      expect.objectContaining({ cookies: expect.any(Object) })
    );
    expect(response).toBe(mockClient);
  });

  it("getServerCurrentUser: 正常系/異常系", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";

    const cookieStore = { getAll: jest.fn(() => []), set: jest.fn() };
    cookiesMock.mockResolvedValue(cookieStore);

    const authClient = {
      auth: {
        getUser: jest
          .fn()
          .mockResolvedValueOnce({ data: { user: { id: "auth-ok" } }, error: null })
          .mockResolvedValueOnce({ data: { user: null }, error: { message: "failed" } }),
      },
    };
    createServerClientMock.mockReturnValue(authClient);

    const success = await supabaseServerActual.getServerCurrentUser();
    expect(success).toEqual({ authId: "auth-ok", error: null });

    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    const failed = await supabaseServerActual.getServerCurrentUser();
    expect(failed).toEqual({ authId: "", error: { message: "failed" } });
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
