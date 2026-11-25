-- position_tagsのDELETEポリシー名を実態（admin・maintainer削除可）に合わせて改名する
-- 01_content_managers_can_modify_position_tags.sql で作成した旧名 admins_can_delete_position_tags を削除し、
-- 同じ条件で content_managers_can_delete_position_tags を作成する（動作変更なし）

-- 旧ポリシーを削除
DROP POLICY IF EXISTS "admins_can_delete_position_tags" ON "position_tags";

-- DELETE: admin・maintainerのみが削除可能（memberは削除不可）
DROP POLICY IF EXISTS "content_managers_can_delete_position_tags" ON "position_tags";
CREATE POLICY "content_managers_can_delete_position_tags" ON "position_tags"
  FOR DELETE
  TO authenticated
  USING (
    is_active_user() AND is_content_manager()
  );
