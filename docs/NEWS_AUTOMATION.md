# 茨城ニュース解説：自動公開の接続ポイント

## 追加先

外部AIやGitHub Actionsが生成するファイルは `src/content/news/*.md` に追加します。ファイル名がそのまま `/news/<slug>/` のslugになります。

## 公開条件

- `draft: false`
- `reviewed: true`
- `sourceUrls` が1件以上
- `sample: true` の場合は `noindex: true`
- `municipalities` は `src/data/areas.ts` に存在するslugだけ

条件を満たさないファイルはContent Collectionの検証または公開取得処理で止まります。AIは原稿作成までとし、`reviewed: true` への変更は人間の確認後に行ってください。

## GitHub連携の推奨フロー

1. 外部AIが新しいブランチへ `draft: true` のMarkdownを追加する。
2. Pull Requestを作成する。
3. `.github/workflows/validate.yml` が `npm run check` と `npm run audit:site` を実行する。
4. 人間が一次情報、著作権、表現、日付、数値、内部リンクを確認する。
5. `reviewed: true`、`draft: false` に更新する。
6. mainへのマージ後、現在のCloudflareデプロイフローで公開する。

CIが失敗したPull Requestはマージせず、Cloudflare側でもビルドコマンドを `npm run build` に固定してください。
