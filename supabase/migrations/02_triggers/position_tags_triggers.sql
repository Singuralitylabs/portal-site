-- position_tagsテーブルのupdated_at自動更新トリガー
DROP TRIGGER IF EXISTS update_position_tags_updated_at ON position_tags;
CREATE TRIGGER update_position_tags_updated_at
BEFORE UPDATE ON position_tags
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();