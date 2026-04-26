-- 削除済みアプリの復活を許可するためのポリシー更新
-- 変更内容: USING句からis_deleted = FALSEの条件を削除し、削除済みアイテムも更新可能にする

DROP POLICY IF EXISTS "content_managers_can_update_applications" ON "applications";
CREATE POLICY "content_managers_can_update_applications" ON "applications"
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
