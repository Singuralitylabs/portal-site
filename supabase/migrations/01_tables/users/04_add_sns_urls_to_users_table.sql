-- usersテーブルに各種snsのURL用のカラムを追加
ALTER TABLE users ADD COLUMN x_url TEXT;
ALTER TABLE users ADD COLUMN facebook_url TEXT;
ALTER TABLE users ADD COLUMN instagram_url TEXT;
ALTER TABLE users ADD COLUMN github_url TEXT;
ALTER TABLE users ADD COLUMN portfolio_url TEXT;


-- 2. CHECK制約（バリデーション）の追加
-- NULL（未入力）はOK、値があるなら http または https で始まる必要がある
ALTER TABLE users 
    ADD CONSTRAINT users_x_url_check 
    CHECK (x_url IS NULL OR x_url ~* '^https?://');

ALTER TABLE users 
    ADD CONSTRAINT users_facebook_url_check 
    CHECK (facebook_url IS NULL OR facebook_url ~* '^https?://');

ALTER TABLE users 
    ADD CONSTRAINT users_instagram_url_check 
    CHECK (instagram_url IS NULL OR instagram_url ~* '^https?://');

ALTER TABLE users 
    ADD CONSTRAINT users_github_url_check 
    CHECK (github_url IS NULL OR github_url ~* '^https?://');

ALTER TABLE users 
    ADD CONSTRAINT users_portfolio_url_check 
    CHECK (portfolio_url IS NULL OR portfolio_url ~* '^https?://');