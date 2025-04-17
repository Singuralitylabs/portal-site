import { createServerSupabaseClient } from "./supabase";
import { VideoType } from "@/app/types";

// ダミービデオデータ
const dummyVideos: VideoType[] = [
  {
    id: 0,
    name: '削除済み動画',
    description: 'この動画は削除済みのため表示されません',
    category: 'テスト',
    url: 'https://www.youtube.com/watch?v=deleted',
    thumbnail: 'https://picsum.photos/200/300',
    length: 1800,
    created_by: 1,
    updated_by: 1,
    assignee: 'テストユーザー',
    is_deleted: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 1,
    name: 'JavaScript基礎講座',
    description: 'JavaScriptの基本的な概念と構文について学びます。変数、データ型、関数、オブジェクト指向プログラミングなどをカバーします。',
    category: 'プログラミング学習',
    url: 'https://www.youtube.com/watch?v=dummyid1',
    thumbnail: 'https://picsum.photos/200/300',
    length: 3600,
    created_by: 1,
    updated_by: 1,
    assignee: '山田太郎',
    is_deleted: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 2,
    name: 'React入門',
    description: 'Reactの基本的な使い方とコンポーネント設計について解説します。Hooksの使い方やステート管理についても学べます。',
    category: 'プログラミング学習',
    url: 'https://www.youtube.com/watch?v=dummyid2',
    thumbnail: 'https://picsum.photos/200/300',
    length: 4500,
    created_by: 1,
    updated_by: 1,
    assignee: '佐藤次郎',
    is_deleted: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 3,
    name: 'TypeScript実践講座',
    description: 'TypeScriptの型システムを活用した実践的なコーディング手法を学びます。インターフェース、ジェネリクス、型推論などの高度な機能も解説します。',
    category: 'プログラミング学習',
    url: 'https://www.youtube.com/watch?v=dummyid3',
    thumbnail: 'https://picsum.photos/200/300',
    length: 5400,
    created_by: 1,
    updated_by: 1,
    assignee: '鈴木花子',
    is_deleted: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 4,
    name: 'Next.js開発入門',
    description: 'Next.jsを使ったウェブアプリケーション開発の基礎を学びます。ルーティング、SSR、SSG、APIルートなどの機能について解説します。',
    category: 'プログラミング学習',
    url: 'https://www.youtube.com/watch?v=dummyid4',
    thumbnail: 'https://picsum.photos/200/300',
    length: 3900,
    created_by: 1,
    updated_by: 1,
    assignee: '高橋健太',
    is_deleted: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 5,
    name: 'GAS入門講座',
    description: 'Google Apps Script(GAS)の基本的な使い方と活用方法について解説します。Googleスプレッドシートとの連携方法も学べます。',
    category: 'GAS講座',
    url: 'https://www.youtube.com/watch?v=dummyid5',
    thumbnail: 'https://picsum.photos/200/300',
    length: 2700,
    created_by: 1,
    updated_by: 1,
    assignee: '田中誠',
    is_deleted: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 6,
    name: 'GASでスプレッドシート自動化',
    description: 'Google Apps Scriptを使ってスプレッドシートの操作を自動化する方法を解説します。実践的なサンプルコードも提供します。',
    category: 'GAS講座',
    url: 'https://www.youtube.com/watch?v=dummyid6',
    thumbnail: 'https://picsum.photos/200/300',
    length: 3300,
    created_by: 1,
    updated_by: 1,
    assignee: '田中誠',
    is_deleted: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 7,
    name: 'Node.js実践講座',
    description: 'Node.jsを使ったサーバーサイド開発の基礎と実践について学びます。Express.jsフレームワークの使い方も解説します。',
    category: 'プログラミング学習',
    url: 'https://www.youtube.com/watch?v=dummyid7',
    thumbnail: 'https://picsum.photos/200/300',
    length: 4800,
    created_by: 1,
    updated_by: 1,
    assignee: '伊藤洋子',
    is_deleted: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 8,
    name: 'データベース設計入門',
    description: 'リレーショナルデータベースの設計原則とベストプラクティスについて解説します。正規化、インデックス、パフォーマンスチューニングなどをカバーします。',
    category: 'プログラミング学習',
    url: 'https://www.youtube.com/watch?v=dummyid8',
    thumbnail: 'https://picsum.photos/200/300',
    length: 4200,
    created_by: 1,
    updated_by: 1,
    assignee: '中村和夫',
    is_deleted: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 9,
    name: 'GASでGmailの自動処理',
    description: 'Google Apps ScriptでGmailを操作し、メールの自動振り分けや返信の自動化などを実装する方法を解説します。',
    category: 'GAS講座',
    url: 'https://www.youtube.com/watch?v=dummyid9',
    thumbnail: 'https://picsum.photos/200/300',
    length: 3000,
    created_by: 1,
    updated_by: 1,
    assignee: '田中誠',
    is_deleted: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 10,
    name: 'Webセキュリティ基礎',
    description: 'Webアプリケーションにおけるセキュリティリスクと対策について解説します。XSS、CSRF、SQLインジェクションなどの脆弱性対策を学びます。',
    category: 'プログラミング学習',
    url: 'https://www.youtube.com/watch?v=dummyid10',
    thumbnail: 'https://picsum.photos/200/300',
    length: 3600,
    created_by: 1,
    updated_by: 1,
    assignee: '小林守',
    is_deleted: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export async function fetchVideos() {
  // 本来はSupabaseからデータを取得するが、ダミーデータを返す
  // const supabase = await createServerSupabaseClient();
  // const { data, error } = await supabase
  //   .from("videos")
  //   .select("*")
  //   .eq("is_deleted", false);
  //
  // if (error) {
  //   console.error("Supabase 動画一覧データ取得エラー:", error.message);
  //   return { data: null, error };
  // }

  // ダミーデータを返す（is_deleted=falseのみ）
  const filteredVideos = dummyVideos.filter(video => !video.is_deleted);
  return { data: filteredVideos, error: null };
}
