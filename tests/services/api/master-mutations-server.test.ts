import { mutateMasterRecord } from "@/app/services/api/master-mutations-server";
import { createServerSupabaseClient } from "@/app/services/api/supabase-server";
import type { MasterMutationInput } from "@/app/utils/master-validation";

jest.mock("@/app/services/api/supabase-server", () => ({ createServerSupabaseClient: jest.fn() }));

const input: MasterMutationInput = {
  table: "positions",
  operation: "update",
  id: 7,
  fields: { name: "役職" },
};
let supabase: { auth: { getUser: jest.Mock }; from: jest.Mock; rpc: jest.Mock };
let single: jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  single = jest.fn().mockResolvedValue({
    data: { id: 5, role: "admin", status: "active", is_deleted: false },
    error: null,
  });
  const builder = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), single };
  supabase = {
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: { id: "auth-id" } }, error: null }),
    },
    from: jest.fn().mockReturnValue(builder),
    rpc: jest.fn().mockResolvedValue({ data: 7, error: null }),
  };
  (createServerSupabaseClient as jest.Mock).mockResolvedValue(supabase);
});

describe("master server mutations", () => {
  it("rejects protected fields before calling the database", async () => {
    expect((await mutateMasterRecord({ ...input, fields: { updated_by: 999 } })).success).toBe(
      false
    );
    expect(createServerSupabaseClient).not.toHaveBeenCalled();
  });

  it("requires authenticated users", async () => {
    supabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });
    expect((await mutateMasterRecord(input)).error?.message).toContain("ログイン");
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it.each([
    { role: "member", status: "active", is_deleted: false },
    { role: "admin", status: "pending", is_deleted: false },
    { role: "admin", status: "active", is_deleted: true },
  ])("rejects unauthorized users: %o", async user => {
    single.mockResolvedValue({ data: { id: 5, ...user }, error: null });
    expect((await mutateMasterRecord(input)).error?.message).toContain("権限");
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it.each(["admin", "maintainer"])(
    "passes permitted %s mutation to the transaction",
    async role => {
      single.mockResolvedValue({
        data: { id: 5, role, status: "active", is_deleted: false },
        error: null,
      });
      expect(await mutateMasterRecord(input)).toEqual({ success: true, error: null, id: 7 });
      expect(supabase.rpc).toHaveBeenCalledWith("mutate_master_record", {
        table_name: "positions",
        operation: "update",
        record_id: 7,
        fields: { name: "役職" },
        placement: { type: "last" },
        confirmation_token: null,
      });
    }
  );

  it("returns the entire impact list without mutating before confirmation", async () => {
    const contents = Array.from({ length: 1200 }, (_, index) => ({
      table: "documents",
      id: index + 1,
      name: `Document ${index}`,
      is_deleted: false,
      updated_at: "2026-01-01",
    }));
    supabase.rpc.mockResolvedValue({ data: { token: "preview", contents }, error: null });
    const result = await mutateMasterRecord({ table: "categories", operation: "delete", id: 3 });
    expect(result.success).toBe(false);
    expect(result.confirmation?.contents).toHaveLength(1200);
    expect(supabase.rpc).toHaveBeenCalledTimes(1);
  });

  it("forwards a confirmed snapshot for transaction-time revalidation", async () => {
    supabase.rpc
      .mockResolvedValueOnce({ data: { token: "snapshot", contents: [{ id: 1 }] }, error: null })
      .mockResolvedValueOnce({ data: 3, error: null });
    expect(
      (
        await mutateMasterRecord({
          table: "categories",
          operation: "delete",
          id: 3,
          confirmationToken: "snapshot",
        })
      ).success
    ).toBe(true);
    expect(supabase.rpc).toHaveBeenLastCalledWith(
      "mutate_master_record",
      expect.objectContaining({ confirmation_token: "snapshot" })
    );
  });

  it("requires reconfirmation when references disappear or change", async () => {
    supabase.rpc.mockResolvedValue({ data: { token: "changed", contents: [] }, error: null });
    const result = await mutateMasterRecord({
      table: "categories",
      operation: "delete",
      id: 3,
      confirmationToken: "original",
    });
    expect(result.confirmation?.token).toBe("changed");
    expect(supabase.rpc).toHaveBeenCalledTimes(1);
  });

  it("returns transaction errors without reporting success", async () => {
    supabase.rpc.mockResolvedValue({
      data: null,
      error: { message: "参照状況が変更されています。再確認してください。" },
    });
    expect((await mutateMasterRecord(input)).error?.message).toContain("再確認");
  });
});
