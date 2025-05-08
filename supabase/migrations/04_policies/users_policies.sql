-- usersテーブルのポリシー

-- 登録済みユーザーは自分自身のデータのみ閲覧可能
DROP POLICY IF EXISTS "users_can_read_own_data" ON "users";
CREATE POLICY "users_can_read_own_data" ON "users"
  FOR SELECT
  USING (
    clerk_id = get_clerk_user_id()
    AND status = 'active'
    AND is_deleted = FALSE
  );

-- 管理者は全ユーザーデータを閲覧可能
DROP POLICY IF EXISTS "admins_can_read_all_users" ON "users";
CREATE POLICY "admins_can_read_all_users" ON "users"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE 
        clerk_id = get_clerk_user_id()
        AND role = 'admin'
        AND status = 'active'
        AND is_deleted = FALSE
    )
  );

-- INSERT: 新規ユーザー登録（Webhookからの登録のみ許可）
-- 注: これは主にClerkのWebhookからの登録に使用される
DROP POLICY IF EXISTS "webhook_can_insert_users" ON "users";
CREATE POLICY "webhook_can_insert_users" ON "users"
  FOR INSERT
  WITH CHECK (
    -- サービスロールまたは特別な認証トークンでの実行のみ許可
    -- 実際の環境では、さらに厳格な認証を追加することをお勧めします
    true  -- Webhook用のサービスロールは基本的にRLSをバイパスするため、このポリシーは形式的なものです
  );

-- UPDATE: ユーザーは自分自身の情報のみ更新可能
DROP POLICY IF EXISTS "users_can_update_own_data" ON "users";
CREATE POLICY "users_can_update_own_data" ON "users"
  FOR UPDATE
  USING (
    clerk_id = get_clerk_user_id()
    AND status = 'active'
    AND is_deleted = FALSE
  )
  WITH CHECK (
    clerk_id = get_clerk_user_id()
    AND status = 'active'
    AND is_deleted = FALSE
  );

-- UPDATE: 管理者はすべてのユーザー情報を更新可能
DROP POLICY IF EXISTS "admins_can_update_all_users" ON "users";
CREATE POLICY "admins_can_update_all_users" ON "users"
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE 
        clerk_id = get_clerk_user_id()
        AND role = 'admin'
        AND status = 'active'
        AND is_deleted = FALSE
    )
  );

-- DELETE: 物理削除は禁止し、論理削除のみ許可（自分自身のみ）
DROP POLICY IF EXISTS "users_can_delete_own_data" ON "users";
CREATE POLICY "users_can_delete_own_data" ON "users"
  FOR UPDATE
  USING (
    clerk_id = get_clerk_user_id()
    AND status = 'active'
    AND is_deleted = FALSE
  )
  WITH CHECK (
    clerk_id = get_clerk_user_id()
    AND status = 'active'
    AND is_deleted = TRUE  -- 論理削除のみ許可
  );

-- DELETE: 管理者はユーザーの論理削除が可能
DROP POLICY IF EXISTS "admins_can_delete_users" ON "users";
CREATE POLICY "admins_can_delete_users" ON "users"
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE 
        clerk_id = get_clerk_user_id()
        AND role = 'admin'
        AND status = 'active'
        AND is_deleted = FALSE
    )
  );

-- 物理削除の禁止（DELETEクエリを実行できないようにする）
DROP POLICY IF EXISTS "prevent_physical_delete" ON "users";
CREATE POLICY "prevent_physical_delete" ON "users"
  FOR DELETE
  USING (false);  -- 常にfalseを返すことで物理削除を防止

-- RLSを有効化
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
