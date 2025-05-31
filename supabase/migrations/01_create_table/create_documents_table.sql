-- documentsテーブルの作成
CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    url TEXT NOT NULL,
    created_by INTEGER NOT NULL REFERENCES users(id),
    updated_by INTEGER NOT NULL REFERENCES users(id),
    assignee VARCHAR(100),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
