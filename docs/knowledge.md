# デザイン

## lucide-react

https://lucide.dev/icons/

## レイアウト

### ナビゲーションバーの領域調整

**問題**: サイドバーの幅（`w-64` = 256px）とメインコンテンツの左マージン（`sm:ml-48` = 192px）が一致しておらず、64pxの重複が発生

**影響**:

- カテゴリリンクの左端がクリックできない
- ナビバーのボタン領域外（右側の空白部分）をクリックしても意図しないページ遷移が発生

**解決策**: `app/(authenticated)/layout.tsx`でメインコンテンツの左マージンを`sm:ml-48`から`sm:ml-64`に変更し、サイドバー幅と一致させる

```tsx
// 修正前
<div className="flex-1 sm:ml-48">{children}</div>

// 修正後
<div className="flex-1 sm:ml-64">{children}</div>
```

**結果**: ナビバーのクリック可能領域とビジュアルが一致し、コンテンツ領域の重複を解消

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
