import { NextResponse } from "next/server";
import { POST, DELETE } from "../../app/api/profile/image/route";

jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn(),
  },
}));

const mockGetServerCurrentUser = jest.fn();

jest.mock("../../app/services/api/supabase-server", () => ({
  getServerCurrentUser: (...args: unknown[]) => mockGetServerCurrentUser(...args),
  createServerSupabaseClient: jest.fn(),
}));

import { createServerSupabaseClient } from "../../app/services/api/supabase-server";

const createPostRequest = (file?: File): Request => {
  const formData = new FormData();
  if (file) formData.append("image", file);
  return { formData: jest.fn().mockResolvedValue(formData) } as unknown as Request;
};

const MAGIC_BYTES: Record<string, number[]> = {
  "image/jpeg": [0xff, 0xd8, 0xff],
  "image/png": [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  "image/gif": [0x47, 0x49, 0x46, 0x38],
};

const createFile = (name = "test.jpg", size = 1024, type = "image/jpeg"): File => {
  const magic = MAGIC_BYTES[type] ?? [];
  const buffer = new Uint8Array(size);
  buffer.set(magic);
  const blob = new Blob([buffer], { type });
  return new File([blob], name, { type });
};

describe("プロフィール画像 API", () => {
  const nextResponseJsonMock = NextResponse.json as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/profile/image", () => {
    it("正常系: 画像アップロードに成功する", async () => {
      mockGetServerCurrentUser.mockResolvedValue({ authId: "test-auth-id", error: null });
      const supabaseMock = {
        storage: {
          from: jest.fn().mockReturnValue({ upload: jest.fn().mockResolvedValue({ error: null }) }),
        },
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({ data: { id: 1 }, error: null }),
          update: jest.fn().mockReturnThis(),
          then: jest.fn().mockImplementation(cb => cb({ error: null })),
        }),
      };
      (createServerSupabaseClient as jest.Mock).mockResolvedValue(supabaseMock);

      const updateSpy = jest.fn().mockResolvedValue({ error: null });
      supabaseMock.from.mockImplementation((table: string) => {
        if (table === "users") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({ data: { id: 1 }, error: null }),
            update: jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ eq: updateSpy }) }),
          };
        }
        return {};
      });

      nextResponseJsonMock.mockReturnValue({
        success: true,
        profile_image_path: "test-auth-id/profile-image",
      });

      const request = createPostRequest(createFile());
      const response = await POST(request);

      expect(response).toEqual({ success: true, profile_image_path: "test-auth-id/profile-image" });
    });

    it("異常系: 未認証の場合 401 を返す", async () => {
      mockGetServerCurrentUser.mockResolvedValue({ authId: null, error: new Error("unauth") });
      nextResponseJsonMock.mockReturnValue({ success: false, error: "認証が必要です" });

      const response = await POST(createPostRequest(createFile()));

      expect(nextResponseJsonMock).toHaveBeenCalledWith(
        { success: false, error: "認証が必要です" },
        { status: 401 }
      );
      expect(response).toEqual({ success: false, error: "認証が必要です" });
    });

    it("異常系: ファイルがない場合 400 を返す", async () => {
      mockGetServerCurrentUser.mockResolvedValue({ authId: "test-auth-id", error: null });
      nextResponseJsonMock.mockReturnValue({
        success: false,
        error: "画像ファイルを選択してください",
      });

      const response = await POST(createPostRequest());

      expect(nextResponseJsonMock).toHaveBeenCalledWith(
        { success: false, error: "画像ファイルを選択してください" },
        { status: 400 }
      );
      expect(response).toEqual({ success: false, error: "画像ファイルを選択してください" });
    });

    it("異常系: ファイルサイズが1MB超の場合 400 を返す", async () => {
      mockGetServerCurrentUser.mockResolvedValue({ authId: "test-auth-id", error: null });
      nextResponseJsonMock.mockReturnValue({
        success: false,
        error: "ファイルサイズは1MB以下にしてください",
      });

      const oversizedFile = createFile("big.jpg", 1024 * 1024 + 1);
      const response = await POST(createPostRequest(oversizedFile));

      expect(nextResponseJsonMock).toHaveBeenCalledWith(
        { success: false, error: "ファイルサイズは1MB以下にしてください" },
        { status: 400 }
      );
      expect(response).toEqual({ success: false, error: "ファイルサイズは1MB以下にしてください" });
    });

    it("異常系: 非対応MIMEタイプの場合 400 を返す", async () => {
      mockGetServerCurrentUser.mockResolvedValue({ authId: "test-auth-id", error: null });
      nextResponseJsonMock.mockReturnValue({
        success: false,
        error: "jpg / png / gif のみアップロード可能です",
      });

      const invalidFile = createFile("test.pdf", 1024, "application/pdf");
      const response = await POST(createPostRequest(invalidFile));

      expect(nextResponseJsonMock).toHaveBeenCalledWith(
        { success: false, error: "jpg / png / gif のみアップロード可能です" },
        { status: 400 }
      );
      expect(response).toEqual({
        success: false,
        error: "jpg / png / gif のみアップロード可能です",
      });
    });

    it("異常系: inactive ユーザーの場合 403 を返す", async () => {
      mockGetServerCurrentUser.mockResolvedValue({ authId: "test-auth-id", error: null });
      const supabaseMock = {
        storage: { from: jest.fn() },
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
        }),
      };
      (createServerSupabaseClient as jest.Mock).mockResolvedValue(supabaseMock);
      nextResponseJsonMock.mockReturnValue({
        success: false,
        error: "この操作は許可されていません",
      });

      const response = await POST(createPostRequest(createFile()));

      expect(nextResponseJsonMock).toHaveBeenCalledWith(
        { success: false, error: "この操作は許可されていません" },
        { status: 403 }
      );
      expect(response).toEqual({ success: false, error: "この操作は許可されていません" });
    });

    it("異常系: DB更新失敗で 500 を返し Storage ロールバックを呼ぶ", async () => {
      mockGetServerCurrentUser.mockResolvedValue({ authId: "test-auth-id", error: null });
      const removeMock = jest.fn().mockResolvedValue({ error: null });
      const supabaseMock = {
        storage: {
          from: jest.fn().mockReturnValue({
            upload: jest.fn().mockResolvedValue({ error: null }),
            remove: removeMock,
          }),
        },
        from: jest
          .fn()
          .mockImplementationOnce(() => ({
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({ data: { id: 1 }, error: null }),
          }))
          .mockImplementationOnce(() => ({
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({ error: { message: "DB error" } }),
              }),
            }),
          })),
      };
      (createServerSupabaseClient as jest.Mock).mockResolvedValue(supabaseMock);
      nextResponseJsonMock.mockReturnValue({
        success: false,
        error: "プロフィール情報の更新に失敗しました",
      });

      const response = await POST(createPostRequest(createFile()));

      expect(nextResponseJsonMock).toHaveBeenCalledWith(
        { success: false, error: "プロフィール情報の更新に失敗しました" },
        { status: 500 }
      );
      expect(removeMock).toHaveBeenCalledWith(["test-auth-id/profile-image"]);
      expect(response).toEqual({ success: false, error: "プロフィール情報の更新に失敗しました" });
    });
  });

  describe("DELETE /api/profile/image", () => {
    it("異常系: 未認証の場合 401 を返す", async () => {
      mockGetServerCurrentUser.mockResolvedValue({ authId: null, error: new Error("unauth") });
      nextResponseJsonMock.mockReturnValue({ success: false, error: "認証が必要です" });

      const response = await DELETE();

      expect(nextResponseJsonMock).toHaveBeenCalledWith(
        { success: false, error: "認証が必要です" },
        { status: 401 }
      );
      expect(response).toEqual({ success: false, error: "認証が必要です" });
    });

    it("正常系: Storage削除失敗でもDB更新成功なら成功を返す", async () => {
      mockGetServerCurrentUser.mockResolvedValue({ authId: "test-auth-id", error: null });

      const removeMock = jest.fn().mockResolvedValue({ error: { message: "storage error" } });
      const supabaseMock = {
        storage: { from: jest.fn().mockReturnValue({ remove: removeMock }) },
        from: jest.fn().mockImplementation(() => ({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({ data: { id: 1 }, error: null }),
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) }),
          }),
        })),
      };
      (createServerSupabaseClient as jest.Mock).mockResolvedValue(supabaseMock);
      nextResponseJsonMock.mockReturnValue({ success: true });

      const response = await DELETE();

      expect(response).toEqual({ success: true });
    });

    it("異常系: DB更新失敗で 500 を返す", async () => {
      mockGetServerCurrentUser.mockResolvedValue({ authId: "test-auth-id", error: null });
      const supabaseMock = {
        storage: { from: jest.fn() },
        from: jest
          .fn()
          .mockImplementationOnce(() => ({
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({ data: { id: 1 }, error: null }),
          }))
          .mockImplementationOnce(() => ({
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({ error: { message: "DB error" } }),
              }),
            }),
          })),
      };
      (createServerSupabaseClient as jest.Mock).mockResolvedValue(supabaseMock);
      nextResponseJsonMock.mockReturnValue({
        success: false,
        error: "プロフィール情報の更新に失敗しました",
      });

      const response = await DELETE();

      expect(nextResponseJsonMock).toHaveBeenCalledWith(
        { success: false, error: "プロフィール情報の更新に失敗しました" },
        { status: 500 }
      );
      expect(response).toEqual({ success: false, error: "プロフィール情報の更新に失敗しました" });
    });
  });
});
