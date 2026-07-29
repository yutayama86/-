# お問い合わせ・予約フォームの本番化（Formspree）

サイトのフォーム（`/contact/` と `/reserve/`）は、**送信先を1か所に設定するだけ**で本番稼働します。
設定するまでは「メール下書き（mailto）が開く」フォールバックで動くので、壊れることはありません。

## いまの状態

- 送信先（エンドポイント）は `src/data/site.ts` の `formEndpoint`（現在は空）。
- 空のあいだ：送信ボタンでメール作成画面が開く（`info@ibatoco.jp` 宛）。
- 設定後：ページ遷移なしのAJAX送信になり、完了メッセージが出る（`src/lib/forms.ts`）。
- スパム対策の honeypot（`_gotcha`）と件名（`_subject`）は設定済み。返信先は入力された `email` が自動で使われます。

## 手順（あなたの作業：無料プランでOK）

1. [formspree.io](https://formspree.io/) でアカウントを作成（※アカウント作成・ログインはご本人で。Claudeは代行しません）。
2. 「New Form」で受信先メール（例：`info@ibatoco.jp`）を指定してフォームを作成。
3. 発行される **エンドポイントURL**（例：`https://formspree.io/f/abcdwxyz`）をコピー。
4. `src/data/site.ts` を開き、`formEndpoint` に貼り付け：

   ```ts
   // src/data/site.ts
   formEndpoint: 'https://formspree.io/f/abcdwxyz',
   ```

5. commit → push すると Cloudflare が自動デプロイ。以降フォーム送信がメールで届きます。
6. 初回は Formspree から「このフォームを有効化しますか？」の確認メールが届くので承認（Formspreeの仕様）。

## 補足

- **1つのエンドポイントで両フォーム共用**でOK（件名 `_subject` で「お問い合わせ／予約申込」を区別）。
- 無料プランは月50通まで。増えたら有料プラン、または Cloudflare（Workers＋メール送信 or D1保存）へ移行可能（Phase2）。
- 別サービス（Getform, Basin, 自前Workers）でも、POSTを受けてJSONで `ok` を返せば `src/lib/forms.ts` はそのまま動きます。
- **決済・課金は含みません**（フォームは問い合わせ／予約申込の受付のみ）。

## 関連ファイル

- 送信先設定：`src/data/site.ts`（`formEndpoint`）
- 送信ロジック：`src/lib/forms.ts`（AJAX＋mailtoフォールバック）
- フォーム：`src/pages/contact.astro`, `src/pages/reserve/index.astro`
