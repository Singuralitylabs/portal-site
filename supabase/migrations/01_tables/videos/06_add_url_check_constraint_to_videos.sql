-- videosテーブルのurlカラムにhttpsのみ許可するCHECK制約を追加
ALTER TABLE videos
  ADD CONSTRAINT videos_url_https_check
  CHECK (url ~ '^https://');