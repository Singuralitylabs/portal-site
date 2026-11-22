# セキュリティアップデート運用

依存パッケージの脆弱性とアップデートを確認・対応する手順です。関連Issue: #263（Dependabot導入）、#293（メジャーアップデート）、#405（確認方法の確立）。

## 1. 確認方法

| 仕組み                      | 内容                                               | 確認先                                 |
| --------------------------- | -------------------------------------------------- | -------------------------------------- |
| Dependabot alerts           | 既知の脆弱性を検知して通知                         | リポジトリの Security > Dependabot     |
| Dependabot security updates | 脆弱性の修正PRを自動作成                           | Pull requests（ラベル `dependencies`） |
| Dependabot version updates  | 毎週月曜に更新PRを作成（`.github/dependabot.yml`） | Pull requests                          |
| `npm audit`                 | ローカルでの確認                                   | 手元で `npm audit`                     |

リポジトリ設定（Settings > Code security）で、Dependabot alerts と Dependabot security updates が有効であることを確認してください（管理者のみ操作可）。

## 2. 対応の流れ

1. 月曜にDependabotのPRとアラートを確認する（担当: 保守担当者が持ち回り）
2. 重大度に応じて対応期限を目安にする

   | 重大度          | 目安                     |
   | --------------- | ------------------------ |
   | Critical / High | 1週間以内                |
   | Medium          | 1か月以内                |
   | Low             | 次回の定期更新でまとめて |

3. PRのCI（lint / type-check / format:check / build / test）が通ることを確認してマージする
4. 修正版がない、または更新が困難なものは、理由と残存リスクをIssueに記録する

## 3. メジャーアップデートの扱い

メジャー更新は自動PRの対象外にしています（`dependabot.yml` の `ignore`）。対象は Next.js、Mantine、Tailwind CSS、`@supabase/ssr` です。

- 影響調査と実施の計画は #293 で管理する
- ただし、脆弱性の修正にメジャー更新が必要な場合は、セキュリティ対応として優先して実施する
- Next.js 15系の `postcss` は `package.json` の `overrides` で固定している。Next 16 へ更新する際は外せるか確認する（#293 のコメント参照）
