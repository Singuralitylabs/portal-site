-- 02_insert_leadership_positions.sql で id を明示指定して INSERT したため、
-- positions_id_seq が実データ（最大id=10）に追従しておらず、次の自動採番insertが
-- 既存の予約済みID（8, 9, 10）と重複しうる状態になっている。
-- シーケンスの現在値を実データの最大idに同期させる。
SELECT setval('positions_id_seq', (SELECT MAX(id) FROM positions));
