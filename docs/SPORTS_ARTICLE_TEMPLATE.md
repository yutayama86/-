# IBATOCO SPORTS 記事テンプレート

ChatGPTで書いた原稿を、そのまま `src/content/news/<slug>.md` に置けば公開できる形。
**新しい仕組みは要らない。このfrontmatterを埋めるだけで、以下へ自動で反映される。**

- `/sports/<team>/` のチームページ（記事一覧・NEXT MATCH・LATEST RESULT・LATEST STORIES）
- `/sports/` のスポーツトップ（最新の記事）
- `/news/` と `/news/category/<category>/`
- ヘッダーのニュース／スポーツのプルダウン
- `sitemap.xml`
- 同じ市町村を扱う記事どうしの関連表示

記事URLの一覧を手で管理する場所は**どこにも無い**。`sportsTeam` を書けば繋がる。

---

## 1. 最重要：本文Markdownは表示されない

`/news/[slug].astro` は**frontmatterの構造化フィールドだけ**を描画する。
`---` の下に本文を書いても画面に出ない。文章は必ず下記フィールドへ振り分ける。

| 書きたい内容 | 入れるフィールド |
|---|---|
| 結論・記事の狙い | `conclusion` |
| 要点（箇条書き） | `keyPoints` |
| 何が起きた・発表されたか（事実） | `whatHappened` |
| 何が変わるか・注意点（事実） | `whatChanges` |
| 編集部の考察 | `editorialAnalysis` |
| 地域・経済への波及 | `regionalImpact` |
| 事業者が取れる行動（箇条書き） | `businessImplications` |
| 想定問答 | `faq` |

考察の段落は「（以下は発表内容ではなく、イバトコ編集部による考察です。）」で始め、
事実と意見を混ぜない。

## 2. 指示された項目名との対応

依頼時の呼び名と、実際のフィールド名は下記のとおり。
**既存20記事と同じスキーマを使うため、実際のフィールド名で書くこと。**

| 依頼時の呼び名 | 実際のフィールド名 |
|---|---|
| publishedAt | `pubDate` |
| updatedAt | `updatedDate` |
| team | `sportsTeam` |
| contentType | `sportsContentType` |
| matchDate / opponent / homeAway / competition / venue | `sportsMatch` の中 |
| areas | `municipalities`（市町村slug） |
| sources | `sourceUrls` |
| 本文 | 上の表のとおり各フィールドへ |

## 3. テンプレート（コピーして使う）

```yaml
---
title: "見出し"
description: "40〜180字。超過も不足もビルドが落ちる"
pubDate: 2026-09-06
updatedDate: 2026-09-06
author: "イバトコ編集部"
category: sports          # 下記5を参照
tags: ["水戸ホーリーホック", "J1リーグ"]
prefecture: "茨城県"
municipalities: [mito]    # 44slugのみ。県全体の話題は []

# ─ スポーツ用 ─────────────────────────────
sportsTeam: "mito-hollyhock"      # 下記4
sportsContentType: "match-result" # 下記4
sportsMatch:                      # 試合を扱う記事だけ。それ以外は丸ごと省く
  date: 2026-09-06
  opponent: "対戦相手名"
  homeAway: home                  # home / away / neutral
  kickoff: "14:00"                # 未定なら行ごと省く（「未定」と書かない）
  competition: "J1リーグ"
  venue: "水戸信用金庫スタジアム"
  score:                          # 終了した試合だけ。予定の記事では丸ごと省く
    own: 2
    opponent: 1
# ──────────────────────────────────────

featured: false
draft: true               # 承認まで true のまま
reviewed: false           # 公開時 true
noindex: false
ogImage: "/images/news/<slug>.svg"
ogImageAlt: "画像の説明（ogImageを書いたら必須）"

conclusion: "結論。1段落"
keyPoints:
  - "要点1"
  - "要点2"
whatHappened: "事実。何が起きたか"
whatChanges: "事実。何が変わるか"
editorialAnalysis: "（以下は発表内容ではなく、イバトコ編集部による考察です。）…"
regionalImpact: "地域への波及"
businessImplications:
  - "事業者が取れる行動1"
faq:
  - question: "想定問"
    answer: "答え"
sourceUrls:               # 公開時は1件以上必須
  - label: "発行元｜資料名"
    url: "https://…"
    accessedAt: 2026-09-06
relatedArticleUrls:       # 実在するページだけ。推測でURLを作らない
  - "/sports/mito-hollyhock/"
  - "/area/mito/"
---
```

## 4. sportsTeam と sportsContentType

```
sportsTeam:
  mito-hollyhock            水戸ホーリーホック（サッカー / J1リーグ）
  kashima-antlers           鹿島アントラーズ（サッカー / J1リーグ）
  ibaraki-robots            茨城ロボッツ（バスケットボール / B.LEAGUE B1）
  ibaraki-astroplanets      茨城アストロプラネッツ（野球 / ルートインBCリーグ）
  hitachi-hightech-cougars  日立ハイテク クーガーズ（バスケットボール / WJBL）

sportsContentType:
  match-result  試合結果。終わった試合の記録
  preview       プレビュー。次の試合の見どころ
  home-guide    観戦ガイド。会場での過ごし方・行き方・周辺
  away-guide    遠征ガイド。県外から来る人／県外へ行く人へ
  news          クラブと地域の動き
  column        編集部の視点
```

チームページの一覧は次の5つに束ねて表示する。0件の束は出ない。

```
試合結果 / プレビュー / 観戦・ホームガイド / アウェイ遠征 / ニュース・コラム
```
（`news` と `column` は「ニュース・コラム」にまとまる）

## 5. category の選び方

`category` はサイト全体のニュース分類で、`sportsContentType` とは別物。
スポーツの話題なら `sports` を使う。観光文脈が主なら `tourism`、経済文脈が主なら `economy`。

```
government / tourism / economy / transport / sports / dx / startup / other
```

## 6. NEXT MATCH と LATEST RESULT の出かた

- `sportsMatch.date` が**今日以降**かつ `score` 無し → **NEXT MATCH** に出る
- `score` あり → 最新のものが **LATEST RESULT** に出る
- 該当が無ければ、その枠は**表示されない**（「準備中」とも書かない）

静的サイトなので、基準日は**ビルド時**。試合日を過ぎても再ビルドするまで表示は変わらない。
記事を追加すればビルドが走るので、通常はそこで切り替わる。

記事の無い試合を載せたいときだけ `src/data/sports.ts` の `SPORTS_MATCHES` に手で足す。
記事のある試合を両方に書くと二重管理になるので書かない（同じ日付・相手なら自動で1件にまとまる）。

## 7. 内部リンク

`relatedArticleUrls` には**実在するページだけ**。存在しないURLを推測で作らない。
確実に存在するもの：

- `/area/<44slug>/` … 全44市町村
- `/sports/` `/sports/<team>/` … チーム5件
- `/news/` `/news/category/<key>/` … 記事のあるカテゴリのみ
- `/umi/` `/kawa/` `/yama/` `/koen/` `/hanabi/` `/hana/` `/matsuri/` `/kouyou/`
  `/odekake/` `/eat/` `/michinoeki/` `/sauna-play/` `/stay/` `/life/` `/beauty/` `/company/`

`municipalities` を書けば、チームページの「この街のニュース」や
市町村ページとの関連表示に**自動で載る**ので、手動リンクは最小限でよい。

チームごとの主な市町村：

- 水戸ホーリーホック … `mito` `hitachinaka` `kasama` `naka` `omitama` ほか18市町村
- 鹿島アントラーズ … `kashima` `itako` `kamisu` `namegata` `hokota`
- 茨城ロボッツ … `mito`（ホームタウン）
- 茨城アストロプラネッツ … `mito` `hitachi` `tsuchiura` ほか14市町村
- 日立ハイテク クーガーズ … `hitachinaka`

## 8. 守ること

- 未確認の日程・結果・順位を書かない。分からない項目は**行ごと省く**（「未定」と書かない）
- クラブ公式ロゴ、リーグのロゴ、選手写真、試合写真は**利用許諾の確認なしに使わない**。
  OG画像は `public/images/news/<slug>.svg` にイバトコ独自のグラフィックで作る
- 「地域No.1」「本物だけ」「必ず集客」など根拠のない断定を使わない
- 既存URLを変えない
- `draft: true` のまま置き、**公開の承認があってから** `draft: false` / `reviewed: true` にする

## 9. 追加したあとの確認

```bash
npx astro check
```

```bash
npm run audit:site
```

`sportsContentType` や `sportsMatch` を書いたのに `sportsTeam` が無いと、
ビルドがエラーで止まる（チームページに出ないまま気づけない事故を防ぐため）。
