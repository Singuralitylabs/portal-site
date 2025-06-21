--  NULL 許容でカラム追加
ALTER TABLE documents
ADD COLUMN category_id INTEGER;

-- 既存データの置換
UPDATE documents  SET category_id = 10 WHERE category = '事務局資料';
UPDATE documents  SET category_id = 11 WHERE category = '申請書類';
UPDATE documents  SET category_id = 12 WHERE category = '広報用資料';
UPDATE documents  SET category_id = 13 WHERE category = '学習資料';

-- 残りの行に不明として 0 を入れる（カテゴリーなし）
UPDATE documents  SET category_id = 0 WHERE category_id IS NULL;

-- カラムに NOT NULL を追加
ALTER TABLE documents
ALTER COLUMN category_id SET NOT NULL,
DROP COLUMN category;