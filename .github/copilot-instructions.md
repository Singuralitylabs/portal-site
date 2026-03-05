# GitHub Copilot Instructions

このファイルは、Singularity Lab Portal（`portal-site`）で GitHub Copilot を利用する際の共通指示です。

## プロジェクト前提

- Framework: Next.js 15（App Router）+ TypeScript
- UI: Mantine UI + Tailwind CSS
- Auth/DB: Supabase（Google OAuth / PostgreSQL）
- 主要参照:
  - `docs/specification.md`
  - `docs/database.md`
  - `docs/api-specification.md`
  - `docs/testing.md`
  - GitHub Wiki のコーディング規約・開発フロー

## 実装ルール

- Server Component をデフォルトにし、Client Component は `"use client"` を明示する
- `page.tsx` はデータ取得中心、表示ロジックは同階層 `components/Template.tsx` に分離する
- 並列取得可能な処理は `Promise.all` を使う
- DB型は `app/types/lib/database.types.ts` を直接編集しない（`npm run db:types` で生成）
- アプリケーション型は `app/types/index.ts` に集約する
- データアクセスは既存の Supabase クライアント層を使う
  - server: `app/services/api/supabase-server.ts`
  - client: `app/services/api/supabase-client.ts`

## 変更スコープの原則

- 要求範囲に対して最小差分で変更する
- 無関係なリファクタリングや命名変更を混ぜない
- 新規ライブラリ導入は必要性・影響範囲を明示する
- 秘密情報（`.env.local` 等）をコードやログに出さない
- `console.log` / `console.info` / `debugger` を最終成果物に残さない

## レビュー観点（Issue #311 対応）

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

## 実装後チェック（必須）

変更後は以下を順に実行し、すべて成功させる。

1. `npm run lint`
2. `npm run type-check`
3. `npm run build`

---

## 完全準拠版（追記）: コーディング規約

以下は GitHub Wiki「コーディング規約」の運用内容を Copilot 指示として明文化したもの。

### 1. 基本方針

- 読みやすさを優先し、初心者にも理解しやすい実装を行う
- 要件に対して過不足のない最小実装を行う

### 2. ファイル命名

- コンポーネントファイルは `PascalCase.tsx`
- それ以外のファイルは `kebab-case.ts` / `kebab-case.tsx`

### 3. Supabase サービスファイル命名

- サーバーサイドは `xxx-server.ts`
- クライアントサイドは `xxx-client.ts`
- `app/services/api/` 配下で server/client を分離する

### 4. コンポーネント規約

- 1コンポーネント1責務を原則とする
- 長大コンポーネント（目安200行以上）は分割を検討する
- props は分割代入で受け取り、引数に明示的な型を付与する
- ページは `page.tsx`（データ取得）と `components/Template.tsx`（表示ロジック）を分離する
- Server Component がデフォルト。Client Component は `"use client"` を宣言する

### 5. UI ライブラリの使い分け

- レイアウト・構造: Mantine UI
- 細かなスタイル調整: Tailwind CSS
- アイコン: Lucide React
- Mantine と Tailwind は併用可（`className` 利用可）

### 6. TypeScript 型定義

- 原則 `interface` を優先し、型名は `PascalCase`
- `any` の使用は極力避ける
- Supabase 生成型は手動編集禁止（`npm run db:types`）
- 自動生成型からの派生は `Omit` / `Pick` 等を利用する
- アプリケーション型は `app/types/index.ts` に集約する

### 7. エラーハンドリング

- 適切に `try/catch` で捕捉する
- エラー出力は `console.error()` を利用する
- `console.log` / `console.info` は一時利用のみ。コミット前に削除する

### 8. Git 運用

- ブランチは機能単位で作成する
- ブランチ命名は `feature/` `bug/` `refactor/` `env/` `docs/` の prefix を使用する
- コミットメッセージと PR 説明は日本語で記載する
- PR はレビューを受けてからマージする
- 既存 Issue で PR を作る場合、Project への手動紐付けはしない
- レビュー依頼時は Slack で Reviewer メンションを行う

### 9. マイグレーション

- DB更新は原則 SQL で実施し、`supabase/migrations` に保存する
- SQL ファイルは実行順を意識したナンバリング命名にする
- DB構成変更時はチーム告知・確認手順を経て反映する

### 10. Copilot レビュー時の必須確認

- 命名規約違反（PascalCase / kebab-case / server-client suffix）がないか
- `page.tsx` の責務逸脱（表示ロジック混在）がないか
- `database.types.ts` の手編集がないか
- `any` の過剰使用や unsafe な型変換がないか
- エラーハンドリング不足や `console.log` 残存がないか
- ブランチ名・PR内容が運用ルールに一致しているか
- 設計書の要件・制約・データモデルと実装差分が矛盾していないか
- 近接機能の既存実装パターンから逸脱していないか（逸脱時は理由を明記しているか）
