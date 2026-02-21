-- 既存のNULLデータを0に更新
UPDATE categories SET display_order = 0 WHERE display_order IS NULL;

-- display_order を NOT NULL DEFAULT 0 に変更
ALTER TABLE categories
ALTER COLUMN display_order SET DEFAULT 0,
ALTER COLUMN display_order SET NOT NULL;
