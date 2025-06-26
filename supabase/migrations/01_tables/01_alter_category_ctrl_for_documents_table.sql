--  NULL 許容でカラム追加
ALTER TABLE documents
ADD COLUMN category_id INTEGER;

-- 既存データの置換
UPDATE documents
SET category_id = CASE
    WHEN category = '事務局資料' THEN 2
    WHEN ategory = '申請書類' THEN 3
    WHEN ategory = '広報用資料' THEN 4
    WHEN category = '学習資料' THEN 5
    ELSE 1 -- 未分類
END;

-- カラムに NOT NULL を追加
ALTER TABLE documents
ALTER COLUMN category_id SET NOT NULL,
DROP COLUMN category;