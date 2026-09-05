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

  it("registration_notified_at が null なら通知権を取得する", async () => {
    const maybeSingle = jest.fn().mockResolvedValue({
      data: { display_name: "太郎", registration_notified_at: null },
      error: null,
    });
    const updateMaybeSingle = jest.fn().mockResolvedValue({
      data: { display_name: "太郎", registration_notified_at: "2024-01-01T00:00:00.000Z" },
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
          is: jest.fn().mockReturnThis(),
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
      error: null,
    });
  });

  it("registration_notified_at が入っていれば既通知として扱う", async () => {
    const maybeSingle = jest.fn().mockResolvedValue({
      data: {
        display_name: "太郎",
        registration_notified_at: "2024-01-01T00:00:00.000Z",
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
