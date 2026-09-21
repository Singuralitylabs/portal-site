-- 会員一覧の役職者セクション（代表・副代表・シンラボ管理人）用データ追加
-- id 8, 9, 10 はアプリケーションコードで参照する予約済みID（docs/database.md §2.6 参照）
-- 2026/09/22 追記： docs/database.mdからは相談の結果、記載除外済み。マイグレーション刷新の予定もあり、随時更新予定
INSERT INTO positions (id, name, display_order, is_deleted)
VALUES
  (8,  '代表',           8,  FALSE),
  (9,  '副代表',         9,  FALSE),
  (10, 'シンラボ管理人', 10, FALSE);
