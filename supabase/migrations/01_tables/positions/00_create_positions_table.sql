-- positionsテーブルの作成
CREATE TABLE IF NOT EXISTS positions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    display_order INTEGER,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- init data
INSERT INTO positions (name, display_order)
     VALUES 
     ('チームリーダー', 1),
     ('広報チーム', 2),
     ('SDGsチーム', 3),
     ('ハロスクチーム', 4),
     ('シンラボチーム', 5),
     ('AI事業創出チーム', 6),
     ('事務局', 7);
