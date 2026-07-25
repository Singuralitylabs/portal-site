-- usersテーブルのポリシー更新（00_users_policies.sql の SELECT / 管理者ポリシーを差し替える）

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
    auth_id = auth.uid()
    AND is_deleted = FALSE
  );

-- SELECT: アクティブユーザーは削除されていない全データを閲覧可能
DROP POLICY IF EXISTS "active_users_can_read_all" ON "users";
CREATE POLICY "active_users_can_read_all" ON "users"
  FOR SELECT
  TO authenticated
  USING (
    is_active_user()
    AND is_deleted = FALSE
  );

-- UPDATE: 管理者はすべてのユーザー情報を更新可能
DROP POLICY IF EXISTS "admins_can_update_all_users" ON "users";
CREATE POLICY "admins_can_update_all_users" ON "users"
  FOR UPDATE
  USING (
    is_active_user() AND is_admin()
  )
  WITH CHECK (
    is_active_user() AND is_admin()
  );

-- DELETE: 管理者はユーザーの論理削除が可能
DROP POLICY IF EXISTS "admins_can_delete_users" ON "users";
CREATE POLICY "admins_can_delete_users" ON "users"
  FOR UPDATE
  USING (
    is_active_user() AND is_admin()
  )
  WITH CHECK (
    is_active_user() AND is_admin()
  );
