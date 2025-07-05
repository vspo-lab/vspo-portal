import type { SiteNewsItem } from "@/types/site-news";

export const siteNewsItems: SiteNewsItem[] = [
  {
    id: 14,
    title: "配信情報を通知するDiscord Botを公開しました。",
    content: "今後は切り抜きやイベント情報の通知機能も追加予定です。",
    updated: "2023-09-05T00:00:00Z",
    tags: ["feat"],
    tweetLink: "https://twitter.com/vspodule/status/1699057082513920186",
  },
  {
    id: 13,
    title: "配信の概要を表示するようにしました。",
    content: "配信や切り抜きをクリックすると概要を表示するようにしました。",
    updated: "2023-06-04T00:00:00Z",
    tags: ["feat"],
    tweetLink: "https://twitter.com/vspodule/status/1665153895876935680",
  },
  {
    id: 12,
    title: "イベントページを追加しました。",
    content: "ぶいすぽ関連のイベント情報をまとめたページを作成しました。",
    updated: "2023-06-03T00:00:00Z",
    tags: ["feat"],
    tweetLink: "https://twitter.com/vspodule/status/1664791507419930625",
  },
  {
    id: 11,
    title: "軽微なUI修正",
    content: "サイト下部にナビゲーションバーを追加しました。",
    updated: "2023-05-25T00:00:00Z",
    tags: ["feat"],
  },
  {
    id: 10,
    title: "サイドバーの設定から視聴モードが選択できるようになりました。",
    content:
      "視聴モードを動画にすると、すぽじゅーる上から動画を視聴できます。※iosデバイスでPWAを使用している場合、全画面表示が利用できません。ブラウザ版でお試しください。",
    updated: "2023-05-23T00:00:00Z",
    tags: ["feat"],
    tweetLink: "https://twitter.com/vspodule/status/1660978041223516161",
  },
  {
    id: 9,
    title: "サイドバーからダークモードが選べるようになりました",
    content: "ダークモードをサポートしました。サイドバーから設定可能です。",
    updated: "2023-05-20T00:00:00Z",
    tags: ["feat"],
    tweetLink: "https://twitter.com/vspodule/status/1659719335215267840",
  },
  {
    id: 8,
    title: "PWAとしてホーム画面に追加できるようになりました！",
    content:
      "PWA対応を行いました。モバイル端末のホーム画面から直接アクセス可能です。",
    updated: "2023-05-14T00:00:00Z",
    tags: ["feat"],
    tweetLink: "https://twitter.com/vspodule/status/1657735176485765120",
  },
  {
    id: 7,
    title: "Twitchのクリップが検索できるようになりました！",
    content:
      "Twitchのクリップ検索機能を追加しました。お気に入りのクリップをさらに簡単に見つけられます。",
    updated: "2023-05-04T00:00:00Z",
    tags: ["feat"],
    tweetLink: "https://twitter.com/vspodule/status/1653942522261929985",
  },
  {
    id: 6,
    title: "フリチャ欄を追加しました。",
    content:
      "フリーチャットエリアを追加しました。コミュニケーションを取りやすくしました。",
    updated: "2023-05-01T00:00:00Z",
    tags: ["feat"],
    tweetLink: "https://twitter.com/vspodule/status/1652817609354776576",
  },
  {
    id: 5,
    title: "キーワードで検索がかけられるようになりました！",
    content:
      "全文検索機能を追加しました。キーワードにより特定の情報をすばやく検索可能になりました。",
    updated: "2023-04-23T00:00:00Z",
    tags: ["feat"],
    tweetLink: "https://twitter.com/vspodule/status/1649941160104718336",
  },
  {
    id: 4,
    title: "Youtubeのぶいすぽ関連の切り抜き一覧ページを追加しました！",
    content:
      "Youtubeの切り抜き一覧ページを追加しました。ぶいすぽ関連の切り抜き動画をすべて見ることができます。",
    updated: "2023-04-20T00:00:00Z",
    tags: ["fix", "feat"],
    tweetLink: "https://twitter.com/vspodule/status/1649603932186877952",
  },
  {
    id: 3,
    title: "サイドバーを追加しました。",
    content:
      "サイドバーを追加しました。各種機能へのアクセスがより便利になりました。",
    updated: "2023-04-10T00:00:00Z",
    tags: ["feat"],
    tweetLink: "https://twitter.com/vspodule/status/1645374296238477313",
  },
  {
    id: 2,
    title:
      "時間帯ごとの配信や状態(配信中, 配信予定)の見やすさが改善されました！",
    content:
      "時間帯ごとの配信状況を視覚的に表現しました。配信中、配信予定の状態が一目でわかるようになりました。",
    updated: "2023-04-08T00:00:00Z",
    tags: ["feat"],
    tweetLink: "https://twitter.com/vspodule/status/1644650979856642049",
  },
  {
    id: 1,
    title: "すぽじゅーる公開開始！",
    content: "すぽじゅーるを公開しました。これからのアップデートもお楽しみに！",
    updated: "2023-04-02T00:00:00Z",
    tags: [],
    tweetLink: "https://twitter.com/vspodule/status/1642482294429728769",
  },
];
