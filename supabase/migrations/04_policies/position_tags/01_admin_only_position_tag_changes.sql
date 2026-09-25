-- 役職タグの変更はadmin・maintainerに許可する
DROP POLICY IF EXISTS "users_can_insert_own_data" ON "position_tags";
DROP POLICY IF EXISTS "content_managers_can_insert" ON "position_tags";
CREATE POLICY "admins_can_insert_position_tags" ON "position_tags"
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_active_user() AND is_content_manager()
  );

DROP POLICY IF EXISTS "users_can_update_own_data" ON "position_tags";
DROP POLICY IF EXISTS "content_managers_can_update" ON "position_tags";
CREATE POLICY "admins_can_update_position_tags" ON "position_tags"
  FOR UPDATE
  TO authenticated
  USING (
    is_active_user() AND is_content_manager()
  )
  WITH CHECK (
    is_active_user() AND is_content_manager()
  );

DROP POLICY IF EXISTS "self_user_or_admins_can_physical_delete" ON "position_tags";
CREATE POLICY "admins_can_delete_position_tags" ON "position_tags"
  FOR DELETE
  TO authenticated
  USING (
    is_active_user() AND is_content_manager()
  );