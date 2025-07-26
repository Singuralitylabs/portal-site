-- documentsテーブルのポリシー

-- 認証済みユーザーは全てのdocumentsを閲覧可能
DROP POLICY IF EXISTS "authenticated_users_can_read_documents" ON "documents";
CREATE POLICY "authenticated_users_can_read_documents" ON "documents"
  FOR SELECT
  TO authenticated
  USING (
    is_deleted = FALSE
  );

ALTER TABLE "documents" ENABLE ROW LEVEL SECURITY;
