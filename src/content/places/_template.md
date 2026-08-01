---
# ▼▼ 店舗・企業LP（ペライチ）のテンプレート（_始まりなので公開されません）▼▼
# 使い方：このファイルを src/content/places/ 内にコピーし、ファイル名＝店舗ID（英数字ハイフン）に
#   例）src/content/places/mito-cafe-hoge.md  → 公開URLは /place/mito-cafe-hoge/
# ------------------------------------------------------------------

name: "店舗・企業名"
kana: "ROMAJI"            # 英字表記（任意・装飾用）
category: eat             # eat / life / sauna-play / beauty / company
tagline: "ひとことキャッチ（例：筑波山の湧き水で炊く、澄んだ地鶏清湯。）"
description: "検索・SNS用の説明文（80〜120文字）。"
cover: ""                # メインビジュアル画像URL
recommend: "編集部の観察。事実と印象を分け、確認できた範囲で2〜3文。"
area: "つくば市"
address: "茨城県つくば市○○ X-XX-X"
access: "つくばエクスプレス『つくば駅』から車で8分"
hours: "11:00–15:00 / 18:00–21:00"
holiday: "月曜"
tel: "029-XXX-XXXX"
budget: "¥900–1,500"
website: ""              # 公式サイトURL（任意）
instagram: ""            # InstagramのURL（任意）
map: ""                  # GoogleマップのURL（任意）
menu:                    # メニュー・料金表（任意・何行でも）
  - { name: "看板メニュー", price: "¥950", note: "まずはこれ" }
  - { name: "特製", price: "¥1,350" }
reserveUrl: ""           # 取材先が公式に案内する予約URLだけ。空なら表示しません
plan: free               # 内部管理用。表示区分は下の disclosure で決まります
publishedAt: 2026-07-23
draft: true              # 公開準備が整うまで true
reviewed: false          # 公式情報・権利・開示を確認後に true。falseのままでは公開不可
verifiedAt: 2026-08-01   # 営業情報などを最後に照合した日
disclosure: editorial    # editorial / partner / pr
# disclosureNote: "継続支援契約のある事業者です。掲載内容は編集部が確認しています。"
sources:
  - label: "公式サイト"
    url: "https://example.com/"
    accessedAt: 2026-08-01
---

ここに店舗・企業の紹介本文をMarkdownで。ストーリーや“推せる理由”を書くと、LPの説得力が増します。
