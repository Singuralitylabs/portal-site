-- positionsテーブルのポリシー

-- SELECT: 認証済みユーザーは削除されていないもののみ、admin/maintainerは全て閲覧可能
DROP POLICY IF EXISTS "authenticated_users_can_read_positions" ON "positions";
CREATE POLICY "authenticated_users_can_read_positions" ON "positions"
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE auth_id = auth.uid()
      AND status = 'active'
      AND is_deleted = FALSE
    )
    AND (
      -- 認証済みユーザー: 削除されていないもののみ
      is_deleted = FALSE
      OR
      -- admin/maintainer: 削除済みも含めてすべて閲覧可能
      EXISTS (
        SELECT 1 FROM users
        WHERE auth_id = auth.uid()
        AND role IN ('admin', 'maintainer')
        AND status = 'active'
        AND is_deleted = FALSE
      )
    )
  );

-- INSERT: adminまたはmaintainerが新規positionsを作成可能
DROP POLICY IF EXISTS "content_managers_can_insert_positions" ON "positions";
CREATE POLICY "content_managers_can_insert_positions" ON "positions"
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

-- UPDATE: adminまたはmaintainerがpositionsを更新可能
DROP POLICY IF EXISTS "content_managers_can_update_positions" ON "positions";
CREATE POLICY "content_managers_can_update_positions" ON "positions"
  FOR UPDATE
  TO authenticated
  USING (
    is_deleted = FALSE
    AND EXISTS (
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

-- 物理削除の禁止（DELETEクエリを実行できないようにする）
DROP POLICY IF EXISTS "prevent_physical_delete_positions" ON "positions";
CREATE POLICY "prevent_physical_delete_positions" ON "positions"
  FOR DELETE
  USING (false);  -- 常にfalseを返すことで物理削除を防止

ALTER TABLE "positions" ENABLE ROW LEVEL SECURITY;
