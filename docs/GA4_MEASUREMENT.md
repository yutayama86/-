# GA4計測の設計と、管理画面側でやること

対象プロパティ：`G-2DNYX7CSK6`（`PUBLIC_GA_ID` があればそちらが優先）

コードで完結している部分と、GA4の管理画面でしか設定できない部分を分けて書く。
**コード側は実装・検証済み。管理画面側は未実施。**

---

## 1. コードでやっていること

実装は `src/layouts/BrandBase.astro` のインラインスクリプトと `src/data/analytics.ts`。

### 1-1. 計測しない条件（gtagを読み込まない）

次のどちらかに当たると、`gtag.js` のタグを**そもそもDOMに挿入しない**。
GA4へは1リクエストも飛ばない。

| 条件 | 目的 |
|---|---|
| ホスト名が `ibatoco.jp` / `www.ibatoco.jp` 以外 | localhost・`astro preview`・プレビュー環境の除外 |
| `localStorage.ibatoco_ga_optout === '1'` | 運営者自身のアクセス除外 |

以前は「本番ビルドかどうか」だけで判定していたため、`npm run preview` で
本番ビルドをlocalhostに配信すると計測されてしまっていた。ホスト名で見るように変えた。

### 1-2. 運営者の自己除外のしかた

除外したいブラウザで、一度だけ次を開く。

```
https://ibatoco.jp/?ga-optout=1
```

`localStorage` にフラグが入り、以降そのブラウザからは計測されない。解除は `?ga-optout=0`。

**この方式を選んだ理由**：IPアドレスやUser-Agentからの推測除外は、
同じ回線・同じ端末構成の第三者を巻き込む。localStorageは自分で明示的に
セットしたブラウザだけに効くので、第三者を誤除外しない。

**注意**：ブラウザ・端末ごとに設定が必要。シークレットウィンドウでは効かない。
サイトデータを消すと解除される。

### 1-3. 流入元の分類

全ページのイベントに、次の2つのパラメータが載る。

| パラメータ | 値 |
|---|---|
| `traffic_kind` | `ai_referral` / `search` / `other_referral` / `direct` |
| `ai_source` | `ai_referral` のときだけ。`chatgpt` `claude` `perplexity` `gemini` `copilot` など |

判定は referrer のホスト名と `utm_source` の両方を見る（ChatGPTは
`?utm_source=chatgpt.com` を付けてくることがあるため、そちらを優先）。

**AIに数えないもの（意図的）**

- **referrerが無い流入（Direct）**：AI経由か直接入力かを区別する材料が無い。`direct` のまま。
- **`google.com` / `bing.com` / `yahoo.co.jp` など検索エンジン**：AI Overviews や
  Bingのチャット結果からの流入も、通常の検索と同じrefererで届く。区別できないので `search`。
- **GA4側の `(not set)`**：GA4が判定できなかったもの。こちらでも判定できない。

対象ホスト一覧は `src/data/analytics.ts` の `AI_REFERRAL_HOSTS`。追加はそこへ1行足す。

### 1-4. CV（コンバージョン）

`src/lib/forms.ts`。フォーム送信先が **2xx を返したときだけ** `generate_lead` を送る。
ボタンのクリックや、送信に失敗したときは送らない（実際に届いた件数と一致させるため）。

| パラメータ | 内容 |
|---|---|
| `form_id` | `contact` |
| `form_subject` | 「ご用件」の選択値 |
| `page_path` | 送信元のパス |

送信先は Formspree（`https://formspree.io/f/mykrvjkg`）。本番で設定済み。

---

## 2. 管理画面でやること（コードからは設定できない）

### 2-1. カスタムディメンションの登録 ※これをやるまでレポートに出ない

管理 → データの表示 → カスタム定義 → カスタムディメンションを作成

| ディメンション名 | 範囲 | イベントパラメータ |
|---|---|---|
| 流入区分 | イベント | `traffic_kind` |
| AI流入元 | イベント | `ai_source` |
| フォーム種別 | イベント | `form_id` |
| 問い合わせ用件 | イベント | `form_subject` |

登録した時点より後のデータにしか適用されない（遡及しない）。

### 2-2. `generate_lead` をキーイベントに設定

管理 → データの表示 → イベント → `generate_lead` の「キーイベントとしてマークを付ける」

イベントが1回も発生していないと一覧に出ないので、
先に `?ga-optout=0` の状態で本番のフォームからテスト送信を1件行うか、
イベントが発生してから設定する。

### 2-3. 参照元除外リストに `localhost` を追加

管理 → データ ストリーム → 該当ストリーム → タグ設定を行う →
不要な参照のリスト → 参照ドメインに `localhost` を追加。

`localhost:3000 / referral` は、ローカルで動かしている別のツールのページから
ibatoco.jp へのリンクを踏むと発生する。1-1の除外は「イバトコ側がlocalhostで
表示されたとき」に効くもので、**参照元がlocalhostのケースは別**なのでこちらで塞ぐ。

### 2-4. AI Referral を独立して見る

カスタムディメンション登録後、次のどちらでも見られる。

- **探索**：ディメンションに「流入区分」「AI流入元」、指標にセッション数・エンゲージメント率
- **カスタムチャネルグループ**：管理 → データの表示 → チャネルグループ →
  新しいチャネルグループ。「AI Referral」を作り、条件を
  `参照元` が `chatgpt.com`, `chat.openai.com`, `claude.ai`, `perplexity.ai`,
  `gemini.google.com`, `copilot.microsoft.com` のいずれかに一致、で定義する。
  既定のチャネルグループより**上**に置かないと Referral に吸われる。

---

## 3. `(not set)` について

8/20の実測で `(not set)` が16件出ている件。**コード側では特定できない**ので、
推測で塞がず、管理画面で次を順に確認する。

1. **計測期間**：GA4の参照元は確定まで24〜48時間かかる。当日のレポートでは
   `(not set)` が多めに出る。数日後に同じ日付を見直す。
2. **ディメンションの組み合わせ**：「ユーザーの最初の参照元」など
   ユーザースコープの項目を、セッションスコープの指標と組み合わせると
   `(not set)` が出やすい。「セッションの参照元 / メディア」で見直す。
3. **タグ設置前のセッション**：計測開始前から続いているセッションは属性が付かない。
4. **上記で消えない場合**：DebugView でイベントに `page_referrer` が
   載っているかを確認する。

**やってはいけないこと**：`(not set)` や Direct を「たぶんAI経由」として
AI Referral に振り分けること。実態と乖離し、施策判断を誤らせる。

---

## 4. SEO改善履歴との突き合わせ

別系統。GA4ではなく Search Console を見る。

- 履歴データ：`src/data/seo-changes.ts`（変更日 / URL / 狙いクエリ / 変更内容 / commit）
- 配信：`https://ibatoco.jp/seo-changes.json`（robots非許可・sitemap未収録）
- 集計：`docs/seo-change-tracking.gs` を Apps Script に貼り、
  「サービス」から **Search Console API** を追加してから `updateSeoChangeLog` を実行

シートに書き出される列：

```
変更日 / URL / 種類 / 変更内容 / 狙いクエリ
変更前(7日) クリック・表示・CTR・掲載順位
変更後(7日) クリック・表示・CTR・掲載順位
変更後(28日) クリック・表示・CTR・掲載順位
判定(7日) / 判定(28日) / 備考 / commit
```

**指標はこのリポジトリに保存しない。** 変更日を起点に毎回GSCから取り直すので、
写し間違いも古い値の置き去りも起きない。判定のしきい値は
`src/data/seo-changes.ts` の `SEO_VERDICT_RULES`。

履歴の追加：

```bash
npm run seo:log -- --url /news/foo/ --kind on-page --change "titleを改善" --queries "茨城 道の駅"
```

過去の変更を後から記録するときは `--date 2026-08-21 --commit 2533320` を付ける。
日付がずれると比較期間ごとずれるので、**必ず本番反映日**を入れる。
URLは `/news/*` のように前方一致でも指定できる（複数ページに同時に効く変更用）。
