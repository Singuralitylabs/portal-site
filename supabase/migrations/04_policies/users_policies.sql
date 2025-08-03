-- usersテーブルのポリシー

-- 認証済みユーザーは全データを閲覧可能
DROP POLICY IF EXISTS "authenticated_users_can_read_all" ON "users";
CREATE POLICY "authenticated_users_can_read_all" ON "users"
  FOR SELECT
  TO authenticated
  USING (is_deleted = FALSE);

-- INSERT: 新規ユーザー登録（Supabase Authからの自動登録のみ許可）
-- 注: これはSupabase Authでの認証成功時に自動的に作成される
DROP POLICY IF EXISTS "auth_users_can_insert" ON "users";
CREATE POLICY "auth_users_can_insert" ON "users"
  FOR INSERT
  WITH CHECK (
    auth.uid() = auth_id
  );

-- UPDATE: ユーザーは自分自身の情報のみ更新可能
DROP POLICY IF EXISTS "users_can_update_own_data" ON "users";
CREATE POLICY "users_can_update_own_data" ON "users"
  FOR UPDATE
  USING (
    auth_id = auth.uid()
    AND is_deleted = FALSE
  )
  WITH CHECK (
    auth_id = auth.uid()
    AND is_deleted = FALSE
  );

-- UPDATE: 管理者はすべてのユーザー情報を更新可能
DROP POLICY IF EXISTS "admins_can_update_all_users" ON "users";
CREATE POLICY "admins_can_update_all_users" ON "users"
  FOR UPDATE
  USING (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
  );

-- DELETE: 物理削除は禁止し、論理削除のみ許可（自分自身のみ）
DROP POLICY IF EXISTS "users_can_delete_own_data" ON "users";
CREATE POLICY "users_can_delete_own_data" ON "users"
  FOR UPDATE
  USING (
    auth_id = auth.uid()
    AND is_deleted = FALSE
  )
  WITH CHECK (
    auth_id = auth.uid()
    AND is_deleted = TRUE  -- 論理削除のみ許可
  );

-- DELETE: 管理者はユーザーの論理削除が可能
DROP POLICY IF EXISTS "admins_can_delete_users" ON "users";
CREATE POLICY "admins_can_delete_users" ON "users"
  FOR UPDATE
  USING (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
  );

-- 物理削除の禁止（DELETEクエリを実行できないようにする）
DROP POLICY IF EXISTS "prevent_physical_delete" ON "users";
CREATE POLICY "prevent_physical_delete" ON "users"
  FOR DELETE
  USING (false);  -- 常にfalseを返すことで物理削除を防止

-- RLSを有効化
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
