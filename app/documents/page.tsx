import { DocumentCard } from './components/DocumentCard';
import { createClient } from '@supabase/supabase-js';
import { Grid, Paper, Title } from '@mantine/core';

// Supabaseクライアントの作成
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// サーバーコンポーネント
export default async function DocumentsPage() {
  // Supabaseからデータ取得
  const { data: documents, error } = await supabase.from('documents').select('*');

  if (error) {
    console.error('データ取得エラー:', error.message);
    return <p>データを取得できませんでした。</p>;
  }

  return (
    <Paper m="0 2rem">
      <Title order={1} p="1.25rem 0" style={{borderBottom: '1px solid #888'}}>資料一覧</Title>

      <Paper>
        <Title order={2} p="1rem 0">学習資料</Title>
        <Grid>
          {documents.map((document) => (
            <Grid.Col span={{ base: 12, md: 6, lg: 4 }} key={document.id + '_grid'}>
              <DocumentCard key={document.id + '_DocumentCard'} document={document} />
            </Grid.Col>
          ))}
        </Grid>
      </Paper>
    </Paper>
  );
}