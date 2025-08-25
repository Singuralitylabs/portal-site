-- videosテーブルのポリシー

-- 認証済みユーザーは全てのvideosを閲覧可能
DROP POLICY IF EXISTS "authenticated_users_can_read_videos" ON "videos";
CREATE POLICY "authenticated_users_can_read_videos" ON "videos"
  FOR SELECT
  TO authenticated
  USING (
    is_deleted = FALSE
  );

-- INSERT: adminまたはmaintainerが新規videosを作成可能
DROP POLICY IF EXISTS "content_managers_can_insert_videos" ON "videos";
CREATE POLICY "content_managers_can_insert_videos" ON "videos"
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

-- UPDATE: adminまたはmaintainerがvideosを更新可能
DROP POLICY IF EXISTS "content_managers_can_update_videos" ON "videos";
CREATE POLICY "content_managers_can_update_videos" ON "videos"
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

-- DELETE: adminまたはmaintainerがvideosを論理削除可能
DROP POLICY IF EXISTS "content_managers_can_delete_videos" ON "videos";
CREATE POLICY "content_managers_can_delete_videos" ON "videos"
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

ALTER TABLE "videos" ENABLE ROW LEVEL SECURITY;
