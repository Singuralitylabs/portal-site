-- categoriesテーブルのポリシー

-- 認証済みユーザーは全てのcategoriesを閲覧可能
DROP POLICY IF EXISTS "authenticated_users_can_read_categories" ON "categories";
CREATE POLICY "authenticated_users_can_read_categories" ON "categories"
  FOR SELECT
  TO authenticated
  USING (
    is_deleted = FALSE
  );

-- SELECT: adminまたはmaintainerは削除済みを含むcategoriesを閲覧可能
DROP POLICY IF EXISTS "content_managers_can_read_all_categories" ON "categories";
CREATE POLICY "content_managers_can_read_all_categories" ON "categories"
  FOR SELECT
  TO authenticated
  USING (
    is_content_manager()
  );

-- INSERT: adminまたはmaintainerが新規categoriesを作成可能
DROP POLICY IF EXISTS "content_managers_can_insert_categories" ON "categories";
CREATE POLICY "content_managers_can_insert_categories" ON "categories"
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_deleted = FALSE
    AND
    is_content_manager()
  );

-- UPDATE: adminまたはmaintainerがcategoriesを更新可能（論理削除を含む）
DROP POLICY IF EXISTS "content_managers_can_update_categories" ON "categories";
CREATE POLICY "content_managers_can_update_categories" ON "categories"
  FOR UPDATE
  TO authenticated
  USING (
    is_content_manager()
  )
  WITH CHECK (
    is_content_manager()
  );

-- 物理削除の禁止（DELETEクエリを実行できないようにする）
DROP POLICY IF EXISTS "prevent_physical_delete_categories" ON "categories";
CREATE POLICY "prevent_physical_delete_categories" ON "categories"
  FOR DELETE
  USING (false);

ALTER TABLE "categories" ENABLE ROW LEVEL SECURITY;