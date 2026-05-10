-- position_tagsテーブルのポリシー

-- SELECT: 認証済みユーザーは全データを閲覧可能
DROP POLICY IF EXISTS "authenticated_users_can_read_all" ON "position_tags";
CREATE POLICY "authenticated_users_can_read_all" ON "position_tags"
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE auth_id = auth.uid()
      AND status = 'active'
      AND is_deleted = FALSE
    )
  );

-- INSERT: ユーザーは自身のデータのみ登録可能
DROP POLICY IF EXISTS "users_can_insert_own_data" ON "position_tags";
CREATE POLICY "users_can_insert_own_data" ON "position_tags"
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE
        users.id = user_id
        AND users.auth_id = auth.uid()
        AND users.role = 'member'
        AND users.status = 'active'
        AND users.is_deleted = FALSE
    )
  );

-- INSERT: 管理者またはメンテナーは全データを登録可能
DROP POLICY IF EXISTS "content_managers_can_insert" ON "position_tags";
CREATE POLICY "content_managers_can_insert" ON "position_tags"
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE 
        auth_id = auth.uid()
        AND role IN ('admin', 'maintainer')
        AND status = 'active'
        AND is_deleted = FALSE
    )
  );

-- UPDATE: ユーザーは自身のデータのみ更新可能
DROP POLICY IF EXISTS "users_can_update_own_data" ON "position_tags";
CREATE POLICY "users_can_update_own_data" ON "position_tags"
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE
        users.id = user_id
        AND users.auth_id = auth.uid()
        AND users.role = 'member'
        AND users.status = 'active'
        AND users.is_deleted = FALSE
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE
        users.id = user_id
        AND users.auth_id = auth.uid()
        AND users.role = 'member'
        AND users.status = 'active'
        AND users.is_deleted = FALSE
    )
  );

-- UPDATE: 管理者またはメンテナーは全データを更新可能
DROP POLICY IF EXISTS "content_managers_can_update" ON "position_tags";
CREATE POLICY "content_managers_can_update" ON "position_tags"
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE
        auth_id = auth.uid()
        AND role IN ('admin', 'maintainer')
        AND status = 'active'
        AND is_deleted = FALSE
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE
        auth_id = auth.uid()
        AND role IN ('admin', 'maintainer')
        AND status = 'active'
        AND is_deleted = FALSE
    )
  );

-- DELETE: ユーザーは自身のデータのみを、管理者またはメンテナーは全データを物理削除可能
DROP POLICY IF EXISTS "self_user_or_admins_can_physical_delete" ON "position_tags";
CREATE POLICY "self_user_or_admins_can_physical_delete" ON "position_tags"
  FOR DELETE
  TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM users
          WHERE
            users.id = user_id
            AND users.auth_id = auth.uid()
            AND users.role = 'member'
            AND users.status = 'active'
            AND users.is_deleted = FALSE
        )
        OR
        EXISTS (
          SELECT 1 FROM users
          WHERE
            auth_id = auth.uid()
            AND role IN ('admin', 'maintainer')
            AND status = 'active'
            AND is_deleted = FALSE
        )
      );

-- RLSを有効化
ALTER TABLE "position_tags" ENABLE ROW LEVEL SECURITY;
