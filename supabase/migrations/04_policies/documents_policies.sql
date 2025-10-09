-- documentsテーブルのポリシー

-- 認証済みユーザーは全てのdocumentsを閲覧可能
DROP POLICY IF EXISTS "authenticated_users_can_read_documents" ON "documents";
CREATE POLICY "authenticated_users_can_read_documents" ON "documents"
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE auth_id = auth.uid()
      AND status = 'active'
      AND is_deleted = false
    )
    AND is_deleted = false
  );

-- INSERT: adminまたはmaintainerが新規documentsを作成可能
DROP POLICY IF EXISTS "content_managers_can_insert_documents" ON "documents";
CREATE POLICY "content_managers_can_insert_documents" ON "documents"
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

-- UPDATE: adminまたはmaintainerがdocumentsを更新可能
DROP POLICY IF EXISTS "content_managers_can_update_documents" ON "documents";
CREATE POLICY "content_managers_can_update_documents" ON "documents"
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
  );

-- 物理削除の禁止（DELETEクエリを実行できないようにする）
DROP POLICY IF EXISTS "prevent_physical_delete_documents" ON "documents";
CREATE POLICY "prevent_physical_delete_documents" ON "documents"
  FOR DELETE
  USING (false);  -- 常にfalseを返すことで物理削除を防止

ALTER TABLE "documents" ENABLE ROW LEVEL SECURITY;
