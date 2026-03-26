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