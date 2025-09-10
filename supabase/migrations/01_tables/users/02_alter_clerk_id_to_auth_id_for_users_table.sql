-- usersテーブルのclerk_idカラムをauth_idに変更
  ALTER TABLE users
    RENAME COLUMN clerk_id TO auth_id;

  -- auth_idカラムのデータ型をUUIDに変更
  ALTER TABLE users
    ALTER COLUMN auth_id TYPE UUID USING auth_id::UUID;

  -- auth_idカラムに外部キー制約を追加
  ALTER TABLE users
    ADD CONSTRAINT fk_users_auth_id
    FOREIGN KEY (auth_id) REFERENCES auth.users(id);