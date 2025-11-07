-- position_tagsテーブルの作成
CREATE TABLE IF NOT EXISTS position_tags (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    position_id INTEGER NOT NULL REFERENCES positions(id),
    display_order INTEGER,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
