-- applicationsテーブルのurlカラムにhttpsのみ許可するCHECK制約を追加
ALTER TABLE applications
  ADD CONSTRAINT applications_url_https_check
  CHECK (url ~ '^https://');