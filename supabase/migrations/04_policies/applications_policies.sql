-- applicationsテーブルのポリシー

-- SELECT: 一般ユーザーは削除されていないもののみ、admin/maintainerは全て閲覧可能
DROP POLICY IF EXISTS "authenticated_users_can_read_applications" ON "applications";
CREATE POLICY "authenticated_users_can_read_applications" ON "applications"
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE auth_id = auth.uid()
      AND status = 'active'
      AND is_deleted = false
    )
    AND (
      -- 一般ユーザー: 削除されていないもののみ
      is_deleted = false
      OR
      -- admin/maintainer: 削除済みも含めてすべて閲覧可能
      EXISTS (
        SELECT 1 FROM users
        WHERE auth_id = auth.uid()
        AND role IN ('admin', 'maintainer')
        AND status = 'active'
        AND is_deleted = false
      )
    )
  );

-- INSERT: adminまたはmaintainerが新規applicationsを作成可能
DROP POLICY IF EXISTS "content_managers_can_insert_applications" ON "applications";
CREATE POLICY "content_managers_can_insert_applications" ON "applications"
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

-- UPDATE: adminまたはmaintainerがapplicationsを更新可能
DROP POLICY IF EXISTS "content_managers_can_update_applications" ON "applications";
CREATE POLICY "content_managers_can_update_applications" ON "applications"
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
DROP POLICY IF EXISTS "prevent_physical_delete_applications" ON "applications";
CREATE POLICY "prevent_physical_delete_applications" ON "applications"
  FOR DELETE
  USING (false);  -- 常にfalseを返すことで物理削除を防止

ALTER TABLE "applications" ENABLE ROW LEVEL SECURITY;
