-- 既存のNULLデータを0に更新
UPDATE documents SET display_order = 0 WHERE display_order IS NULL;

-- display_order を NOT NULL DEFAULT 0 に変更
ALTER TABLE documents
ALTER COLUMN display_order SET DEFAULT 0,
ALTER COLUMN display_order SET NOT NULL;
