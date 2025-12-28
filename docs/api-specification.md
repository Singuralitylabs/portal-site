# API仕様書

## 目次

1. [概要](#1-概要)
2. [GoogleカレンダーAPI](#2-googleカレンダーapi)
3. [Slack通知API](#3-slack通知api)

## 1. 概要

本ドキュメントでは、シンラボポータルサイトで提供されるAPIの仕様を記載します。

### 1.1 APIの種類

- GoogleカレンダーAPI: Googleカレンダーからイベント情報を取得
- Slack通知API: シンラボSlackへの通知送信

---

## 2. GoogleカレンダーAPI

### 2.1 概要

Google Calendar APIを使用して複数のGoogleカレンダーからイベント情報を取得する機能を提供します。

#### 主な機能

- 複数のGoogleカレンダーからイベントを一括取得
- 指定期間のイベントを取得（クエリパラメータで指定可能）
- サービスアカウント認証による安全なアクセス
- 終日イベントと時刻指定イベントの両方に対応
- カレンダーIDごとの色分け表示

#### 取得対象カレンダー

以下のカレンダーからイベントを取得します（環境変数で設定可能）

- シンラボMTGカレンダー
- シンラボイベントカレンダー
- 日本の祝日カレンダー
- その他、環境変数で指定されたカレンダー

### 2.2 認証方法

#### サービスアカウント認証

Google Calendar APIへのアクセスには、Googleサービスアカウントを使用します。

**必要なスコープ**:

```
https://www.googleapis.com/auth/calendar.readonly
```

**認証情報の取得方法**:

1. **開発環境**: `google-service-account.json` ファイルをプロジェクトルートに配置
2. **本番環境**: `GOOGLE_SERVICE_ACCOUNT_KEY` 環境変数にJSON文字列を設定

#### カレンダー共有設定

サービスアカウントのメールアドレスを各Googleカレンダーの「特定のユーザーと共有」に追加し、「予定の表示」以上の権限を付与する必要があります。

### 2.3 APIエンドポイント

#### イベント取得API

**エンドポイント**: `GET /api/calendar/events`

**説明**: 複数のGoogleカレンダーからイベントを取得します。

**認証**: 不要（サーバーサイドでサービスアカウント認証を実行）

**クエリパラメータ**:

| パラメータ名 | 型                | 必須 | 説明                                            |
| ------------ | ----------------- | ---- | ----------------------------------------------- |
| `start`      | string (ISO 8601) | 任意 | 取得開始日時（デフォルト: 現在時刻）            |
| `end`        | string (ISO 8601) | 任意 | 取得終了日時（デフォルト: 現在時刻から1ヶ月後） |

**例**:

```
GET /api/calendar/events?start=2024-01-01T00:00:00Z&end=2024-01-31T23:59:59Z
```

**レスポンス**: JSON形式

### 2.4 データ型定義

#### CalendarEvent

Googleカレンダーイベントの型定義

```typescript
interface CalendarEvent {
  id: string; // イベントID
  summary: string; // イベントタイトル
  description?: string; // イベント説明（オプション）
  start?: {
    dateTime?: string; // 開始日時（ISO 8601形式、時刻指定イベント）
    date?: string; // 開始日（YYYY-MM-DD形式、終日イベント）
  };
  end?: {
    dateTime?: string; // 終了日時（ISO 8601形式、時刻指定イベント）
    date?: string; // 終了日（YYYY-MM-DD形式、終日イベント）
  };
  location?: string; // 場所（オプション）
  htmlLink?: string; // Googleカレンダーへのリンク（オプション）
  calendarId?: string; // カレンダーエイリアス（色分けに使用、実際のIDではなくエイリアス名）
}
```

#### FetchCalendarEventsResult

サーバーサイド関数の戻り値型：

```typescript
interface FetchCalendarEventsResult {
  data: CalendarEvent[] | null; // イベント配列（エラー時はnull）
  error: string | null; // エラーメッセージ（成功時はnull）
}
```

### 2.5 レスポンス形式

#### 成功時のレスポンス

**ステータスコード**: `200 OK`

**レスポンスボディ**:

```json
{
  "success": true,
  "events": [
    {
      "id": "event_id_123",
      "summary": "イベントタイトル",
      "description": "イベントの説明",
      "start": {
        "dateTime": "2024-01-15T10:00:00+09:00"
      },
      "end": {
        "dateTime": "2024-01-15T12:00:00+09:00"
      },
      "location": "会議室A",
      "htmlLink": "https://www.google.com/calendar/event?eid=...",
      "calendarId": "singularity-mtg"
    }
  ]
}
```

#### 終日イベントの例

```json
{
  "id": "event_id_456",
  "summary": "終日イベント",
  "start": {
    "date": "2024-01-20"
  },
  "end": {
    "date": "2024-01-21"
  },
  "calendarId": "holiday"
}
```

#### エラー時のレスポンス

**ステータスコード**: `500 Internal Server Error`

**レスポンスボディ**:

```json
{
  "success": false,
  "error": "カレンダーイベントの取得に失敗しました",
  "details": "エラーの詳細メッセージ"
}
```

### 2.6 エラーハンドリング

#### エラーの種類

1. **認証エラー**: サービスアカウントキーが無効または設定されていない
2. **権限エラー**: サービスアカウントにカレンダーへのアクセス権限がない
3. **APIエラー**: Google Calendar APIへの接続に失敗
4. **個別カレンダーエラー**: 特定のカレンダーでエラーが発生（他のカレンダーは正常に取得）

#### エラー処理の動作

- 個別のカレンダーでエラーが発生した場合、そのカレンダーはスキップされ、他のカレンダーからは正常にイベントを取得します
- すべてのカレンダーでエラーが発生した場合、空の配列を返します
- 認証エラーやAPI初期化エラーの場合、エラーレスポンスを返します

### 2.7 環境変数設定

#### 必須環境変数

##### GOOGLE_SERVICE_ACCOUNT_KEY（本番環境）

サービスアカウントキーのJSON文字列（1行形式）

```bash
GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"...",...}'
```

##### GOOGLE_CALENDAR_IDS

取得対象のカレンダーをエイリアスとIDのペアで指定（カンマ区切り）

**フォーマット**: `alias1:calendarId1,alias2:calendarId2`

**注意事項**:

- `#`記号はURLエンコード（`%23`）して記述
- エイリアス名は `app/constants/calendar.ts` の `CALENDAR_COLORS` で色を定義する際に使用

```bash
GOOGLE_CALENDAR_IDS="singularity-mtg:calendar_id_1,holiday:ja.japanese%23holiday@group.v.calendar.google.com"
```

環境変数が設定されていない場合、デフォルトのカレンダー（日本の祝日）が使用されます。

#### 取得期間の制限

- **デフォルト開始**: 現在時刻
- **デフォルト終了**: 現在時刻から前後3ヶ月
- **最大件数**: カレンダーごとに1000件（`maxResults`パラメータ）
- **クエリパラメータ**: `start`と`end`で取得期間をカスタマイズ可能

#### イベントの表示形式

- **色分け**: カレンダーエイリアスごとに異なる色で表示（TailwindCSSカラーパレット使用）
  - シンラボMTGカレンダー（`singularity-mtg`）: 紫色（`green-300` / `green-400`）
  - 日本の祝日カレンダー（`holiday`）: 赤色（`red-300` / `red-400`）
  - その他のカレンダー: 青色（`blue-300` / `blue-400`）
- **日付フォーマット**: 日本のロケール形式

## 3. Slack通知API

### 3.1 概要

新規ユーザー登録時にSlackへ通知を送信するAPIです。

#### 主な機能

- 新規ユーザー登録時のSlack通知送信
- Slack Webhook URLを使用した通知
- 環境変数未設定時の自動スキップ

### 3.2 APIエンドポイント

#### 通知送信API

**エンドポイント**: `POST /api/notifications/slack`

**説明**: 新規ユーザー登録時にSlackへ通知を送信します。

**認証**: 不要（サーバーサイドで実行）

**リクエストボディ**:

```json
{
  "displayName": "ユーザー名"
}
```

**レスポンス**: JSON形式

### 3.3 レスポンス形式

#### 成功時のレスポンス

**ステータスコード**: `200 OK`

**レスポンスボディ**:

```json
{
  "success": true
}
```

#### 環境変数未設定時のレスポンス

**ステータスコード**: `200 OK`

**レスポンスボディ**:

```json
{
  "success": true,
  "message": "環境変数未設定のためスキップ"
}
```

#### エラー時のレスポンス

**ステータスコード**: `500 Internal Server Error`

**レスポンスボディ**:

```json
{
  "success": false,
  "error": "エラーメッセージ"
}
```

### 3.4 環境変数設定

#### SLACK_WEBHOOK_URL（オプション）

Slack Webhook URLを設定します。未設定の場合は通知をスキップします。

```bash
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
```

### 3.5 使用例

```typescript
// サーバーサイドから呼び出す
const response = await fetch("/api/notifications/slack", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    displayName: "山田太郎",
  }),
});

const data = await response.json();

if (data.success) {
  console.log("通知送信成功");
} else {
  console.error("通知送信エラー:", data.error);
}
```
