-- documentsテーブルのurlカラムにhttpsのみ許可するCHECK制約を追加
ALTER TABLE documents
  ADD CONSTRAINT documents_url_https_check
  CHECK (url ~ '^https://');