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
app/
├── (authenticated)/  # 認証必須ページ
├── (auth)/           # 認証ページ
├── components/       # 共通コンポーネント
├── services/         # API・ビジネスロジック
└── types/            # 型定義
```
