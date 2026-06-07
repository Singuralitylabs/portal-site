-- profile-images の既存ポリシーをすべて削除（重複・条件不備を解消）
DROP POLICY IF EXISTS "Authenticated users can view profile images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view profile images vejz8c_0" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own profile image" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own profile image vejz8c_0" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile image" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile image vejz8c_0" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile image vejz8c_1" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile image" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile image vejz8c_0" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile image vejz8c_1" ON storage.objects;

-- SELECT: active ユーザーのみ全プロフィール画像を閲覧可能
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

-- INSERT: active ユーザーは自身の auth_id フォルダにのみアップロード可能
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

-- UPDATE: active ユーザーは自身の auth_id フォルダのファイルのみ更新可能
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

-- DELETE: active ユーザーは自身の auth_id フォルダのファイルのみ削除可能
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
