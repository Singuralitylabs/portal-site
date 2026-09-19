-- Issue #409: 既存の不整合データを補正するメンテナンスSQL
-- まず確認用SELECTを実行し、結果を確認してからUPDATEを実行する。

-- 対象件数、削除済みカテゴリー、未分類カテゴリーIDを確認する。
SELECT
  deleted_category.category_type,
  deleted_category.id AS deleted_category_id,
  deleted_category.name AS deleted_category_name,
  uncategorized.id AS uncategorized_category_id,
  COUNT(content.content_id) AS affected_content_count
FROM categories AS deleted_category
LEFT JOIN categories AS uncategorized
  ON uncategorized.category_type = deleted_category.category_type
 AND uncategorized.name = '未分類'
 AND uncategorized.is_deleted = FALSE
JOIN (
  SELECT 'documents' AS category_type, id AS content_id, category_id FROM documents
  UNION ALL
  SELECT 'videos' AS category_type, id AS content_id, category_id FROM videos
  UNION ALL
  SELECT 'applications' AS category_type, id AS content_id, category_id FROM applications
) AS content
  ON content.category_type = deleted_category.category_type
 AND content.category_id = deleted_category.id
WHERE deleted_category.is_deleted = TRUE
  AND deleted_category.name <> '未分類'
GROUP BY
  deleted_category.category_type,
  deleted_category.id,
  deleted_category.name,
  uncategorized.id
ORDER BY deleted_category.category_type, deleted_category.id;

-- 以下のUPDATEは、上の確認結果に問題がない場合だけ実行する。
BEGIN;

UPDATE documents AS content
SET category_id = uncategorized.id
FROM categories AS deleted_category
JOIN categories AS uncategorized
  ON uncategorized.category_type = 'documents'
 AND uncategorized.name = '未分類'
 AND uncategorized.is_deleted = FALSE
WHERE deleted_category.category_type = 'documents'
  AND deleted_category.is_deleted = TRUE
  AND deleted_category.name <> '未分類'
  AND content.category_id = deleted_category.id;

UPDATE videos AS content
SET category_id = uncategorized.id
FROM categories AS deleted_category
JOIN categories AS uncategorized
  ON uncategorized.category_type = 'videos'
 AND uncategorized.name = '未分類'
 AND uncategorized.is_deleted = FALSE
WHERE deleted_category.category_type = 'videos'
  AND deleted_category.is_deleted = TRUE
  AND deleted_category.name <> '未分類'
  AND content.category_id = deleted_category.id;

UPDATE applications AS content
SET category_id = uncategorized.id
FROM categories AS deleted_category
JOIN categories AS uncategorized
  ON uncategorized.category_type = 'applications'
 AND uncategorized.name = '未分類'
 AND uncategorized.is_deleted = FALSE
WHERE deleted_category.category_type = 'applications'
  AND deleted_category.is_deleted = TRUE
  AND deleted_category.name <> '未分類'
  AND content.category_id = deleted_category.id;

-- 削除済みカテゴリーに残っているコンテンツがないことを確認する。
SELECT
  deleted_category.category_type,
  deleted_category.id AS deleted_category_id,
  COUNT(content.content_id) AS remaining_content_count
FROM categories AS deleted_category
LEFT JOIN (
  SELECT 'documents' AS category_type, id AS content_id, category_id FROM documents
  UNION ALL
  SELECT 'videos' AS category_type, id AS content_id, category_id FROM videos
  UNION ALL
  SELECT 'applications' AS category_type, id AS content_id, category_id FROM applications
) AS content
  ON content.category_type = deleted_category.category_type
 AND content.category_id = deleted_category.id
WHERE deleted_category.is_deleted = TRUE
  AND deleted_category.name <> '未分類'
GROUP BY deleted_category.category_type, deleted_category.id
HAVING COUNT(content.content_id) > 0
ORDER BY deleted_category.category_type, deleted_category.id;

-- 確認結果が問題なければCOMMITする。取り消す場合はROLLBACKする。
COMMIT;
