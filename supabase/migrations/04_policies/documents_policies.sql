-- documentsテーブルのポリシー

-- 登録済みユーザーは全てのdocumentsを閲覧可能
DROP POLICY IF EXISTS "registered_users_can_read_documents" ON "documents";
CREATE POLICY "registered_users_can_read_documents" ON "documents"
  FOR SELECT
  USING (
    is_registered_user()
    AND is_deleted = FALSE
    AND status = 'active'
  );

ALTER TABLE "documents" ENABLE ROW LEVEL SECURITY;
