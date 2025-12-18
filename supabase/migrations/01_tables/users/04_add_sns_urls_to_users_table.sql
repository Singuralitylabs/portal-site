-- usersテーブルに各種SNSのURLカラムを追加
ALTER TABLE users ADD COLUMN x_url TEXT;
ALTER TABLE users ADD COLUMN facebook_url TEXT;
ALTER TABLE users ADD COLUMN instagram_url TEXT;
ALTER TABLE users ADD COLUMN github_url TEXT;
ALTER TABLE users ADD COLUMN portfolio_url TEXT;