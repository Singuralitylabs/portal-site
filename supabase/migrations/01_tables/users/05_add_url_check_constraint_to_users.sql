-- 1. 既存の制約を削除
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_x_url_https_check;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_facebook_url_https_check;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_instagram_url_https_check;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_github_url_https_check;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_portfolio_url_https_check;

-- 2. 新しい制約を改めて追加
-- usersテーブルの各SNS URLカラムにhttpsのみ許可するCHECK制約を追加
-- NULLは許容（未入力可）、入力がある場合はhttps://から始まること
ALTER TABLE users
  ADD CONSTRAINT users_x_url_https_check
  CHECK (x_url IS NULL OR x_url ~ '^https://'),
  ADD CONSTRAINT users_facebook_url_https_check
  CHECK (facebook_url IS NULL OR facebook_url ~ '^https://'),
  ADD CONSTRAINT users_instagram_url_https_check
  CHECK (instagram_url IS NULL OR instagram_url ~ '^https://'),
  ADD CONSTRAINT users_github_url_https_check
  CHECK (github_url IS NULL OR github_url ~ '^https://'),
  ADD CONSTRAINT users_portfolio_url_https_check
  CHECK (portfolio_url IS NULL OR portfolio_url ~ '^https://');
  