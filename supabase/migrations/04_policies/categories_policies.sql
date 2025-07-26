-- categoriesテーブルのポリシー

-- 認証済みユーザーは全てのcategoriesを閲覧可能
DROP POLICY IF EXISTS "authenticated_users_can_read_categories" ON "categories";
CREATE POLICY "authenticated_users_can_read_categories" ON "categories"
  FOR SELECT
  TO authenticated
  USING (
    is_deleted = FALSE
  );

ALTER TABLE "categories" ENABLE ROW LEVEL SECURITY;