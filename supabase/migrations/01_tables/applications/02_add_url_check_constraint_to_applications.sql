-- 1. 古い制約を削除
ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_url_https_check;

-- 2. 新しい制約（IS NULL OR あり）を追加
-- applicationsテーブルのurlカラムにhttpsのみ許可するCHECK制約を追加
-- NULLは許容（未入力可）、入力がある場合はhttps://から始まること
ALTER TABLE applications
  ADD CONSTRAINT applications_url_https_check
  CHECK (url IS NULL OR url ~ '^https://');
  