-- profile-images バケットの作成（非公開、最大1MB、jpg/jpeg/png/gifのみ）
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-images',
  'profile-images',
  false,
  1048576,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- active な認証済みユーザーは全ファイルを閲覧可能
DROP POLICY IF EXISTS "Authenticated users can view profile images" ON storage.objects;
CREATE POLICY "Authenticated users can view profile images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'profile-images'
  AND EXISTS (
    SELECT 1
    FROM public.users
    WHERE users.auth_id = auth.uid()
      AND users.status = 'active'
      AND users.is_deleted = false
  )
);

-- active なユーザーは自身の auth_id フォルダにのみアップロード可能
DROP POLICY IF EXISTS "Users can upload their own profile image" ON storage.objects;
CREATE POLICY "Users can upload their own profile image"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND EXISTS (
    SELECT 1
    FROM public.users
    WHERE users.auth_id = auth.uid()
      AND users.status = 'active'
      AND users.is_deleted = false
  )
);

-- active なユーザーは自身の auth_id フォルダのファイルのみ更新可能
DROP POLICY IF EXISTS "Users can update their own profile image" ON storage.objects;
CREATE POLICY "Users can update their own profile image"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND EXISTS (
    SELECT 1
    FROM public.users
    WHERE users.auth_id = auth.uid()
      AND users.status = 'active'
      AND users.is_deleted = false
  )
)
WITH CHECK (
  bucket_id = 'profile-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND EXISTS (
    SELECT 1
    FROM public.users
    WHERE users.auth_id = auth.uid()
      AND users.status = 'active'
      AND users.is_deleted = false
  )
);

-- active なユーザーは自身の auth_id フォルダのファイルのみ削除可能
DROP POLICY IF EXISTS "Users can delete their own profile image" ON storage.objects;
CREATE POLICY "Users can delete their own profile image"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND EXISTS (
    SELECT 1
    FROM public.users
    WHERE users.auth_id = auth.uid()
      AND users.status = 'active'
      AND users.is_deleted = false
  )
);
