import { fetchDocuments } from '@/app/services/api/documents';
import { fetchCategoriesByType } from '@/app/services/api/categories';
import { DocumentsPageTemplate } from './components/Template';
import { createServerSupabaseClient } from '@/app/services/api/supabase-server';

export default async function DocumentsPage() {
  const { data, error } = await fetchDocuments();
  const { data: dataCategory, error: errorCategory } = await fetchCategoriesByType("documents");

  // サーバーサイドでcurrentUserを取得
  const supabase = await createServerSupabaseClient();
  const { data: authUser } = await supabase.auth.getUser();

  let currentUser;
  if (authUser?.user) {
    // 独自のユーザーテーブルから情報を取得
    const { data: userProfile } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', authUser.user.id)
      .single();
    currentUser = userProfile;
  } else {
    currentUser = undefined;
  }

  if (error || errorCategory) {
    return <p>データを取得できませんでした。</p>;
  }

  return (
    <DocumentsPageTemplate
      documents={data}
      categories={dataCategory}
      currentUser={currentUser}
    //onEdit={(document) => console.log('Edit document:', document)} // 編集機能はまだ実装していない
    //onDelete={handleDelete} // 削除機能を渡す
    />
  );
}
