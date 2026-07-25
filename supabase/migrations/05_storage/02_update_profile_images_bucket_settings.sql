-- profile-images バケットの許可 MIME を image/jpeg・image/png・image/gif に統一（image/jpg を除去）
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-images',
  'profile-images',
  false,
  1048576,
  ARRAY['image/jpeg', 'image/png', 'image/gif']
) ON CONFLICT (id) DO UPDATE SET
  public             = EXCLUDED.public,
  file_size_limit    = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;
