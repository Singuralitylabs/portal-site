-- videosテーブルのupdated_at自動更新トリガー
DROP TRIGGER IF EXISTS update_videos_updated_at ON videos;
CREATE TRIGGER update_videos_updated_at
BEFORE UPDATE ON videos
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
