import { createServerSupabaseClient } from "../../../app/services/api/supabase-server";
import { claimRegistrationSlackNotification } from "../../../app/services/api/users-server";

jest.mock("../../../app/services/api/supabase-server", () => ({
  createServerSupabaseClient: jest.fn(),
}));

describe("claimRegistrationSlackNotification", () => {
  const createServerSupabaseClientMock = createServerSupabaseClient as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("created_at と updated_at が同じなら通知権を取得する", async () => {
    const timestamp = "2024-01-01T00:00:00.000Z";
    const maybeSingle = jest.fn().mockResolvedValue({
      data: { display_name: "太郎", created_at: timestamp, updated_at: timestamp },
      error: null,
    });
    const updateMaybeSingle = jest.fn().mockResolvedValue({
      data: { display_name: "太郎" },
      error: null,
    });
    const supabase = {
      from: jest
        .fn()
        .mockReturnValueOnce({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle,
        })
        .mockReturnValueOnce({
          update: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          maybeSingle: updateMaybeSingle,
        }),
    };
    createServerSupabaseClientMock.mockResolvedValue(supabase);

    const result = await claimRegistrationSlackNotification({ authId: "auth-1" });

    expect(result).toEqual({
      claimed: true,
      alreadyNotified: false,
      displayName: "太郎",
      createdAt: timestamp,
      error: null,
    });
  });

  it("updated_at が進んでいれば既通知として扱う", async () => {
    const maybeSingle = jest.fn().mockResolvedValue({
      data: {
        display_name: "太郎",
        created_at: "2024-01-01T00:00:00.000Z",
        updated_at: "2024-01-01T00:01:00.000Z",
      },
      error: null,
    });
    const supabase = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle,
      }),
    };
    createServerSupabaseClientMock.mockResolvedValue(supabase);

    const result = await claimRegistrationSlackNotification({ authId: "auth-1" });

    expect(result.claimed).toBe(false);
    expect(result.alreadyNotified).toBe(true);
  });
});
