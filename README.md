# イバトコ (Ibatoco)

> 茨城の“いいとこ”を、行った人の熱量で。 — 体験型ローカルメディア

Astro 製の高速・SEO最適化された静的サイトです。企画書「ローカルDX構想」のサイトマップ（4階層設計）とビジネス導線（Phase 1〜3）をそのまま実装しています。

---

## 🚀 すぐ動かす

```bash
npm install
npm run dev
```

→ ブラウザで <http://localhost:4321> を開く

| コマンド | 内容 |
| --- | --- |
| `npm run dev` | 開発サーバー起動（ホットリロード） |
| `npm run build` | 本番ビルド（`dist/` に出力） |
| `npm run preview` | ビルド結果をローカルで確認 |

---

## 🗂 サイト構成（企画書サイトマップ対応）

| URL | 内容 | 企画書の階層 |
| --- | --- | --- |
| `/` | トップページ | — |
| `/eat/` `/life/` `/sauna-play/` `/beauty/` `/company/` | ジャンル別 記事一覧 | 階層1：集客メディア |
| `/eat/[slug]/` など | 体験レポート記事 | 階層1 |
| `/place/` | 掲載店舗・企業 一覧 | 階層2 |
| `/place/[id]/` | 店舗・企業専用LP（ペライチ） | 階層2 |
| `/reserve/` | 予約・問い合わせフォーム | 階層3：予約・CRM |
| `/biz/` | 掲載のご案内（料金・3フェーズ） | 階層4：BtoB制圧 |
| `/agency/` | WEB集客・HP・SNS代行サポート | 階層4 |
| `/contact/` | お問い合わせ | 階層4 |
| `/reporters/` | 公式レポーター募集 | 第5章 共創モデル |
| `/about/` `/privacy/` | 運営情報・ポリシー | — |

**集客→予約の一気通貫導線**：記事 → 記事内の店舗LPカード → `/place/[id]/` → 「予約・お問い合わせ」ボタン → `/reserve/`

---

## ✍️ コンテンツの増やし方

コンテンツは「育てていく」前提の設計です。方法は2通り。

> 📘 書き方・SEOチェックリストは [`docs/CONTENT_GUIDE.md`](docs/CONTENT_GUIDE.md)、
> コピペ用テンプレートは [`_template.md`](src/content/articles/_template.md)（記事）/
> [`_template.md`](src/content/places/_template.md)（店舗LP）にあります（`_`始まりは公開されません）。

### A. Markdownファイルを直接追加（エンジニア向け）

**記事**：`src/content/articles/<ジャンル>/<好きな名前>.md`

```markdown
---
title: 記事タイトル
description: 一覧・SEOに使う説明文
category: eat            # eat / life / sauna-play / beauty / company
cover: 画像URL           # 省略可（省略時はデザイン済みプレースホルダー）
publishedAt: 2026-07-20
reporter: 公式レポーター みお   # 省略可
area: 水戸市              # 省略可
place: tsukuba-ramen-kaze # 紐づく店舗LPのファイル名（省略可）
featured: true           # トップの特集に出す
---

本文をMarkdownで書きます。
```

**店舗LP**：`src/content/places/<店舗ID>.md`（項目は `src/content.config.ts` 参照）

### B. Decap CMS（編集部・非エンジニア向け）

`/admin/` にアクセスすると、ブラウザ上のUIで記事・店舗を追加できます。
初期設定は [`public/admin/config.yml`](public/admin/config.yml) の冒頭コメントを参照してください（GitHubリポジトリ名とOAuthの設定が必要）。

---

## 🌐 公開手順（GitHub → Cloudflare Pages）

### 1. GitHubにpush

```bash
# リポジトリ・初期コミット・リモートは設定済み。以下でpushするだけ:
git push -u origin main
```

> 現在のリモートは `https://github.com/yutayama86/-.git`（リポジトリ名は「-」）。
> 後で `ibatoco` などに改名する場合は、GitHubで改名 → `git remote set-url origin <新URL>` →
> [`public/admin/config.yml`](public/admin/config.yml) の `repo:` も更新してください。

### 2. Cloudflare Pages に接続

1. [Cloudflare ダッシュボード](https://dash.cloudflare.com/) → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
2. `ibatoco` リポジトリを選択
3. ビルド設定：
   - **Framework preset**: `Astro`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
4. **Save and Deploy** → 数分で `https://ibatoco.pages.dev` が公開されます

以降、`main` にpushするたび自動デプロイされます。

### 3. 独自ドメイン（ibatoco.com）

- **Cloudflare Registrar** または **お名前.com** でドメイン取得
- Cloudflare Pages のプロジェクト → **Custom domains** → `ibatoco.com` を追加
- （お名前.com取得の場合）ネームサーバーをCloudflareに向けるか、CNAMEを設定
- 取得したドメインに合わせて [`astro.config.mjs`](astro.config.mjs) の `SITE` と [`public/robots.txt`](public/robots.txt) のSitemap URLを更新

### 4. アクセス解析（Cloudflare Web Analytics）

1. Cloudflare → **Analytics & Logs** → **Web Analytics** → サイト追加
2. 発行された **トークン** を [`src/data/site.ts`](src/data/site.ts) の `cfAnalyticsToken` に貼り付け
3. commit & push（トークン未設定の間は解析スクリプトは読み込まれません）

### 5. お問い合わせ・予約フォームの送信先（Formspree）

問い合わせ [`/contact/`](src/pages/contact.astro) と予約 [`/reserve/`](src/pages/reserve/index.astro) の
送信先は [`src/data/site.ts`](src/data/site.ts) の `formEndpoint` で**一元管理**しています。

1. [Formspree](https://formspree.io/) に登録し、New Form を作成
2. 発行された `https://formspree.io/f/xxxxxxx` を `formEndpoint` に貼り付け → commit & push
3. 以降、両フォームは**ページ遷移なし**で送信され、完了メッセージが表示されます

> `formEndpoint` が空の間は、送信ボタンでメール下書き（mailto）が開くフォールバックになります。
> 迷惑メール対策や自動返信は Formspree 側の設定で調整できます。

---

## 🎨 デザインの調整ポイント

- **ブランドカラー / タイポ / 余白**：すべて [`src/styles/global.css`](src/styles/global.css) の `:root` で一元管理
  - `--shu`（朱・体験の熱量）/ `--ai`（藍墨・信頼）/ `--paper`（和紙の地色）
- **ジャンルのアクセント色**：[`src/content.config.ts`](src/content.config.ts) の `CATEGORIES`
- **サイト名・SNS・連絡先**：[`src/data/site.ts`](src/data/site.ts)

---

## 🖼 SNSシェア画像（OGP）は自動生成

記事・店舗LPごとに、タイトル入りのブランドOGP画像（PNG 1200×630）を**ビルド時に自動生成**します
（[`src/pages/og/[...route].ts`](src/pages/og/%5B...route%5D.ts)）。

- アイキャッチ（`cover`）がある記事 → その写真がシェア画像に
- `cover` が無い記事・店舗 → 明朝タイトル＋ジャンル＋IBATOCOのブランド画像を自動生成

日本語フォントは `src/assets/fonts/`（ビルド時のみ使用・ブラウザには配信されません）。

## 🛣 今後のロードマップ（企画書の育成計画）

- [ ] 実取材コンテンツの追加（モニター店舗10社 → 100社）
- [ ] Cloudflare Images 連携（画像最適化・帯域削減）
- [x] お問い合わせ/予約フォーム（Formspree対応・要エンドポイント設定）
- [x] 記事・店舗ごとのOGP画像 自動生成
- [ ] 自社予約システム（決済・CRM）への `/reserve/` 置き換え（Phase 3）
- [ ] Decap CMS の本番OAuth設定

---

技術スタック：**Astro 5** / TypeScript / Content Collections / `@astrojs/sitemap` / `@astrojs/rss` — 依存は最小限、ランタイムJSもごく僅か。表示は爆速です。
