import {
  restoreApplication,
  restoreCategory,
  restoreDocument,
  restoreVideo,
} from "@/app/services/api/trash-client";
import { mutateMasterRecordAction } from "@/app/services/api/master-actions";

jest.mock("@/app/services/api/master-actions", () => ({ mutateMasterRecordAction: jest.fn() }));

describe("trash client server delegation", () => {
  beforeEach(() => jest.clearAllMocks());
  it.each([
    ["documents", (id: number) => restoreDocument(id, 999)],
    ["videos", (id: number) => restoreVideo(id, 999)],
    ["applications", (id: number) => restoreApplication(id, 999)],
    ["categories", (id: number) => restoreCategory(id)],
  ] as const)(
    "delegates %s restoration without trusting client audit IDs",
    async (table, execute) => {
      const action = mutateMasterRecordAction as jest.Mock;
      action.mockResolvedValue({ success: true, error: null, id: 5 });
      expect(await execute(5)).toEqual({ success: true, error: null, id: 5 });
      expect(action).toHaveBeenCalledWith({ table, operation: "restore", id: 5 });
      action.mockResolvedValue({ success: false, error: { message: "権限がありません" } });
      expect((await execute(5)).success).toBe(false);
    }
  );
});
