import { validateMasterMutation } from "@/app/utils/master-validation";

describe("master mutation validation", () => {
  it("accepts editable position fields", () => {
    expect(
      validateMasterMutation({
        table: "positions",
        operation: "update",
        id: 1,
        fields: { name: "役職", is_leadership: true },
      })
    ).toBeNull();
  });

  it.each([
    "id",
    "created_at",
    "created_by",
    "updated_at",
    "updated_by",
    "is_deleted",
    "display_order",
  ])("rejects protected field %s", key => {
    expect(
      validateMasterMutation({
        table: "documents",
        operation: "update",
        id: 1,
        fields: { [key]: 1 },
      })
    ).toContain("編集できない");
  });

  it("requires creation fields and bounded names", () => {
    expect(
      validateMasterMutation({ table: "documents", operation: "create", fields: { name: "資料" } })
    ).toContain("必須");
    expect(
      validateMasterMutation({
        table: "positions",
        operation: "create",
        fields: { name: " ".repeat(4) },
      })
    ).toContain("名称");
    expect(
      validateMasterMutation({
        table: "positions",
        operation: "create",
        fields: { name: "a".repeat(51) },
      })
    ).toContain("名称");
  });

  it("rejects unsafe URLs, references and times", () => {
    const invalidFields: Record<string, string | number>[] = [
      { url: "javascript:alert(1)" },
      { category_id: -1 },
      { length: 1.5 },
    ];
    for (const fields of invalidFields) {
      expect(
        validateMasterMutation({ table: "videos", operation: "update", id: 1, fields })
      ).not.toBeNull();
    }
  });

  it("limits restoration and rejects self placement", () => {
    expect(validateMasterMutation({ table: "positions", operation: "restore", id: 1 })).toContain(
      "復元できません"
    );
    expect(validateMasterMutation({ table: "documents", operation: "restore", id: 1 })).toBeNull();
    expect(
      validateMasterMutation({
        table: "positions",
        operation: "update",
        id: 1,
        fields: {},
        position: { type: "after", afterId: 1 },
      })
    ).toContain("配置");
  });
});
