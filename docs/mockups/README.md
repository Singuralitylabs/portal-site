# 画面モック運用（PoC）

`docs/mockups/` は、機能設計書に掲載する画面イメージの素材を管理するディレクトリです。

## ディレクトリ方針

- `png/`: 設計書掲載用の PNG（Playwright 生成）
- `html/`: 軽量 HTML モック（PNG生成元）
- `screenshots/`: 実画面キャプチャ（Playwright などで取得）

現時点では最小検証段階のため、`docs/mockups/html/` の静的HTMLを正本として運用する。

## ブラウザ描画 + Playwright で PNG 生成する手順

実装済みの HTML モックをブラウザで描画し、描画結果を PNG 化する PoC パターンです。

1. 前提
   - `playwright` パッケージがインストール済みであること

   ```bash
   npm install -D playwright
   ```

2. 実行

   ```bash
   npm run mockup:png:playwright
   ```

3. 出力先
   - `docs/mockups/png/*.playwright.png`

補足:

- `npm run mockup:png:playwright` 実行時に、`docs/mockups/html/` を配信するNode静的サーバーを自動起動・自動停止します
- 既定では `docs/mockups/html/` 配下のHTMLモック画面を対象にします
- 複数モック画面を対象にし、各画面のコンテンツ領域のみをPNG化します
- 各HTMLモックページでは、切り出したいラッパー要素に `data-mockup-capture` 属性を付与します
- 必要に応じて `MOCKUP_BASE_URL` で対象ホストを変更できます

  ```bash
  MOCKUP_BASE_URL="http://127.0.0.1:3001" npm run mockup:png:playwright
  ```

## 方針

- 生成元の正本は `docs/mockups/html/` とする
- 生成物は `docs/mockups/png/*.png` を優先して設計書から参照する
