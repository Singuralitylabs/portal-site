-- usersテーブルに誤って作成されたDELETEポリシーの削除（スキーマドリフト解消）
--
-- 開発用プロジェクトの public.users に、マイグレーションファイルに定義のない
-- DELETEポリシーが2本存在していた。名称から、本来 documents / videos に対して
-- 実行すべきSQLを、SQLエディタでテーブルを取り違えて users に適用したものと判断する。
--
--   - prevent_physical_delete_documents（正: 04_policies/documents/00_documents_policies.sql）
--   - prevent_physical_delete_videos  （正: 04_policies/videos/00_videos_policies.sql）
--
-- いずれも USING (false) であり、users 本来の prevent_physical_delete と条件が同一のため、
-- 削除しても物理削除禁止の挙動は変わらない（DELETEポリシーはPERMISSIVEでORされるため、
-- false を3本から1本に減らしても結果は false のまま）。
--
-- documents / videos 側の同名ポリシーは各テーブルに正しく存在しており、
-- 以下の DROP は ON "users" を対象とするため影響しない。

DROP POLICY IF EXISTS "prevent_physical_delete_documents" ON "users";
DROP POLICY IF EXISTS "prevent_physical_delete_videos" ON "users";

-- 実行後、users のDELETEポリシーは prevent_physical_delete の1本のみとなる
-- （定義は 00_users_policies.sql を参照。本ファイルでは再作成しない）。
