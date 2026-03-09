# データベース設計書

## 目次

1. [概要](#1-概要)
2. [テーブル設計](#2-テーブル設計)
3. [ER図](#3-er図)
4. [Row-Level-Security(RLS)ポリシー](#4-row-level-securityrlsポリシー)
5. [サポート関数](#5-サポート関数)
6. [データアクセス制御の実現](#6-データアクセス制御の実現)

## 1. 概要

本プロジェクトでは、バックエンドサービスとしてSupabaseを採用しています。
Supabaseは、PostgreSQLを基盤としたオープンソースのバックエンドサービスです。

本プロジェクトでは以下の5種類のデータを管理します。

1. **ユーザー情報**（`users`テーブル）  
   Supabase Authと連携したユーザー情報を管理します。

2. **ドキュメント情報**（`documents`テーブル）  
   資料やリンクなどのドキュメント情報を管理します。

3. **動画情報**（`videos`テーブル）  
   再生時間やリンクなどの動画情報を管理します。

4. **カテゴリー情報**（`categories`テーブル）  
   ドキュメントや動画情報のカテゴリー種別を管理します。

5. **アプリ情報**（`applications`テーブル）  
   アプリ解説やリンクなどのアプリ情報を管理します。

6. **役職情報** (`positions`テーブル)  
   シンギュラリティ・ラボの役職・所属情報を管理します。

7. **役職タグ情報** (`position_tags`テーブル)  
   ユーザーに役職タグを紐付けます。

## 2. テーブル設計

### 2.1. users テーブル

| カラム名        | データ型       | 制約                                | 説明                                             |
| --------------- | -------------- | ----------------------------------- | ------------------------------------------------ |
| `id`            | `SERIAL`       | PRIMARY KEY                         | レコードの一意な識別子（連番）                   |
| `auth_id`       | `UUID`         | UNIQUE, NOT NULL, FK(auth.users.id) | Supabase Authのユーザー ID                       |
| `email`         | `VARCHAR(255)` | UNIQUE, NOT NULL                    | Googleアカウントのメールアドレス（最大255文字）  |
| `display_name`  | `VARCHAR(100)` | NOT NULL                            | Googleアカウントの表示名                         |
| `role`          | `VARCHAR(50)`  | DEFAULT 'member' NOT NULL           | ユーザーの役割（例: member, maintainer, admin）. |
| `status`        | `VARCHAR(50)`  | DEFAULT 'pending' NOT NULL          | ユーザーの状態（例: pending, active, rejected）  |
| `bio`           | `VARCHAR(500)` |                                     | ユーザーの自己紹介文                             |
| `avatar_url`    | `TEXT`         |                                     | Googleプロフィール画像のURL                      |
| `x_url`         | `TEXT`         |                                     | XアカウントのURL                                 |
| `facebook_url`  | `TEXT`         |                                     | FacebookアカウントのURL                          |
| `instagram_url` | `TEXT`         |                                     | InstagramアカウントのURL                         |
| `github_url`    | `TEXT`         |                                     | GitHubアカウントのURL                            |
| `portfolio_url` | `TEXT`         |                                     | ポートフォリオサイトのURL                        |
| `is_deleted`    | `BOOLEAN`      | DEFAULT FALSE, NOT NULL             | 論理削除フラグ                                   |
| `created_at`    | `TIMESTAMP`    | DEFAULT CURRENT_TIMESTAMP, NOT NULL | 作成日時                                         |
| `updated_at`    | `TIMESTAMP`    | DEFAULT CURRENT_TIMESTAMP, NOT NULL | 更新日時                                         |

---

### 2.2. documents テーブル

| カラム名        | データ型       | 制約                                 | 説明                               |
| --------------- | -------------- | ------------------------------------ | ---------------------------------- |
| `id`            | `SERIAL`       | PRIMARY KEY                          | レコードの一意な識別子（連番）     |
| `name`          | `VARCHAR(255)` | NOT NULL                             | 資料名                             |
| `description`   | `TEXT`         |                                      | 資料の説明文                       |
| `category_id`   | `INTEGER`      | FOREIGN KEY(categories.id), NOT NULL | 資料の分類                         |
| `url`           | `TEXT`         | NOT NULL                             | 資料へのリンク（Googleドライブ等） |
| `display_order` | `INTEGER`      | DEFAULT 0, NOT NULL                  | 表示順                             |
| `created_by`    | `INTEGER`      | FOREIGN KEY(users.id), NOT NULL      | 資料を作成したユーザー             |
| `updated_by`    | `INTEGER`      | FOREIGN KEY(users.id), NOT NULL      | 資料を最後に更新したユーザー       |
| `assignee`      | `VARCHAR(100)` |                                      | （廃止）資料の担当者名             |
| `assignee_id`   | `INTEGER`      | FOREIGN KEY(users.id)                | 資料の責任者ユーザー               |
| `is_deleted`    | `BOOLEAN`      | DEFAULT FALSE, NOT NULL              | 論理削除フラグ                     |
| `created_at`    | `TIMESTAMP`    | DEFAULT CURRENT_TIMESTAMP, NOT NULL  | 作成日時                           |
| `updated_at`    | `TIMESTAMP`    | DEFAULT CURRENT_TIMESTAMP, NOT NULL  | 更新日時                           |

---

### 2.3. videos テーブル

| カラム名         | データ型       | 制約                                 | 説明                                 |
| ---------------- | -------------- | ------------------------------------ | ------------------------------------ |
| `id`             | `SERIAL`       | PRIMARY KEY                          | レコードの一意な識別子（連番）       |
| `name`           | `VARCHAR(255)` | NOT NULL                             | 動画名                               |
| `description`    | `TEXT`         |                                      | 動画の説明文                         |
| `category_id`    | `INTEGER`      | FOREIGN KEY(categories.id), NOT NULL | 動画の分類                           |
| `url`            | `TEXT`         | NOT NULL                             | 動画へのリンク（Youtube等）          |
| `thumbnail_path` | `TEXT`         |                                      | サムネイル画像パス                   |
| `thumbnail_time` | `INTEGER`      |                                      | サムネイルのタイミング（秒換算）     |
| `length`         | `INTEGER`      |                                      | 動画の再生時間（秒換算）             |
| `display_order`  | `INTEGER`      | DEFAULT 0, NOT NULL                  | 表示順                               |
| `created_by`     | `INTEGER`      | FOREIGN KEY(users.id), NOT NULL      | 動画を作成したユーザー               |
| `updated_by`     | `INTEGER`      | FOREIGN KEY(users.id), NOT NULL      | 動画を最後に更新したユーザー         |
| `assignee`       | `VARCHAR(100)` |                                      | （廃止）動画の担当者名（講師など）   |
| `assignee_id`    | `INTEGER`      | FOREIGN KEY(users.id)                | 動画の責任者ユーザー（あるいは窓口） |
| `is_deleted`     | `BOOLEAN`      | DEFAULT FALSE, NOT NULL              | 論理削除フラグ                       |
| `created_at`     | `TIMESTAMP`    | DEFAULT CURRENT_TIMESTAMP, NOT NULL  | 作成日時                             |
| `updated_at`     | `TIMESTAMP`    | DEFAULT CURRENT_TIMESTAMP, NOT NULL  | 更新日時                             |

### 2.4. categories テーブル

| カラム名        | データ型       | 制約                                                | 説明                            |
| --------------- | -------------- | --------------------------------------------------- | ------------------------------- |
| `id`            | `SERIAL`       | PRIMARY KEY                                         | レコードの一意な識別子（連番）  |
| `category_type` | `VARCHAR(50)`  | NOT NULL, `documents` OR `videos` OR `applications` | カテゴリーの種別                |
| `name`          | `VARCHAR(100)` | NOT NULL                                            | カテゴリー名 （例: 事務局資料） |
| `description`   | `TEXT`         |                                                     | カテゴリーの説明文              |
| `display_order` | `INTEGER`      | DEFAULT 0, NOT NULL                                 | 表示順                          |
| `is_deleted`    | `BOOLEAN`      | DEFAULT FALSE, NOT NULL                             | 論理削除フラグ                  |
| `created_at`    | `TIMESTAMP`    | DEFAULT CURRENT_TIMESTAMP, NOT NULL                 | 作成日時                        |
| `updated_at`    | `TIMESTAMP`    | DEFAULT CURRENT_TIMESTAMP, NOT NULL                 | 更新日時                        |

### 2.5. applications テーブル

| カラム名         | データ型       | 制約                                 | 説明                           |
| ---------------- | -------------- | ------------------------------------ | ------------------------------ |
| `id`             | `SERIAL`       | PRIMARY KEY                          | レコードの一意な識別子（連番） |
| `name`           | `VARCHAR(255)` | NOT NULL                             | アプリ名                       |
| `description`    | `TEXT`         | NOT NULL                             | アプリの詳細説明文             |
| `category_id`    | `INTEGER`      | FOREIGN KEY(categories.id), NOT NULL | アプリのカテゴリー             |
| `url`            | `TEXT`         | NOT NULL                             | アプリへのリンク               |
| `thumbnail_path` | `TEXT`         |                                      | サムネイル画像パス             |
| `developer_id`   | `INTEGER`      | FOREIGN KEY(users.id)                | 開発者（ユーザーID）           |
| `display_order`  | `INTEGER`      | DEFAULT 0, NOT NULL                  | 表示順                         |
| `created_by`     | `INTEGER`      | FOREIGN KEY(users.id), NOT NULL      | アプリを登録したユーザー       |
| `updated_by`     | `INTEGER`      | FOREIGN KEY(users.id), NOT NULL      | アプリを最後に更新したユーザー |
| `is_deleted`     | `BOOLEAN`      | DEFAULT FALSE, NOT NULL              | 論理削除フラグ                 |
| `created_at`     | `TIMESTAMP`    | DEFAULT CURRENT_TIMESTAMP, NOT NULL  | 作成日時                       |
| `updated_at`     | `TIMESTAMP`    | DEFAULT CURRENT_TIMESTAMP, NOT NULL  | 更新日時                       |

### 2.6. positions テーブル

| カラム名        | データ型      | 制約                                | 説明                           |
| --------------- | ------------- | ----------------------------------- | ------------------------------ |
| `id`            | `SERIAL`      | PRIMARY KEY                         | レコードの一意な識別子（連番） |
| `name`          | `VARCHAR(50)` | NOT NULL                            | 役職・所属名                   |
| `description`   | `TEXT`        |                                     | 役職・所属の説明文             |
| `display_order` | `INTEGER`     | DEFAULT 0, NOT NULL                 | 表示順                         |
| `is_deleted`    | `BOOLEAN`     | DEFAULT FALSE, NOT NULL             | 論理削除フラグ                 |
| `created_at`    | `TIMESTAMP`   | DEFAULT CURRENT_TIMESTAMP, NOT NULL | 作成日時                       |
| `updated_at`    | `TIMESTAMP`   | DEFAULT CURRENT_TIMESTAMP, NOT NULL | 更新日時                       |

### 2.7. position_tags テーブル

| カラム名                 | データ型    | 制約                                | 説明                                       |
| ------------------------ | ----------- | ----------------------------------- | ------------------------------------------ |
| `id`                     | `SERIAL`    | PRIMARY KEY                         | レコードの一意な識別子（連番）             |
| `user_id`                | `INTEGER`   | FOREIGN KEY(users.id), NOT NULL     | ユーザーID                                 |
| `position_id`            | `INTEGER`   | FOREIGN KEY(positions.id), NOT NULL | 役職・所属ID                               |
| `created_at`             | `TIMESTAMP` | DEFAULT CURRENT_TIMESTAMP, NOT NULL | 作成日時                                   |
| `updated_at`             | `TIMESTAMP` | DEFAULT CURRENT_TIMESTAMP, NOT NULL | 更新日時                                   |
| `user_id`, `position_id` | -           | UNIQUE(user_id, position_id)        | 同一ユーザーに同じ役職を複数回割り当て不可 |

## 3. ER図

```mermaid
erDiagram
    users {
        SERIAL id PK "レコードの一意な識別子（連番）"
        UUID auth_id FK "Supabase Auth ユーザーID"
        VARCHAR email "Googleアカウントのメールアドレス (最大255文字)"
        VARCHAR display_name "Googleアカウントの表示名 (最大100文字)"
        VARCHAR role "ユーザーの役割（例: member, maintainer, admin） (最大50文字)"
        VARCHAR status "ユーザーの状態（例: pending, active, rejected） (最大50文字)"
        VARCHAR bio "ユーザーの自己紹介文 (最大500文字)"
        TEXT avatar_url "Googleプロフィール画像のURL"
        TEXT x_url "X（旧Twitter）アカウントURL"
        TEXT facebook_url "FacebookアカウントURL"
        TEXT instagram_url "InstagramアカウントURL"
        TEXT github_url "GitHubアカウントURL"
        TEXT portfolio_url "ポートフォリオサイトURL"
        BOOLEAN is_deleted "論理削除フラグ (デフォルト: false)"
        TIMESTAMP created_at "作成日時"
        TIMESTAMP updated_at "更新日時"
    }

    documents {
        SERIAL id PK "レコードの一意な識別子（連番）"
        VARCHAR name "資料名 (最大255文字)"
        TEXT description "資料の説明文"
        INTEGER category_id FK "資料のカテゴリー（categories.id）"
        TEXT url "資料へのリンク（Googleドライブ等）"
        INTEGER display_order "表示順"
        INTEGER created_by FK "資料を作成したユーザー (users.id)"
        INTEGER updated_by FK "資料を最後に更新したユーザー (users.id)"
        VARCHAR assignee "（廃止）資料の担当者名 (最大100文字)"
        INTEGER assignee_id FK "資料の責任者ユーザー（users.id）"
        BOOLEAN is_deleted "論理削除フラグ (デフォルト: false)"
        TIMESTAMP created_at "作成日時"
        TIMESTAMP updated_at "更新日時"
    }

    videos {
        SERIAL id PK "レコードの一意な識別子（連番）"
        VARCHAR name "動画名 (最大255文字)"
        TEXT description "動画の説明文"
        INTEGER category_id FK "動画のカテゴリー（categories.id）"
        TEXT url "動画へのリンク（Youtube等）"
        TEXT thumbnail_path "サムネイル画像パス"
        INTEGER thumbnail_time "サムネイルのタイミング（秒換算）"
        INTEGER length "動画の再生時間（秒換算）"
        INTEGER display_order "表示順"
        INTEGER created_by FK "動画を作成したユーザー (users.id)"
        INTEGER updated_by FK "動画を最後に更新したユーザー (users.id)"
        VARCHAR assignee "（廃止）動画の担当者名（講師など）"
        INTEGER assignee_id FK "動画の責任者ユーザー、あるいは窓口（users.id）"
        BOOLEAN is_deleted "論理削除フラグ (デフォルト: false)"
        TIMESTAMP created_at "作成日時"
        TIMESTAMP updated_at "更新日時"
    }

    applications {
        SERIAL id PK "レコードの一意な識別子（連番）"
        VARCHAR name "アプリ名 (最大255文字)"
        TEXT description "アプリの詳細説明文"
        INTEGER category_id FK "アプリのカテゴリー（categories.id）"
        TEXT url "アプリへのリンク"
        TEXT thumbnail_path "サムネイル画像パス"
        INTEGER developer_id FK "開発者（users.id）"
        INTEGER display_order "表示順"
        INTEGER created_by FK "アプリを登録したユーザー (users.id)"
        INTEGER updated_by FK "アプリを最後に更新したユーザー (users.id)"
        BOOLEAN is_deleted "論理削除フラグ (デフォルト: false)"
        TIMESTAMP created_at "作成日時"
        TIMESTAMP updated_at "更新日時"
    }

    categories {
        SERIAL id PK "レコードの一意な識別子（連番）"
        VARCHAR category_type "カテゴリー種別 (documents OR videos OR applications) (最大50文字)"
        VARCHAR name "カテゴリー名 (最大100文字)"
        TEXT description "カテゴリーの説明文"
        INTEGER display_order "表示順"
        BOOLEAN is_deleted "論理削除フラグ (デフォルト: false)"
        TIMESTAMP created_at "作成日時"
        TIMESTAMP updated_at "更新日時"
    }

    positions {
        SERIAL id PK "レコードの一意な識別子（連番）"
        VARCHAR name "役職・所属名 (最大50文字)"
        TEXT description "役職・所属の説明文"
        INTEGER display_order "表示順"
        BOOLEAN is_deleted "論理削除フラグ (デフォルト: false)"
        TIMESTAMP created_at "作成日時"
        TIMESTAMP updated_at "更新日時"
    }

    position_tags {
        SERIAL id PK "レコードの一意な識別子（連番）"
        INTEGER user_id FK "ユーザー（users.id）"
        INTEGER position_id FK "役職・所属（positions.id）"
        TIMESTAMP created_at "作成日時"
        TIMESTAMP updated_at "更新日時"
    }

    users ||--o{ documents : "1:N (created_by)"
    users ||--o{ videos : "1:N (created_by)"
    users ||--o{ applications : "1:N (developer_id)"
    users ||--o{ applications : "1:N (created_by)"
    users ||--o{ position_tags : "1:N (user_id)"
    positions ||--o{ position_tags : "1:N (position_id)"
    categories ||--o{ documents : "1:N"
    categories ||--o{ videos : "1:N"
    categories ||--o{ applications : "1:N"
```

## 4. Row Level Security（RLS）ポリシー

Supabaseでは、Row Level Security（RLS）を使用してデータアクセスを制御しています。以下に各テーブルのRLSポリシーを説明します。

### 4.1. users テーブルのRLSポリシー

- 認証済ユーザーは削除されていないデータのみ閲覧可能
- 新規登録は、Supabase Authからの自動登録のみ許可
  - OAuth認証後のコールバック処理で、ユーザー自身のデータを登録する際に使用する
- ユーザーは自身のデータのみ更新可能
- 管理者は全ユーザー情報を更新可能
- ユーザーは自分自身の論理削除のみ可能
  - 退会処理に相当する
- 管理者は全ユーザーの論理削除が可能
  - 管理者による利用停止処理などに使用する
- 論理削除のみとし、物理削除を防止

### 4.2. documents テーブルのRLSポリシー

- 認証済ユーザーは削除されていないデータのみ閲覧可能
- 管理者またはメンテナーは全データを閲覧可能
  - 削除機能があるため
- 管理者またはメンテナーは全データを登録・更新可能
- 論理削除のみとし、物理削除を防止

### 4.3. videos テーブルのRLSポリシー

- 認証済ユーザーは削除されていないデータのみ閲覧可能
- 管理者またはメンテナーは全データを閲覧可能
  - 削除機能があるため
- 管理者またはメンテナーは全データを登録・更新可能
- 論理削除のみとし、物理削除を防止

### 4.4. categories テーブルのRLSポリシー

- 認証済ユーザーは削除されていないデータのみ閲覧可能

### 4.5. applications テーブルのRLSポリシー

- 認証済ユーザーは削除されていないデータのみ閲覧可能
- 管理者またはメンテナーは全データを閲覧可能
  - 削除機能があるため
- 管理者またはメンテナーは全データを登録・更新可能
- 論理削除のみとし、物理削除を防止

### 4.6. positions テーブルのRLSポリシー

- 認証済ユーザーは削除されていないデータのみ閲覧可能
- 管理者またはメンテナーは全データを閲覧可能
- 管理者またはメンテナーは全データを登録・更新可能
- 論理削除のみとし、物理削除を防止

### 4.7. position_tags テーブルのRLSポリシー

- 認証済ユーザーは全データを閲覧可能
  - 物理削除のため、削除フラグは考慮不要
- ユーザーは自身のデータのみ登録・更新可能
- 管理者またはメンテナーは全データを登録・更新可能
- ユーザーは自身のデータのみ物理削除可能
- 管理者またはメンテナーは全データを物理削除可能

## 5. サポート関数・備考

- `auth.uid()`
  - Supabase Authが提供する組み込み関数で、現在のセッションで認証されているユーザーのUUIDを返す。未認証の場合はNULLを返す。RLSポリシーでユーザー識別に使用される。これが主要な認証識別関数として使用される。
- USINGは更新対象の行を選択する条件、WITH CHECKは更新後の値をチェックする条件を指定している

## 6. データアクセス制御の実現

これらのRLSポリシーとSupabase Auth統合により、シンラボポータルサイトでは以下のデータアクセス制御を実現しています。

- **認証ベースアクセス**: Supabase Authで認証されたユーザーのみアクセス可能
- **管理者特権**: 管理者は全ユーザー情報を閲覧・更新可能、およびコンテンツ管理権限
- **メンテナー権限**: メンテナーはコンテンツの追加・編集・削除が可能
- **メンバー限定コンテンツ**: 認証済みユーザーのみがコンテンツを閲覧可能
- **データ保全**: 物理削除は禁止され、論理削除のみ許可（データの整合性保持）
- **シンプルな権限管理**: Supabase Authとの統合により、複雑な認証連携処理が不要
