# Singularity Lab Portal - Claude Code Instructions

## プロジェクト概要

Singularity Labメンバー向けの会員制ポータルサイト。Google認証による承認制メンバーシップで、ドキュメントや動画コンテンツへのアクセスを管理。

## 技術スタック

- **Framework**: Next.js 15 (App Router), TypeScript
- **Styling**: Tailwind CSS, Mantine UI
- **Auth/DB**: Supabase (PostgreSQL, Google OAuth)
- **Hosting**: Vercel
- **Icons**: Lucide React

## ドキュメント参照先

### コーディング規約・開発フロー（GitHub Wiki）

- [コーディング規約](https://github.com/Singuralitylabs/portal-site/wiki/コーディング規約)
- [開発フロー](https://github.com/Singuralitylabs/portal-site/wiki/ポータルサイト開発フロー)

### 設計ドキュメント（docs/）

| ファイル                    | 内容             |
| --------------------------- | ---------------- |
| `docs/specification.md`     | 機能仕様         |
| `docs/database.md`          | データベース設計 |
| `docs/api-specification.md` | API仕様          |
| `docs/setup.md`             | 環境構築手順     |
| `docs/testing.md`           | テスト方針       |

### 型定義

- `app/types/lib/database.types.ts` - Supabase自動生成型

## 開発コマンド

```bash
npm run dev      # 開発サーバー（Turbopack）
npm run build    # 本番ビルド
npm run lint     # ESLint
npm run db:types # Supabase型生成
```

## ディレクトリ構造

```
├── app/                # Next.js App Router
│   ├── (authenticated)/  # 認証必須ページ（各ページは page.tsx + components/ で構成）
│   ├── (auth)/           # 認証ページ（ログイン等）
│   ├── components/       # アプリ全体の共通コンポーネント
│   ├── constants/        # 定数定義
│   ├── hooks/            # カスタムフック
│   ├── services/
│   │   ├── api/          # データアクセス層（xxx-server.ts / xxx-client.ts）
│   │   └── auth/         # 認証関連
│   └── types/            # 型定義（index.ts に集約、lib/ に自動生成型）
├── docs/               # 設計ドキュメント
├── public/             # 静的ファイル
├── supabase/
│   └── migrations/     # DBマイグレーションファイル
├── tests/              # テストファイル
└── middleware.ts        # Next.js ミドルウェア（認証ガード等）
```

## コーディングルール

命名規約・コンポーネント基本構造・型定義方針・Git運用・マイグレーション手順は [GitHub Wiki コーディング規約](https://github.com/Singuralitylabs/portal-site/wiki/コーディング規約) に従うこと。

以下はWikiを補足する、本プロジェクト固有の実装パターン。

### コンポーネント設計パターン

- Server Component がデフォルト。Client Component は `"use client"` を明示的に宣言
- `page.tsx` はデータ取得のみ。表示ロジックは同階層の `components/Template.tsx` に委譲（参考: `app/(authenticated)/documents/page.tsx`）
- 並列取得が可能なデータは `Promise.all` を使用

### 型定義パターン

- `database.types.ts` は Supabase 自動生成（手動編集禁止、`npm run db:types` で更新）
- アプリケーション型は `app/types/index.ts` に集約
- `Database["public"]["Tables"]["xxx"]["Row"]` から `Omit` で派生型を作成（参考: `app/types/index.ts`）

### UIコンポーネント規約

- レイアウト・構造: Mantine UI コンポーネント（Card, Flex, Stack, Group 等）
- ユーティリティスタイル: Tailwind CSS（spacing, color, responsive等）
- アイコン: Lucide React

### データアクセス

- サーバーサイド: `createServerSupabaseClient()`（`services/api/supabase-server.ts`）
- クライアントサイド: `createClientSupabaseClient()`（`services/api/supabase-client.ts`）

## 実装後の確認

コード変更を行った後、以下のチェックを順番に実行し、すべて通ることを確認する。エラーがあれば修正してから完了とする。

1. `npm run lint` - ESLintチェック
2. `npx tsc --noEmit` - 型チェック
3. `npm run build` - ビルドチェック

## 禁止事項

- `console.log` / `console.info` はデバッグ目的で一時的に使用可。ただしコミット前に必ず削除する（CIで検出・ブロックされる）
- `debugger` の使用禁止
- `database.types.ts` の手動編集禁止
- `.env.local` の内容をコードにハードコードしない
