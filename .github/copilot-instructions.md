# GitHub Copilot Instructions

このファイルは、Singularity Lab Portal（`portal-site`）で GitHub Copilot / Agent を利用する際の共通指示です。

## プロジェクト前提

- Framework: Next.js 15（App Router）+ TypeScript
- UI: Mantine UI + Tailwind CSS
- Auth/DB: Supabase（Google OAuth / PostgreSQL）
- 主要参照:
  - `docs/specification.md`
  - `docs/database.md`
  - `docs/api-specification.md`
  - `docs/testing.md`
  - GitHub Wiki のコーディング規約
  - GitHub Wiki のポータルサイト開発フロー

## 運用方針

- GitHub Wiki を正本（single source of truth）として扱う
- 本ファイルは Copilot / Agent の実行品質に直結する指示を定義する

## Wiki参照と二重管理の方針

- GitHub Copilot / Agent は Wiki を常に自動参照できるとは限らない
- コードレビュー・コード編集で必須となるルールは、本ファイルに要約して転記する
- Wiki と本ファイルで差分が出た場合は Wiki を優先し、差分解消として本ファイルを更新する

## Agent の役割分担

### 1) Planner Agent（要件分解）

- 入力: Issue本文、関連ドキュメント、既存実装
- 出力: 作業項目、変更対象ファイル、受け入れ条件
- ルール: 仕様外の提案は「別提案」として分離する

### 2) Builder Agent（実装）

- 入力: Planner Agent の作業項目
- 出力: 最小差分のコード変更
- ルール:
  - 不要なファイル移動・命名変更を行わない
  - 自動生成物（`database.types.ts`）を手編集しない

### 3) Reviewer Agent（検証・指摘）

- 入力: 差分、受け入れ条件、実行結果
- 出力: P0〜P3で分類したレビュー
- ルール:
  - P0/P1 を先に記載する
  - 指摘は根拠・影響・修正案をセットで示す
  - 軽微な提案はノンブロッカーとして分離する

## Agent実行で必須のコーディング規約（要約）

- Server Component をデフォルトとし、Client Component は `"use client"` を明示する
- `page.tsx` はデータ取得中心、表示ロジックは同階層 `components/Template.tsx` に分離する
- Supabase 自動生成型 `app/types/lib/database.types.ts` は手動編集しない
- Supabase クライアント生成は `app/services/api/supabase-server.ts` / `app/services/api/supabase-client.ts` に統一し、ページ/コンポーネントからのデータ取得・更新は `app/services/api` 配下の各 `xxx-server.ts` / `xxx-client.ts` の関数経由で行う
- 命名規約はコンポーネント `PascalCase.tsx`、その他は `kebab-case.ts(x)` を守る
- `console.log` / `console.info` / `debugger` を最終成果物に残さない

## Agent実行で必須の開発フロー（要約）

- Issue / PR の目的・完了条件・非対象を明文化してから着手する
- 要求範囲に対して最小差分で実装し、無関係な変更を混ぜない
- 変更後は `npm run lint` → `npm run type-check` → `npm run build` を順に実行する

## レビュー観点

Copilot レビューは次の優先順位で指摘する。

### 優先度

- **P0**: セキュリティ、認可、データ破壊、機密漏洩
- **P1**: 仕様逸脱、重大バグ、運用停止リスク
- **P2**: 保守性・性能・可読性への中程度影響
- **P3**: 任意の改善提案（ノンブロッカー）

### 指摘ルール

- P0/P1 を優先し、まず結論と根拠を短く示す
- 推測ではなく再現条件・対象コード・影響範囲を明示する
- 可能なら修正案を最小差分で提案する
- スタイルのみの指摘は、規約違反時のみ必須化する
- 重要度の低い nit は「参考提案」として分離する
- 既存の設計ドキュメント（`docs/specification.md` / `docs/database.md` / `docs/api-specification.md`）との整合性を必ず確認する
- 既存コードの実装パターン（責務分離・命名・データアクセス層）との整合性を必ず確認する

### レビュー出力テンプレート

- `Severity`: P0 / P1 / P2 / P3
- `Issue`: 何が問題か
- `Impact`: 何に影響するか
- `Suggested Fix`: 最小修正案

## 実装後チェック

変更後は以下を順に実行し、すべて成功させる。

1. `npm run lint`
2. `npm run type-check`
3. `npm run build`
