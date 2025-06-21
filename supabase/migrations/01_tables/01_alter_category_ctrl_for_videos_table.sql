--  NULL 許容でカラム追加
ALTER TABLE videos
ADD COLUMN category_id INTEGER;

-- 既存データの置換
UPDATE videos  SET category_id = 20 WHERE category = '全体交流会';
UPDATE videos  SET category_id = 21 WHERE category = 'テクノロジー交流会';
UPDATE videos  SET category_id = 22 WHERE category = 'ボードゲーム';
UPDATE videos  SET category_id = 23 WHERE category = 'GAS基礎講座';
UPDATE videos  SET category_id = 24 WHERE category = 'GASアプリ解説';
UPDATE videos  SET category_id = 25 WHERE category = 'コンサルエッグ';

-- 残りの行に不明として 0 を入れる（カテゴリーなし）
UPDATE videos  SET category_id = 0 WHERE category_id IS NULL;

-- カラムに NOT NULL を追加
ALTER TABLE videos
ALTER COLUMN category_id SET NOT NULL,
DROP COLUMN category;
