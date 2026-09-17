# シクミベース サイト構成ドキュメント

外部の開発者やAIアシスタントに作業を依頼するときに、このファイルを渡せば全体像が伝わることを目的にしています。

> **⚠️ このファイルに認証情報は含めていません。**
> APIキー・パスワードの類は絶対にここへ書かないでください。第三者に渡す前提のファイルです。

最終更新：2026年9月13日

---

## 1. 概要

| 項目 | 内容 |
| --- | --- |
| サイト名 | シクミベース |
| 公開URL | https://shikumi-base.com |
| 目的 | 中小企業・地域企業の集客・営業・業務・発信・組織を再現可能な仕組みに変える事業ブランドとして、仕組み化の相談を獲得する反響営業型サイト |
| 廃止済み | 旧リフォーム特化の商品・診断・価格・URL（`/service/reform-lead-os/`、`/diagnosis/reform-lead/`）。記事・CTA・生成プロンプトで使用しない |
| 運営 | 山野辺 雄太（個人事業。**法人ではない**） |
| リポジトリ | https://github.com/yutayama86/home |
| ローカル | `~/Desktop/shikumi-base` |
| 本番ブランチ | `main`（push で自動デプロイ） |

### 表記の制約（重要）

法人化前のため、次の表記は**使用禁止**です。`scripts/quality-check.mjs` が検出してビルドを止めます。

- 「株式会社シクミベース」
- 「代表取締役」
- 法人格があるように誤認させる会社概要

---

## 2. 技術構成

| 領域 | 採用 |
| --- | --- |
| フレームワーク | Astro 7（静的サイト生成） |
| ホスティング | Cloudflare Pages |
| フォームAPI | Cloudflare Pages Functions |
| メール送信 | Resend（無料枠：月3,000通／日100通） |
| メール受信 | さくらのレンタルサーバ |
| DNS | Cloudflare |
| 解析 | Google Analytics 4 ＋ Cloudflare Web Analytics |

**外部UIライブラリ・外部JSバンドルは使っていません。** スクリプトは最小限のインラインのみで、CSSは1ファイル（約23KB）です。この方針は維持してください。

### 依存パッケージ

```
dependencies:    astro, @astrojs/sitemap
devDependencies: @astrojs/check, typescript, wrangler
```

---

## 3. ディレクトリ構成

```
shikumi-base/
├── astro.config.mjs          サイト設定・サイトマップ生成ロジック
├── tsconfig.json             astro/tsconfigs/strict を継承
├── wrangler.jsonc            Cloudflare Pages 設定
│
├── src/
│   ├── site.config.ts        サイト情報・問い合わせ導線・解析タグの設定
│   ├── content.config.ts     記事のスキーマ定義（Zod）
│   ├── data/taxonomy.ts      カテゴリとサービスの定義
│   │
│   ├── content/              記事の実体（Markdown）
│   │   ├── knowledge/        ナレッジ記事 7本
│   │   └── case/             事例 1本
│   │
│   ├── pages/                ルーティング
│   │   ├── index.astro
│   │   ├── about.astro
│   │   ├── privacy.astro
│   │   ├── knowledge/index.astro
│   │   ├── knowledge/[category]/index.astro
│   │   ├── knowledge/[category]/[slug].astro
│   │   ├── case/index.astro
│   │   ├── case/[slug].astro
│   │   ├── service/index.astro
│   │   ├── service/[id].astro
│   │   ├── contact/index.astro
│   │   └── contact/thanks.astro
│   │
│   ├── layouts/
│   │   ├── BaseLayout.astro      head・メタ情報・解析タグ・スクロール表示
│   │   ├── PageLayout.astro      通常ページ（ヘッダー＋パンくず＋見出し）
│   │   └── ArticleLayout.astro   記事ページ（目次・構造化データ・CTA・関連記事）
│   │
│   ├── components/
│   │   ├── SiteHeader.astro      ヘッダー＋モバイルメニュー
│   │   ├── SiteFooter.astro      フッター
│   │   ├── Hero.astro            トップのファーストビュー
│   │   ├── About.astro           トップ「私たちについて」
│   │   ├── Services.astro        トップ「できること」
│   │   ├── Process.astro         トップ「進め方」
│   │   ├── Project.astro         トップ「イバトコ」
│   │   ├── Operator.astro        トップ「運営者」
│   │   ├── Contact.astro         トップ下部のCTA帯
│   │   ├── ArticleCard.astro     記事カード
│   │   ├── Breadcrumbs.astro     パンくず＋BreadcrumbList構造化データ
│   │   └── ServiceCta.astro      記事下のサービス誘導
│   │
│   ├── utils/
│   │   ├── related.ts        関連記事の自動選出・公開記事の並べ替え
│   │   └── format.ts         日付整形・読了時間
│   │
│   └── styles/global.css     デザイントークン＋記事本文スタイル
│
├── functions/api/contact.ts  問い合わせフォームの受け口（Workers上で動く）
│
├── public/
│   ├── og.png                OGP画像 1200×630
│   ├── favicon.svg
│   ├── robots.txt
│   ├── _redirects            /sitemap.xml → /sitemap-index.xml
│   ├── ibatoco-ogp.png
│   └── operator-illustration-fresh.jpg
│
├── scripts/
│   ├── quality-check.mjs     記事の品質ゲート（CIで実行）
│   ├── daily-growth.mjs      改善対象の自動判定＋レポート
│   ├── select-daily-topic.mjs 新規記事の日だけ使うテーマ選定
│   ├── improve-page.mjs      既存ページを必要箇所だけ改善
│   ├── verify-target-match.mjs 分析対象と変更ファイルの一致チェック
│   ├── tests/                判定・改善・ガード・ワークフローのテスト（node --test）
│   ├── generate-article.mjs  記事プロンプト作成と公開候補の保存
│   ├── infer-article.mjs     Cloudflare Workers AI で記事を生成（2回：執筆＋事実監査）
│   ├── seo-audit.mjs         sitemap・canonical・noindex の監査
│   └── lib/
│       ├── brand-guard.mjs   生成プロンプトの最上位制約と旧リフォーム文脈の検出（生成・品質ゲートで共用）
│       ├── decide-target.mjs 投資先の優先順位判定（純関数・テスト対象）
│       ├── gsc.mjs           Search Console API クライアント
│       └── ga4.mjs           GA4 Data API クライアント
│
├── tools/
│   ├── og-image.html         OGP画像の版下
│   └── build-og.sh           ヘッドレスChromeで書き出し
│
├── docs/
│   ├── ARCHITECTURE.md       このファイル
│   └── seo-log/              日々の改善履歴
│
└── .github/workflows/
    ├── build.yml             push/PR で型チェック・ビルド・品質チェック
    └── daily-content.yml     毎朝の改善提案をPRで提出
```

---

## 4. コマンド

```bash
npm install
npm run dev       # 開発サーバー（localhost:4321）
npm run verify    # 型チェック → ビルド → 品質チェック（コミット前に必ず実行）
npm run build
npm run quality   # 記事の品質チェック単体
npm run growth    # 改善対象の判定とレポート
npm run og        # OGP画像を再生成
```

**`npm run verify` が通らないものはコミットしないでください。** CIでも同じチェックが走り、失敗すると公開されません。

---

## 5. 記事の追加方法

`src/content/knowledge/` に Markdown を置くだけです。URL・パンくず・構造化データ・関連記事・CTAは frontmatter から自動生成されます。

### frontmatter の仕様

```yaml
---
title: 60文字以内
description: 60〜140文字
category: shikumika | ai | web | marketing | sns
intent: この記事が答える検索意図を1文で
primaryKeyword: 主軸キーワード（1記事1つ）
keywords:
  - 補助キーワード
publishedAt: 2026-08-31
updatedAt: 2026-09-15        # 任意
relatedServices:             # 必須・1つ以上
  - web | sns | ai-dx
relatedArticles:             # 任意。未指定なら自動選出
  - 他記事のファイル名（拡張子なし）
firstParty: false            # 自社実践に基づく記事なら true
draft: false                 # true の間は公開されない
---
```

**スキーマは `src/content.config.ts` で Zod により検証されます。** 違反するとビルドが失敗します。

- URL は `/knowledge/{category}/{ファイル名}/` になります
- `relatedServices` の値は `web` / `sns` / `ai-dx` のみ。`marketing` は**カテゴリであってサービスではない**ので指定できません

### 事例記事

`src/content/case/` に置きます。frontmatter が異なります（`client` / `challenge` / `approach` / `isOwnProject` / `url`）。詳細は `src/content.config.ts` を参照してください。

---

## 6. 記事の品質ゲート

`scripts/quality-check.mjs` が以下を検査し、**エラーが1件でもあれば公開されません**。

| 検査 | 内容 |
| --- | --- |
| 出典のない成果数値 | 「300%向上」等に出典リンクが無い |
| 禁止表記 | 「株式会社シクミベース」「代表取締役」 |
| 断定表現 | 法務・税務・成果の断定 |
| 必須項目 | `intent` / `primaryKeyword` の未設定 |
| 内部リンク | サイト内リンクが1つも無い |
| メタ情報 | title 60文字超、description の文字数範囲外 |
| **強調の崩れ** | ビルド後のHTMLに `**` が残っている |

### 最後の項目について（重要）

日本語で `**「〜」**` のようにCJK括弧と隣接すると、CommonMark の flanking 規則により強調にならず、`**` がそのまま本文に出ます。原稿を読むだけでは気づけないため、ビルド結果のHTMLを検査しています。

**対処法：括弧を `**` の外に出す。**

```
✗ **「特定の人がいなくても」**と定義して
✓ 「**特定の人がいなくても**」と定義して
```

### 記事執筆時の方針

- PV目的の記事量産は禁止。商談に近い検索意図を優先する
- 「SEOとは」のような一般論より「ホームページ制作費用の相場」のような比較検討層向けを優先
- **実績・数値を捏造しない。** 出典のない統計は書かない
- 「いかがでしたでしょうか」等の定型表現を使わない（警告が出ます）
- 構成：冒頭 → `## 結論：〜` → 課題 → 解決方法 → 注意点 → `## まとめ`

---

## 7. 問い合わせ導線

```
記事・サービスページのCTA（data-cta 属性つき）
  ↓
/contact/  →  最初の入力で contact_form_start
  ↓
POST /api/contact  →  Cloudflare Pages Functions
  ↓
Cloudflare Turnstile で正規の操作かを検証
  ↓
Resend 経由で info@shikumi-base.com へ送信
  ↓
/contact/thanks/  （generate_lead。失敗時は form_error とメール送信の導線）
```

`?topic=` の値（`system` / `web` / `sns` / `ai-dx` / `local` / `other`）がフォームの相談種別に初期反映されます。

### 設定ファイル

`src/site.config.ts` の `contact` で管理します。

```ts
export const contact = {
  formPath: '/contact/',
  email: 'info@shikumi-base.com',
};
```

### エラー時の挙動

| 状況 | HTTP | 表示 |
| --- | --- | --- |
| 入力不備 | 400 | サーバーからのメッセージをそのまま表示 |
| 環境変数の未設定 | 503 | 入力内容を引き継いだ **mailto** ボタンを表示 |
| 送信失敗 | 500 | 同上 |

**502は使わないでください。** Cloudflareが自前のエラーページに差し替えてしまい、レスポンスのJSONが届かなくなります。過去にこれで原因の切り分けができなくなりました。

### メールの経路

| 区間 | 内容 |
| --- | --- |
| 送信元 | `noreply@shikumi-base.com`（Resendで認証済み） |
| Reply-To | 相談者が入力したアドレス（そのまま返信できる） |
| 宛先 | `info@shikumi-base.com` |
| 受信 | さくらのエイリアス → `shikumibase` ユーザー |

`info` ユーザーはイバトコ用なので、**シクミベースの問い合わせは `shikumibase` ユーザーに分離**しています。

---

## 8. 環境変数

### Cloudflare Pages（Settings → Environment variables → Production）

| 変数名 | 用途 | 種別 |
| --- | --- | --- |
| `RESEND_API_KEY` | Resend の APIキー | **シークレット** |
| `CONTACT_TO` | 通知の宛先 | シークレット（テキスト推奨） |
| `CONTACT_FROM` | 送信元アドレス | シークレット（テキスト推奨） |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstileのサーバー検証キー | **シークレット** |

**変更後は必ず再デプロイが必要です。** 保存しただけでは反映されません。

> **落とし穴：** Cloudflareのシークレットは書き込み専用です。**変数名をリネームすると値が消えます。** また、空になったシークレットに値を再設定しても反映されないことがあります。その場合は**行を削除して新規追加**してください。

### GitHub Actions（Google認証）

Search ConsoleとGA4は、GitHub ActionsのOIDCとGoogle Cloud Workload Identity Federationを使って認証します。サービスアカウントの長期JSON鍵はGitHubへ保存しません。

| 項目 | 設定値 |
| --- | --- |
| Workload Identity Provider | `projects/663019962404/locations/global/workloadIdentityPools/github-actions/providers/github-home` |
| サービスアカウント | `shikumi-base-automation@ibatoco-seo.iam.gserviceaccount.com` |
| Search Console | `sc-domain:shikumi-base.com` |
| GA4プロパティID | `516899437` |

サービスアカウントには、対象のSearch ConsoleプロパティとGA4プロパティの閲覧権限が必要です。API取得失敗時は日次処理を失敗にし、計測不能を見逃しません。

記事生成はCloudflare Workers AIを利用します。GitHub Actionsのシークレット `CLOUDFLARE_AI_API_TOKEN` には、日次記事専用のWorkers AIトークンを設定します。アカウントIDはワークフローに固定し、トークンはログやリポジトリへ出しません。

---

## 9. デプロイ

`main` へ push すると Cloudflare Pages が自動でビルド・公開します。GitHub Actions からのデプロイは設定していません。

```
push → Cloudflare Pages が npm run build → dist/ を配信
```

CIでは型チェック・ビルド・品質チェックが走ります。失敗すればマージできません。

### 既知の制約

リポジトリのトークンに `workflow` スコープが無いため、`.github/workflows/` を含むコミットは push できません。ワークフローを変更する場合は、トークンにスコープを追加するか、GitHubのWeb UIから編集してください。

---

## 10. ドメインとDNS

| ホスト | 用途 |
| --- | --- |
| `shikumi-base.com` | 本番（Cloudflare Pages） |
| `www.shikumi-base.com` | 本番（同上） |
| `shikumi-base.pages.dev` | Cloudflareの既定ドメイン |

### DNSレコード（Cloudflare管理）

| タイプ | 名前 | 内容 | 用途 |
| --- | --- | --- | --- |
| CNAME | `@` | shikumi-base.pages.dev | サイト |
| CNAME | `www` | shikumi-base.pages.dev | サイト |
| MX | `@` | shikumibase.sakura.ne.jp | **メール受信（さくら）** |
| TXT | `@` | `v=spf1 include:_spf.sakura.ne.jp ~all` | **SPF（さくら）** |
| TXT | `resend._domainkey` | DKIM公開鍵 | Resend送信 |
| MX | `send` | feedback-smtp.ap-northeast-1.amazonses.com | Resendバウンス |
| TXT | `send` | `v=spf1 include:amazonses.com ~all` | Resend送信 |
| TXT | `_dmarc` | `v=DMARC1; p=none;` | DMARC |

> **ルートの MX と SPF は絶対に変更しないでください。** さくらのメール受信が止まります。
> Resend関連は `send` サブドメインに分離してあるので競合しません。

### robots.txt

本番の `/robots.txt` は、リポジトリ内の `public/robots.txt` の**手前にCloudflareの管理ブロックが自動挿入**されます。GPTBot・ClaudeBot等のAIクローラーが拒否される設定になっていますが、Googlebotは許可されているため検索インデックスには影響しません。変更する場合はCloudflareダッシュボード側の設定です。

---

## 11. 計測

### Google Analytics 4

測定ID：`G-MZPH9X4CPP`（`src/site.config.ts` の `analytics.ga4MeasurementId`）

Search Console（ドメインプロパティ `shikumi-base.com`）と連携済みです。

### Cloudflare Web Analytics

**Cloudflare Pages 側の管理画面で有効化**しており、ビーコンはエッジで自動挿入されます。
そのため `site.config.ts` の `cloudflareToken` は **`null` のままにしてください**。値を入れると二重計測になります。

### カスタムイベント

| イベント | 発火タイミング |
| --- | --- |
| `cta_click` | CTAクリック（`data-cta` に設置場所、`data-cta-topic` に相談内容） |
| `contact_form_start` | 問い合わせフォームへの最初の入力 |
| `generate_lead` | 送信成功 |
| `form_error` | 送信失敗 |

> 2026-09-05〜09-13 はフォームからこれらのイベントが外れていたため、この期間のフォーム開始・問い合わせ完了は計測されていません。

氏名、会社名、メールアドレスなどの個人情報はGA4へ送りません。

---

## 12. 自動化

### 毎朝の改善サイクル

`.github/workflows/daily-content.yml` が毎朝7時（JST）に実行されます。

**「毎日記事を書くシステム」ではなく、「毎日もっとも期待値の高い1ページへ投資するシステム」です。**

```
Search Console + GA4
  ↓  scripts/daily-growth.mjs（判定は scripts/lib/decide-target.mjs）
投資先を1つ決める（target_type / target_path / target_file / action_type）
  ↓
  ├ existing_page → scripts/improve-page.mjs（必要箇所だけ置換）
  ├ new_article   → select-daily-topic.mjs → generate-article.mjs
  └ measurement   → コンテンツは変更しない
  ↓  scripts/verify-target-match.mjs（分析対象＝変更ファイルの確認）
  ↓  npm run verify（テスト・型・ビルド・品質・SEO監査）
Pull Request
```

判断は `--context <path>` のJSONで次工程へ渡り、GitHub Actionsのoutputにも `target_type` / `target_path` / `target_slug` / `target_category` / `target_file` / `editable` / `action_type` / `rule` / `reason` / `focus_keyword` を出します。**既存ページが選ばれた日に `select-daily-topic.mjs` は動きません。**

**マージするまで公開されません。** 対象一致チェックか品質検証で落ちた場合は `git checkout -- src` で変更を破棄し、レポートだけを残してActionsを失敗にします。

### 投資先の優先順位

| 優先 | ルール | 条件 | 改善タイプ |
| --- | --- | --- | --- |
| 1 | A | 問い合わせが発生したセッションの入口ページ | `service_link` / `content_rewrite` |
| 2 | B | 10セッション以上あってCTAクリック0 | `cta` |
| 3 | C | フォーム開始3件以上で送信完了0／CTA5件以上でフォーム開始0／20セッション以上でCTA0 | `cta`（/contact/ は人が確認） |
| 4 | D | 表示30回以上かつ平均11〜30位 | `content_rewrite` |
| 5 | E | 表示50回以上かつCTR 2%未満 | `title_description` |
| 6 | F | 内部リンク2件未満／支援ページ・事例への導線なし | `internal_links` / `service_link` / `case_link` |
| 7 | G | 上記がなく、28日の表示が100回以上 | `new_article` |
| — | MEASUREMENT | 検索の母数が足りない | `measurement_fix`（記事を増やさない） |

しきい値は `THRESHOLDS`（`scripts/lib/decide-target.mjs`）にまとめています。**検索の母数が足りない間は、無条件に新規記事を作りません。**

### 問い合わせの帰属

GA4 Data APIから、`generate_lead` が発生したセッションの**入口ページ**（`landingPagePlusQueryString`）と流入元を取得します。これは「問い合わせが起きたセッションの入口」であり、CTAを押したページでも直前に見ていたページでもありません。取得できない日は「問い合わせ発生あり・LP帰属未確定」と明示し、数値を推測しません。

### 既存ページの改善の安全装置

`scripts/improve-page.mjs` はAIに全文を書かせず、`{"edits":[{"find":"...","replace":"..."}]}` のJSONだけを受け取ります。

- `find` は本文に**一度だけ**現れる文字列であること（見つからない・複数ある場合は中止）
- 置換は最大6件、本文の40%まで、本文量の変化は90〜180%まで
- 既存のH2見出しを削除しない
- 旧リフォーム文脈、許可していない内部リンクが含まれていたら中止
- `title_description` の日は本文を変更しない（title/descriptionのみ）
- 適用時に `updatedAt` を更新する

---

## 13. デザインの方針

`src/styles/global.css` の CSS変数で色・余白・文字サイズ・罫線を一元管理しています。**個別の値を直接書かず、変数を更新してください。**

| 方針 | 内容 |
| --- | --- |
| 配色 | ネイビー `#0a2350` を基調、白と淡いブルーで抜け、ゴールドは少量 |
| 禁止 | 発光・宇宙・意味のないグラデーション・軌道アニメーション |
| 見出し | 日本語を主役に。英語は小さな補助ラベルのみ |
| 本文 | PC 15〜17px / SP 14〜16px、行間1.85〜1.95 |
| フォント | 和欧を1スタックに統合。`font-feature-settings: "palt"` |
| モーション | 控えめなフェードのみ。`prefers-reduced-motion` 対応 |

### 日本語の改行制御

見出しが文節の途中で折り返されないよう、次の2つを併用しています。

- `word-break: auto-phrase`（全見出しに適用）
- `.phrase { display: inline-block }`（主要見出しで文節を明示）

**`text-wrap: balance` は使わないでください。** `auto-phrase` を上書きして文節の途中で改行されます。

---

## 14. 現在のURL一覧（26ページ）

```
/
/about/
/privacy/
/contact/
/contact/thanks/          （noindex・サイトマップ除外）

/knowledge/
/knowledge/shikumika/     仕組み化
/knowledge/ai/            AI・DX
/knowledge/web/           Web
/knowledge/marketing/     マーケティング
/knowledge/sns/           SNS
/knowledge/{category}/{slug}/

/case/
/case/ibatoco/

/service/
/service/web/             集客・営業の仕組み
/service/sns/             発信の仕組み
/service/ai-dx/           業務・改善の仕組み
```

---

## 15. 作業を依頼するときの注意

外部に依頼する場合、次を必ず伝えてください。

1. **法人表記は禁止**（「株式会社」「代表取締役」を使わない）
2. **実績・数値を捏造しない。** 出典のない統計を書かない
3. **`npm run verify` が通ることを確認してから納品**
4. **外部UIライブラリを追加しない**（明確な必要性がある場合のみ相談）
5. **ルートのMX・SPFレコードを変更しない**（メールが止まります）
6. **APIキーやパスワードをチャットに貼らない**

### 渡してはいけない情報

- `RESEND_API_KEY` などのAPIキー
- Cloudflare・さくら・Resend・Googleアカウントのパスワード
- GitHubのPersonal Access Token

**これらは作業に不要です。** 必要になった場合は、依頼先ではなく運営者本人が管理画面で設定してください。
