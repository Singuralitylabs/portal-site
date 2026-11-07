-- 役職タグの変更をadmin・maintainerのみに制限する
-- memberは役職タグの登録・更新ができなくする
DROP POLICY IF EXISTS "users_can_insert_own_data" ON "position_tags";
DROP POLICY IF EXISTS "users_can_update_own_data" ON "position_tags";

-- DELETE: admin・maintainerのみが削除可能（memberは削除不可）
DROP POLICY IF EXISTS "self_user_or_admins_can_physical_delete" ON "position_tags";
CREATE POLICY "admins_can_delete_position_tags" ON "position_tags"
  FOR DELETE
  TO authenticated
  USING (
    is_active_user() AND is_content_manager()
  );