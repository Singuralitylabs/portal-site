-- categoriesテーブルの作成
DROP TABLE IF EXISTS categories;
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    category_type VARCHAR(50) NOT NULL, CHECK (category_type IN ('documents', 'videos')),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- init data
INSERT INTO categories (category_type, name, description)
     VALUES 
     ('documents', '未分類', ''),
     ('documents', '事務局資料', '事務局'),
     ('documents', '申請書類', '事務局'),
     ('documents', '広報用資料', '広報'),
     ('documents', '学習資料', '');
INSERT INTO categories (category_type, name, description)
    VALUES 
     ('videos', '未分類',''),
     ('videos', '全体交流会', '事務局'),
     ('videos', 'テクノロジー交流会', '事務局'),
     ('videos', 'ボードゲーム', 'SDGs'),
     ('videos', 'GAS基礎講座', '講座'),
     ('videos', 'GASアプリ解説', '講座'),
     ('videos', 'コンサルエッグ', 'SDGs');
