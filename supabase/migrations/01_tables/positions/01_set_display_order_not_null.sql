-- 既存のNULLデータを0に更新
UPDATE positions SET display_order = 0 WHERE display_order IS NULL;

-- display_order を NOT NULL DEFAULT 0 に変更
ALTER TABLE positions
ALTER COLUMN display_order SET DEFAULT 0,
ALTER COLUMN display_order SET NOT NULL;
