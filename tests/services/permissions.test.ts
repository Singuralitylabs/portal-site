import { checkAdminPermissions, checkContentPermissions } from "../../app/services/auth/permissions";
import { USER_ROLE } from "../../app/constants/user";

/**
 * 権限判定ヘルパーの単体テスト。
 * 役割ごとの true/false 判定が期待どおりに返ることを確認する。
 */

describe("権限判定ヘルパー", () => {
  /**
   * 管理者権限の判定テスト。
   */
  describe("checkAdminPermissions", () => {
    /**
     * 役割ごとの判定結果を確認する。
     */
    it.each([
      [USER_ROLE.ADMIN, true],
      [USER_ROLE.MAINTAINER, false],
      [USER_ROLE.MEMBER, false],
      ["unknown", false],
    ])("role=%s は %s", (role, expected) => {
      // 管理者権限の判定結果が期待どおりであることを確認
      expect(checkAdminPermissions(role)).toBe(expected);
    });
  });

  /**
   * コンテンツ管理権限の判定テスト。
   */
  describe("checkContentPermissions", () => {
    /**
     * 役割ごとの判定結果を確認する。
     */
    it.each([
      [USER_ROLE.ADMIN, true],
      [USER_ROLE.MAINTAINER, true],
      [USER_ROLE.MEMBER, false],
      ["unknown", false],
    ])("role=%s は %s", (role, expected) => {
      // コンテンツ管理権限の判定結果が期待どおりであることを確認
      expect(checkContentPermissions(role)).toBe(expected);
    });
  });
});
