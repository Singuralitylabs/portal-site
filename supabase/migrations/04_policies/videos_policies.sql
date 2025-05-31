-- videosテーブルのポリシー

-- 登録済みユーザーは全てのvideosを閲覧可能
DROP POLICY IF EXISTS "registered_users_can_read_videos" ON "videos";
CREATE POLICY "registered_users_can_read_videos" ON "videos"
  FOR SELECT
  USING (
    is_registered_user()
    AND is_deleted = FALSE
  );

ALTER TABLE "videos" ENABLE ROW LEVEL SECURITY;
