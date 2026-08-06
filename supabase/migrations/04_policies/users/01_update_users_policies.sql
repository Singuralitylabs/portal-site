-- usersテーブルのポリシー更新（00_users_policies.sql の SELECT / 管理者ポリシーを差し替える）
--
-- ポリシー内の関数呼び出し（auth.uid() およびヘルパー関数）は (SELECT ...) でラップしている。
-- 相関のないスカラサブクエリはInitPlanとして評価されるため、行ごとではなく
-- ステートメントあたり1回の評価になる（判定結果は変わらない）。

-- SELECT: 旧ポリシー（全認証ユーザーが全データを閲覧可能）を削除
-- 承認前・否認済みユーザーによる全会員情報の列挙を防ぐため、下記2ポリシーに分割する
DROP POLICY IF EXISTS "authenticated_users_can_read_all" ON "users";

-- SELECT: ユーザーは自身のデータを閲覧可能
-- 承認前・否認済みユーザーが自身のステータスを確認するために必要
DROP POLICY IF EXISTS "users_can_read_own_data" ON "users";
CREATE POLICY "users_can_read_own_data" ON "users"
  FOR SELECT
  TO authenticated
  USING (
    auth_id = (SELECT auth.uid())
    AND is_deleted = FALSE
  );

-- SELECT: アクティブユーザーは削除されていない全データを閲覧可能
DROP POLICY IF EXISTS "active_users_can_read_all" ON "users";
CREATE POLICY "active_users_can_read_all" ON "users"
  FOR SELECT
  TO authenticated
  USING (
    (SELECT is_active_user())
    AND is_deleted = FALSE
  );

-- UPDATE: 管理者はすべてのユーザー情報を更新可能
DROP POLICY IF EXISTS "admins_can_update_all_users" ON "users";
CREATE POLICY "admins_can_update_all_users" ON "users"
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT is_active_user()) AND (SELECT is_admin())
  )
  WITH CHECK (
    (SELECT is_active_user()) AND (SELECT is_admin())
  );

-- DELETE: 管理者はユーザーの論理削除が可能
-- 上記 admins_can_update_all_users と条件は同一（論理削除もUPDATEのため）。
-- 設計書の「管理者は全ユーザー情報を更新可能」「管理者は全ユーザーの論理削除が可能」に
-- 対応付けるため、意図を明示する目的で2本に分けたまま維持する。
DROP POLICY IF EXISTS "admins_can_delete_users" ON "users";
CREATE POLICY "admins_can_delete_users" ON "users"
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT is_active_user()) AND (SELECT is_admin())
  )
  WITH CHECK (
    (SELECT is_active_user()) AND (SELECT is_admin())
  );
