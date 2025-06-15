--  NULL 許容でカラム追加
ALTER TABLE videos
ADD COLUMN category_id INTEGER;

-- 既存データの置換
UPDATE videos  SET category_id = 20 WHERE category = 'xxx';
-- 既存のカテゴリー分、実施する

-- 残りの行に不明として 0 を入れる（カテゴリーなし）
UPDATE videos 　SET category_id = 0 WHERE category_id IS NULL;

-- カラムに NOT NULL を追加
ALTER TABLE documents
ALTER COLUMN category_id SET NOT NULL;