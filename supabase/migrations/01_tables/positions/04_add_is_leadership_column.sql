-- 会員一覧の役職者セクション表示対象を、IDのハードコードではなく専用フラグで判定できるようにする
-- （Issue #434 問題点2: 役職ID(8,9,10)のハードコード解消）
ALTER TABLE positions
ADD COLUMN IF NOT EXISTS is_leadership BOOLEAN NOT NULL DEFAULT FALSE;

-- 既存の役職者（代表・副代表・シンラボ管理人）にフラグを設定
UPDATE positions
   SET is_leadership = TRUE
 WHERE id IN (8, 9, 10);
