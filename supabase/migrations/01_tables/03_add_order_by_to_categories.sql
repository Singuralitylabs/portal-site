--  NULL 許容でカラム追加
ALTER TABLE categories
ADD COLUMN order_by INTEGER;
