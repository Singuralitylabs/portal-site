-- documentsテーブルのポリシー

-- 認証済みユーザーは全てのdocumentsを閲覧可能
DROP POLICY IF EXISTS "authenticated_users_can_read_documents" ON "documents";
CREATE POLICY "authenticated_users_can_read_documents" ON "documents"
  FOR SELECT
  TO authenticated
  USING (
    is_deleted = FALSE
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

-- DELETE: adminまたはmaintainerがdocumentsを論理削除可能
DROP POLICY IF EXISTS "content_managers_can_delete_documents" ON "documents";
CREATE POLICY "content_managers_can_delete_documents" ON "documents"
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
    is_deleted = TRUE  -- 論理削除のみ許可
  );

ALTER TABLE "documents" ENABLE ROW LEVEL SECURITY;
