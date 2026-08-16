---
name: news-post
description: イバトコの茨城ニュース解説記事（/news/）を作成・検証・公開する。ニュース記事の追加依頼、ニュース原稿の投稿、記事の下書き作成、公開処理を頼まれたときに使う。
---

# イバトコ ニュース記事の作成・公開

`/news/` の茨城ニュース解説を、既存実装のまま追加するための手順書。
**新しいライブラリ・独自実装・新コンポーネントは追加しない。**

## 0. 最初に読む前提

- コードベースの再調査は不要。必要な仕様はこのファイルに集約してある。
- 実装が変わっていると疑う理由があるときだけ `src/content.config.ts` を確認する。

## 1. 依頼の受け取り方（最小フォーマット）

ユーザーからは **事実と出典だけ** 受け取れば足りる。本文プロセは不要。

```
見出し級の事実を数行 / 数値 / 日付
出典: URL（1本以上）
市町村: 水戸市  カテゴリ: 観光
```

長い本文プロセを渡された場合も、**そのまま本文には使わない**（下記2の理由）。
情報を落とさずに構造化フィールドへ移送する。

## 2. 最重要：本文Markdownは描画されない

`src/pages/news/[slug].astro` は **frontmatterの構造化フィールドだけ**を描画する。
`---` の下に本文を書いても表示されない。プロセは必ず次へ振り分ける。

| 内容 | 移送先フィールド |
|---|---|
| 要約・結論・記事の狙い | `conclusion` |
| 押さえる要点（箇条書き） | `keyPoints` |
| 何が発表・確定したか（事実） | `whatHappened` |
| 何が変わるか・注意点（事実） | `whatChanges` |
| 編集部の考察・解釈 | `editorialAnalysis` |
| 地域・周遊・経済への波及 | `regionalImpact` |
| 事業者が取れる行動（箇条書き） | `businessImplications` |
| 想定問答 | `faq` |

考察を書く段落は「（以下は発表内容ではなく、イバトコ編集部による考察です。）」で始め、
**事実と意見を混ぜない**。

## 3. ファイルと命名

- 記事: `src/content/news/<slug>.md`
- OG画像: `public/images/news/<slug>.svg`（記事slugと揃える）
- URL: `/news/<slug>/`（ファイル名がそのままslug。既存URLは変更しない）
- slugは英小文字・数字・ハイフン。年号を含めると重複しにくい。

## 4. frontmatter 仕様（`src/content.config.ts` の news schema）

必須・型は下記のとおり。**過不足があるとビルドが落ちる。**

```yaml
title: "…"                    # 必須
description: "…"              # 必須 40〜180字。超過も不足も検証エラー
pubDate: 2026-08-16           # 必須
updatedDate: 2026-08-16       # 任意
author: "イバトコ編集部"
category: tourism             # 必須。下記5のキーのみ
tags: ["…"]
prefecture: "茨城県"
municipalities: [mito]        # 下記6のslugのみ。該当なしは []
featured: true
draft: true                   # 既定 true。承認まで true のまま
reviewed: false               # 公開時 true（未確認のまま公開不可）
sample: false                 # true なら noindex: true が必須
noindex: false
ogImage: "/images/news/<slug>.svg"
ogImageAlt: "…"               # ogImage を指定したら必須
conclusion: "…"               # 必須
keyPoints: ["…"]              # 必須・1件以上
whatHappened: "…"             # 必須
whatChanges: "…"              # 必須
editorialAnalysis: "…"        # 必須
regionalImpact: "…"           # 必須
businessImplications: ["…"]   # 必須・1件以上
faq:
  - question: "…"
    answer: "…"
sourceUrls:                   # 公開時は1件以上必須。文字列ではなくオブジェクト
  - label: "発行元｜資料名"
    url: "https://…"
    accessedAt: 2026-08-16
relatedArticleUrls:           # "/" 始まりのみ。実在ページだけ
  - "/area/mito/"
place:                        # 任意。newsではインライン（参照ではない）
  name: "…"
  address: "…"
  url: "https://…"
event:                        # 任意
  name: "…"
  startDate: 2026-10-03
```

`accessGuide` も任意で使える（`location` / `homeUseStarts` / `parking[]` / `publicTransport[]` / `returnTrip` が各必須）。

スキーマ側の検証ルール：
- `draft: false` なら `reviewed: true` が必要
- `draft: false` なら `sourceUrls` が1件以上必要
- `sample: true` なら `noindex: true` が必要
- `ogImage` があれば `ogImageAlt` が必要

## 5. カテゴリ対応表

日本語で指定されたら、必ずキーへ変換する（enum外はビルドエラー）。

| 指定されがちな語 | キー |
|---|---|
| 自治体・行政・県政 | `government` |
| 観光・おでかけ・インバウンド | `tourism` |
| 地域経済・産業・企業 | `economy` |
| 交通・空港・鉄道・道路 | `transport` |
| スポーツ・Jリーグ | `sports` |
| DX・デジタル | `dx` |
| スタートアップ・創業 | `startup` |
| 上記に収まらない | `other` |

「地方創生」は独立キーではない。観光文脈なら `tourism`、経済文脈なら `economy` を選ぶ。

## 6. 市町村slug（44件）

`municipalities` には市町村名ではなく **slug** を入れる。県全体の話題は `[]`。

```
mito=水戸市 hitachi=日立市 tsuchiura=土浦市 koga=古河市 ishioka=石岡市
yuki=結城市 ryugasaki=龍ケ崎市 shimotsuma=下妻市 joso=常総市 hitachiota=常陸太田市
takahagi=高萩市 kitaibaraki=北茨城市 kasama=笠間市 toride=取手市 ushiku=牛久市
tsukuba=つくば市 hitachinaka=ひたちなか市 kashima=鹿嶋市 itako=潮来市 moriya=守谷市
hitachiomiya=常陸大宮市 naka=那珂市 chikusei=筑西市 bando=坂東市 inashiki=稲敷市
kasumigaura=かすみがうら市 sakuragawa=桜川市 namegata=行方市 hokota=鉾田市
tsukubamirai=つくばみらい市 omitama=小美玉市 ibaraki-machi=茨城町 oarai=大洗町
shirosato=城里町 tokai=東海村 daigo=大子町 miho=美浦村 ami=阿見町 kawachi=河内町
yachiyo=八千代町 goka=五霞町 sakai=境町 tone=利根町 kamisu=神栖市
```

## 7. 事実確認（品質の要）

- **公式＋報道の2系統**で照合する。公式PDFが抽出不能なことがあるため、報道（日経・茨城新聞等）で裏を取る。
- 裏が取れなかった数値は**書かないか、「○○の資料によれば」と出典に帰属**させ、独立確認していない旨をユーザーへ申し送る。
- **未確定案件は「予定」「見込み」を保持**し、確定表現に変えない（開始時期・便数・制度内容など）。
- 数値・固有名詞・日付は出典どおりに書く。丸めない。
- 出典間で食い違う数値（例：ホームタウン市町村数）は**書かない**。
- 架空の写真・人物・口コミ・取材履歴・SNS URL・実績・順位表現を作らない。
- `地域No.1` `本物だけ` `必ず集客` `爆発力` `全国トップクラス` は使わない（audit で検出される）。
- 広告・提供・招待があるなら Editorial と混同させない（既定は編集記事）。

## 8. 内部リンク

- `relatedArticleUrls` には**実在するページだけ**。推測でURLを作らない。
- 実在確認：ビルド後に `dist/<path>/index.html` の有無を見る（または audit のリンク切れ検出に任せる）。
- 記事ページで表示されるリンク文言は `src/pages/news/[slug].astro` の `internalLinkLabels` に定義する。
  **未登録のURLは「関連情報」という汎用ラベルになる**ので、ニュース同士を相互リンクしたら追記する。
- 市町村ページは `/area/<slug>/` が44件すべて存在する。

## 9. OG画像（イバトコ独自グラフィックのみ）

- 第三者の写真・ロゴ・エンブレム・キャラクター・公式デザインは**使わない**。
  固有名（IBARAKI PASSPORT等）は通常テキストとして書くのは可。
- `public/images/news/<slug>.svg` に 1200×630 で作る。
- ブランド配色：背景 `#f6f2e9` / 枠線 `#d9d0c0` / 濃紺 `#172b35` / 藍 `#315c68` / 朱 `#a63f32` / 灰茶 `#75695a`
- 書体：見出し `'Shippori Mincho', serif` ／ 英字・注記 `'Source Sans 3', sans-serif`
- 構成：左上にキッカー `IBATOCO ・ 茨城ニュース解説` → 記事内容を表す簡素な図（点線・円・矢印など）→ 大見出し → サブコピー → 右下に注記
- **落とし穴**：XMLコメント内に `--`（連続ハイフン）を書くとSVGが壊れて途中までしか描画されない。コメントに矢印表記を使わない。
- 作成後は必ずブラウザで表示確認する（ビルドは静的SVGを検証しない）。

## 10. 検証（手作業のgrepは不要）

```bash
npm run audit:site
```

`astro build` + `scripts/quality-audit.mjs` が走り、次を自動検出する：
リンク切れ / h1重複 / description・canonical不足 / JSON-LD構文エラー / img alt漏れ / 禁止語

型検査も通す：

```bash
npx astro check
```

加えて `draft: true` の記事は**ページが生成されないこと**を確認する
（`dist/news/<slug>/index.html` が無く、`dist/news/index.html` にも載らない）。

## 11. 下書きと公開の判断

- 記事は**必ず `draft: true` / `reviewed: false` で作る**。この状態ではページが生成されず、一覧にも出ない。
- **ユーザーが明示的に承認したときだけ**（「公開して」「承認済み」等）`draft: false` / `reviewed: true` に変更する。
- 承認は都度必要。前回の承認を次の記事に流用しない。
- 未承認のまま `git push` しない。

## 12. 公開手順

```bash
git fetch origin -q                 # origin/main と一致しているか確認
npx astro check                     # 0 errors
npm run audit:site                  # 検証を通す
git add <記事.md> <OG画像> [変更したページ]
git commit                          # 変更理由を日本語で。Co-Authored-By を付ける
git push origin main                # Cloudflare が自動デプロイ
```

差分があるときは `git rebase origin/main` してから進める。
`.github/workflows/` を含む変更はPATのスコープ不足でpushが弾かれる（内容だけのpushは通る）。

## 13. 本番反映の確認

デプロイ反映には数分かかる。反映直後は**旧版がキャッシュで返る**ため、
HTTP 200 だけで判断せず「新版の中身」を条件に確認する。

```bash
curl -s https://ibatoco.jp/news/<slug>/ | grep -o '<title>[^<]*</title>'
curl -s -o /dev/null -w "%{http_code}\n" https://ibatoco.jp/images/news/<slug>.svg
```

記事ページのHTTP 200・一覧掲載・OG画像200 を確認して報告する。
OG画像はHTMLより反映が遅れることがある。

CSSの反映を見るときは注意：Astroはスコープ付きCSS（`[data-astro-cid-…]`）を
HTMLへインライン出力するため、素のセレクタでgrepしても一致しない。

## 14. 報告

完了時は次を伝える：記事URL / 変更ファイル / 検証結果 / draft状態 /
裏取りできなかった数値の申し送り。
