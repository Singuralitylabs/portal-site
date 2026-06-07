import { QuickLinkCategoryType } from "../types";

// ロゴ未設定時のフォールバック画像（サイドバーのロゴと同一ファイル）
export const QUICK_LINK_FALLBACK_LOGO = "/icon.png";

// クイックリンクの定義
// カテゴリー・リンクは定義順に表示される。変更時は本ファイルを修正する
export const QUICK_LINK_CATEGORIES: QuickLinkCategoryType[] = [
  {
    id: "tools",
    name: "ツール",
    displayMode: "direct",
    links: [
      {
        name: "シンラボSlack",
        url: "https://sinlab-community.slack.com/archives/CCU85HMHA",
        description:
          "シンラボメンバーの日々のコミュニケーションツールです。プロジェクトの連絡やイベント告知などが行われています（リンク先は「00-ガイドライン」チャンネル）。",
        logoPath: "/links/slack.svg",
      },
      {
        name: "シンラボドライブ",
        url: "https://drive.google.com/drive/u/0/folders/0APgOh96jaLQZUk9PVA",
        description:
          "シンラボの共有Googleドライブです。議事録やイベント資料など、活動に関する各種資料が保管されています。",
        logoPath: "/links/googledrive.svg",
      },
    ],
  },
  {
    id: "services",
    name: "シンラボサービス",
    displayMode: "modal",
    links: [
      {
        name: "Sinlab Study",
        url: "https://web-skillup-service.vercel.app/",
        description:
          "シンラボメンバー向けの学習支援サービスです。GASに関するコンテンツをレッスン形式で学べます。",
        detailDescription:
          "Sinlab Studyは、シンラボメンバー向けの学習支援サービスです。現在はGAS（Google Apps Script）に関するコンテンツをレッスン形式で学ぶことができます。今後、AI開発やウェブ技術開発などのコンテンツも順次追加予定です。",
      },
      {
        name: "Sinlab Knowledge",
        url: "https://sinlab-knowledge.vercel.app/",
        description:
          "シンラボの知見を蓄積・共有するナレッジベースです。ウェブ技術・ウェブ開発・AI駆動開発のノウハウを閲覧できます。",
        detailDescription:
          "Sinlab Knowledgeは、シンラボの知見を蓄積・共有するナレッジベースです。マークダウンやGitなどのウェブ技術、HTML・CSS等のウェブ開発のための知見のほか、AI駆動開発のノウハウも収録されています。",
      },
    ],
  },
  {
    id: "social",
    name: "SNS",
    displayMode: "direct",
    links: [
      {
        name: "シンラボ講師のXアカウント",
        url: "https://x.com/helloCodeSchool",
        description:
          "シンラボ講師が運営するXアカウントです。プログラミングやウェブ技術の知見、最新トレンド、シンラボの活動・記事などを発信しています。",
        logoPath: "/links/x.svg",
      },
      // Facebookは現状公式で運用しているアカウントがないため一旦非表示（#205）
      // {
      //   name: "Facebook",
      //   url: "https://example.com/",
      //   description: "シンラボの公式Facebookページです。",
      //   logoPath: "/links/facebook.svg",
      // },
      {
        name: "シンラボのエンジニアチャンネル",
        url: "https://www.youtube.com/@%E3%82%B7%E3%83%B3%E3%83%A9%E3%83%9C%E3%81%AE%E3%82%A8%E3%83%B3%E3%82%B8%E3%83%8B%E3%82%A2%E3%83%81%E3%83%A3%E3%83%B3%E3%83%8D%E3%83%AB",
        description:
          "シンラボの公式YouTubeチャンネルです。エンジニアによる技術解説やシンラボの活動紹介動画を公開しています。",
        logoPath: "/links/youtube.svg",
      },
      {
        name: "Web技術記事",
        url: "https://note.com/hello_coding",
        description: "シンラボ公式のnoteです。Web技術に関する記事や活動レポートを発信しています。",
        logoPath: "/links/note.svg",
      },
      {
        name: "チーム開発記録",
        url: "https://zenn.dev/singularitylabs",
        description:
          "シンラボ公式のZennアカウントです。チーム開発で得られた知見を技術記事として発信しています。",
        logoPath: "/links/zenn.svg",
      },
    ],
  },
  {
    id: "website",
    name: "公式サイト",
    displayMode: "direct",
    links: [
      {
        name: "シンラボHP",
        url: "https://sinlab.future-tech-association.org/",
        description:
          "シンギュラリティ・ラボの公式ホームページです。活動内容の紹介や入会案内を掲載しています。",
      },
      {
        name: "未来技術推進協会HP",
        url: "https://future-tech-association.org/",
        description:
          "シンラボの運営団体である未来技術推進協会の公式ホームページです。協会の理念や事業内容を紹介しています。",
      },
    ],
  },
];
