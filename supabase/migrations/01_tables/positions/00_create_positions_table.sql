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
INSERT INTO positions (name)
     VALUES 
     ('チームリーダー'),
     ('広報チーム'),
     ('SDGsチーム'),
     ('ハロスクチーム'),
     ('シンラボチーム'),
     ('AI事業創出チーム'),
     ('事務局');
