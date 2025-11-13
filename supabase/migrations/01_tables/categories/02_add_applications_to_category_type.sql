-- categoriesテーブルのcategory_typeにapplicationsを追加
ALTER TABLE categories
DROP CONSTRAINT IF EXISTS categories_category_type_check;

ALTER TABLE categories
ADD CONSTRAINT categories_category_type_check
CHECK (category_type IN ('documents', 'videos', 'applications'));

-- applicationsカテゴリーの初期データ追加
INSERT INTO categories (category_type, name, description)
VALUES
    ('applications', '未分類', ''),
    ('applications', '業務効率化', 'シンラボ活動を効率化するアプリケーション'),
    ('applications', '学習支援', '学習をサポートするアプリケーション'),
    ('applications', 'データ分析', 'データ分析・可視化ツール'),
    ('applications', 'ゲーム', '娯楽用のゲームアプリ');
