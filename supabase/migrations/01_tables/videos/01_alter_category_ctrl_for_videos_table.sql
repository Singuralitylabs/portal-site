--  NULL 許容でカラム追加
ALTER TABLE videos
ADD COLUMN category_id INTEGER;

-- 既存データの置換
UPDATE videos
SET category_id = CASE
    WHEN category = '全体交流会' THEN 7
    WHEN category = 'テクノロジー交流会' THEN 8
    WHEN category = 'ボードゲーム' THEN 9
    WHEN category = 'GAS基礎講座' THEN 10
    WHEN category = 'GASアプリ解説' THEN 11
    WHEN category = 'コンサルエッグ' THEN 12
    ELSE 6 -- 未分類
END;

-- カラムに NOT NULL を追加
ALTER TABLE videos
ALTER COLUMN category_id SET NOT NULL,
DROP COLUMN category;
