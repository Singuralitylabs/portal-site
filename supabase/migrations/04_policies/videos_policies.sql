-- videosテーブルのポリシー

-- 認証済みユーザーは全てのvideosを閲覧可能
DROP POLICY IF EXISTS "authenticated_users_can_read_videos" ON "videos";
CREATE POLICY "authenticated_users_can_read_videos" ON "videos"
  FOR SELECT
  TO authenticated
  USING (
    is_deleted = FALSE
  );

ALTER TABLE "videos" ENABLE ROW LEVEL SECURITY;
