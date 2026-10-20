# 配信画面で使わない件数取得の削減

## 目的と範囲

`fetchLivestreams` はRPC応答から配信一覧だけを返し、paginationを使わない。scheduleとmultiviewで不要なD1 COUNTを発生させないため、RPCの既存オプション `skipCount: true` を利用する。

- 配信一覧・順序・言語・状態・日付範囲・member/platform条件を維持する。
- 公開REST APIのフォールバック経路は従来どおりとする。
- clip、freechat、creator、画面全体のキャッシュ方式は変更しない。
- サーバーPRの配信キャッシュキー修正を先にデプロイする。

## 受け入れ条件

1. RPC経路で `skipCount: true` を渡し、既存の一覧変換を維持する。
2. all/upcoming/archiveの日時条件、言語変換、member/platform条件を回帰テストで確認する。
3. RESTフォールバックとエラー応答の挙動を維持する。
4. 対象テスト、型チェック、lint/format、既定のpost-edit checkを実行する。既存の失敗はPRに記録する。
5. サーバー先行の適用順序と切り戻し方法をPRに記載する。

## Checkpoint

- [x] 調査と変更範囲の確定
- [x] 実装と回帰テスト
- [x] web全154テスト、Next build、post-edit check
- [ ] PR作成とCI確認

## 適用と切り戻し

サーバーPRの `docs/plan/d1-read-reduction/ROLLOUT.md` に、開発DB→開発サーバー→開発web→本番DB→本番サーバー→本番webの手順を記載する。
キャッシュキーの修正を反映したサーバーを先にデプロイする。
切り戻しはwebを先に旧deploymentへ戻し、その後に必要なサーバーを戻す。
公開REST APIの契約は変更していない。
