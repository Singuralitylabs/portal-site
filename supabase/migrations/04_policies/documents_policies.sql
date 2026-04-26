-- documentsテーブルのポリシー

-- SELECT: 一般ユーザーは削除されていないもののみ、admin/maintainerは全て閲覧可能
DROP POLICY IF EXISTS "authenticated_users_can_read_documents" ON "documents";
CREATE POLICY "authenticated_users_can_read_documents" ON "documents"
  FOR SELECT
  TO authenticated
  USING (
    is_active_user()
    AND (
      -- 一般ユーザー: 削除されていないもののみ
      is_deleted = FALSE
      OR
      -- admin/maintainer: 削除済みも含めてすべて閲覧可能
      is_content_manager()
    )
  );

-- INSERT: adminまたはmaintainerが新規documentsを作成可能
DROP POLICY IF EXISTS "content_managers_can_insert_documents" ON "documents";
CREATE POLICY "content_managers_can_insert_documents" ON "documents"
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_content_manager()
  );

-- UPDATE: adminまたはmaintainerがdocumentsを更新可能
DROP POLICY IF EXISTS "content_managers_can_update_documents" ON "documents";
CREATE POLICY "content_managers_can_update_documents" ON "documents"
  FOR UPDATE
  TO authenticated
  USING (
    is_deleted = FALSE
    AND is_content_manager()
  )
  WITH CHECK (
    is_content_manager()
  );

-- 物理削除の禁止（DELETEクエリを実行できないようにする）
DROP POLICY IF EXISTS "prevent_physical_delete_documents" ON "documents";
CREATE POLICY "prevent_physical_delete_documents" ON "documents"
  FOR DELETE
  USING (false);  -- 常にfalseを返すことで物理削除を防止

ALTER TABLE "documents" ENABLE ROW LEVEL SECURITY;
