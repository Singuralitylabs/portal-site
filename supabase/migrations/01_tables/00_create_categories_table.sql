-- categoriesテーブルの作成
DROP table categories;
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    category_type VARCHAR(50) NOT NULL, CHECK (category_type IN ('documents', 'videos')),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_by INTEGER NOT NULL DEFAULT '1' REFERENCES users(id),
    updated_by INTEGER NOT NULL DEFAULT '1' REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- init data
INSERT INTO categories (id, category_type, name)
     VALUES 
     (10, 'documents', '事務局資料'),
     (11, 'documents', '申請書類'),
     (12, 'documents', '広報用資料'),
     (13, 'documents', '学習資料');
INSERT INTO categories (id, category_type, name)
    VALUES 
     (20, 'videos', '全体交流会'),
     (21, 'videos', 'テクノロジー交流会'),
     (22, 'videos', 'ボードゲーム'),
     (23, 'videos', 'GAS基礎講座'),
     (24, 'videos', 'GASアプリ解説'),
     (25, 'videos', 'コンサルエッグ');
