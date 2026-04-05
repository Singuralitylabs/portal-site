-- 1. 古い制約を削除
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_url_https_check;

-- 2. 新しい制約（IS NULL OR あり）を追加
-- documentsテーブルのurlカラムにhttpsのみ許可するCHECK制約を追加
-- NULLは許容（未入力可）、入力がある場合はhttps://から始まること
ALTER TABLE documents
  ADD CONSTRAINT documents_url_https_check
  CHECK (url IS NULL OR url ~ '^https://');
  