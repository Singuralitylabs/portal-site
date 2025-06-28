# デザイン

## lucide-react

https://lucide.dev/icons/

# Clerkからの移行による改善点

## アーキテクチャの簡素化

**移行前（Clerk）:**

- Clerk認証 → Webhook → Supabase同期 → RLSポリシー（`get_clerk_user_id()`）

**移行後（Supabase Auth）:**

- Supabase Auth → 直接RLSポリシー（`auth.uid()`）

## パフォーマンス向上

- **外部API呼び出し削除**: ClerkのAPI呼び出しが不要
- **Webhook処理削除**: 非同期同期処理のオーバーヘッドが削除
- **統合データアクセス**: 認証とデータが同一データベース内で処理

## 開発・運用効率

- **管理画面統一**: Supabaseダッシュボードで認証・データ両方を管理
- **デバッグ簡素化**: 全ての処理がSupabase内で完結
- **コスト削減**: Clerkの有料プラン不要
