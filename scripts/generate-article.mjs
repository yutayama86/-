#!/usr/bin/env node
/**
 * daily-growth の判断にもとづいて、記事の下書きを生成する。
 *
 * 生成物は公開候補（draft: false）としてPRに載せる。
 * mainへ直接書かないため、内容を人が確認してPRをマージしたときだけ公開される。
 *
 * 使い方:
 *   node scripts/generate-article.mjs --category shikumika --keyword "業務標準化 進め方" --prompt-output /tmp/prompt.md
 *   node scripts/generate-article.mjs --category shikumika --keyword "業務標準化 進め方" --response-file /tmp/response.md
 *   node scripts/generate-article.mjs --category shikumika --keyword "業務標準化 進め方"
 */

import { writeFileSync, existsSync, readFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import {
  BRAND_POSITION,
  BRAND_PRIME_DIRECTIVE,
  STATIC_LINK_TARGETS,
  findDisallowedInternalLinks,
  findLegacyTerms,
  findLegacyTermsInPrompt,
  referenceArticles,
} from './lib/brand-guard.mjs';

// モデル名はGitHub Actionsの変数で更新できるようにし、コード変更を不要にする。
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';
const KNOWLEDGE_DIR = 'src/content/knowledge';

// src/data/taxonomy.ts の primaryService と揃える。
const RELATED_SERVICE = { shikumika: 'ai-dx', ai: 'ai-dx', web: 'web', marketing: 'web', sns: 'sns' };
const CATEGORY_FOCUS = {
  shikumika: '属人化・社長依存を減らし、成果が再現できる事業運営',
  ai: 'AIを業務フローへ組み込み、人の判断と承認を残す',
  web: 'Webサイトを見込み客に判断材料を届け続ける営業資産にする',
  marketing: '紹介や個人営業に依存せず、問い合わせ・商談までを積み上げる',
  sns: '発信を担当者のセンスに依存させず、企画から改善まで回す',
};
const CATEGORY_KEYWORD = {
  shikumika: '仕組み化 中小企業',
  ai: 'AI 業務フロー',
  web: 'Web 営業資産',
  marketing: '営業 仕組み化',
  sns: '発信 仕組み化',
};

function arg(name) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : null;
}

const contextPath = arg('context');
const allowUnplanned = process.argv.includes('--allow-unplanned');
const category = arg('category');
const keyword = arg('keyword');
const slug = arg('slug') ?? (keyword ? slugify(keyword) : null);
const promptOutput = arg('prompt-output');
const responseFile = arg('response-file');
const publishedAt = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Tokyo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).format(new Date());

if (!category || !keyword || !slug) {
  console.error('使い方: node scripts/generate-article.mjs --category <id> --keyword "<キーワード>" [--slug <slug>]');
  process.exit(1);
}

function slugify(text) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 60) || `article-${Date.now()}`;
}

/*
  日次処理で「既存ページの改善」が選ばれた日に、別テーマの記事を作らないためのガード。
  daily-growth が書き出した判断（--context）で target_type=new_article のときだけ生成する。
  手動で試すときだけ --allow-unplanned を付ける。
*/
if (contextPath) {
  if (!existsSync(contextPath)) {
    console.error(`判断ファイルが見つかりません: ${contextPath}`);
    process.exit(1);
  }
  const { target } = JSON.parse(readFileSync(contextPath, 'utf-8'));
  if (target?.target_type !== 'new_article') {
    console.error(
      `今日の投資先は「${target?.target_type}（${target?.target_path || target?.action_type}）」です。新規記事は作りません。`
    );
    process.exit(1);
  }
  if (target.target_slug && target.target_slug !== slug) {
    console.error(`選定された記事（${target.target_slug}）と指定されたslug（${slug}）が一致しません。`);
    process.exit(1);
  }
} else if (!allowUnplanned) {
  console.error('--context <判断ファイル> が必要です。計測の判断を経ずに記事を作らない運用にしています。');
  console.error('（手動で試す場合のみ --allow-unplanned を付けてください）');
  process.exit(1);
}

const outPath = join(KNOWLEDGE_DIR, `${slug}.md`);
if (existsSync(outPath)) {
  console.error(`既に存在します: ${outPath}`);
  process.exit(1);
}

/** 内部リンクに使える既存記事。旧文脈を含む記事は参照させない。 */
function existingArticles() {
  return referenceArticles(KNOWLEDGE_DIR).map((a) => `- ${a.title} → ${a.path}`);
}

const prompt = `# 最上位制約（他のどの指示よりも優先する）
${BRAND_PRIME_DIRECTIVE}

あなたは、シクミベースの商談につながる実務記事を書きます。

## シクミベースについて
- ${BRAND_POSITION}
- 山野辺雄太が個人で運営する事業ブランドです。法人ではありません。記事中では事業名の「シクミベース」を使います。
- 「株式会社シクミベース」「代表取締役」という表記は絶対に使わないでください。
- 特定の業界に限定した商品・固定価格・パッケージは提供していません。価格、期間、回数、件数を記事内で約束しないでください。
- 売上、受注数、SEO順位は保証しません。

## 今回書く記事
- カテゴリ: ${category}（${CATEGORY_FOCUS[category] ?? '中小企業・地域企業の仕組み化'}）
- 主軸キーワード: ${keyword}
- 想定読者: 社長や特定の担当者に仕事・判断・顧客対応が集中し、成果が人に依存している中小企業・地域企業の経営者、責任者
- 業種は特定しないでください。例を出す場合は、特定業界の専門業務ではなく、問い合わせ対応、営業、引き継ぎ、発信、社内手順など多くの会社に共通する業務で説明してください。

## 扱う論点（キーワードに関係するものを選ぶ）
属人化解消、社長依存からの脱却、営業の仕組み化、反響営業、業務標準化、発信の仕組み化、AIを業務フローへ組み込む、Webを営業資産化する、改善サイクル。
Web・SNS・AI・SEOは目的ではなく、仕組みを実装する手段として書いてください。「ツールを入れれば解決する」という構成にしないでください。

## 絶対に守ること
1. **実績や数値を捏造しない。** 検証できない実績、架空の顧客事例、架空の導入企業を書かない。
2. **外部統計、市場規模、成果率を書かない。** 自動生成時には出典内容を検証できないため、外部の数値やURLを新しく作らない。
3. **法務・税務・労務を断定しない。** 「専門家に確認してください」と書く。
4. 存在しない制度・サービス・機能・ページを書かない。
5. 「いかがでしたでしょうか」「本記事では〜解説していきます」のような定型表現を使わない。
6. キーワードを不自然に繰り返さない。
7. 「よくある」「多くの会社」など未検証の一般化を避け、「該当する場合」「確認すべき状態」と書く。
8. 「DX化で効率化できます」「慎重な検討が必要です」だけで段落を終えない。何を、誰が、どの条件で行うかまで書く。
9. 「防ぐ」「削減できる」「短縮できる」と効果を断定せず、「防止を目的にする」「確認しやすくする」「判断材料にする」と書く。
10. 特定のツール名や実装技術を、採用が決まった仕様として書かない。
11. 個人情報をAIへ無条件に渡さない。AIを使う工程では、権限・保存先・人の承認・例外時の戻し方を明記する。
12. 本文は空白を除いて2,200〜3,500文字を目安にし、同じ結論を言い換えて繰り返さない。
13. イバトコに触れる場合は、シクミベースが自ら運営する地域メディアの公開ケーススタディとして扱い、顧客事例・受注実績として書かない。成果数値は書かない。
14. 内部リンクは、下の「内部リンクに使えるページ」に載っているURLだけを使う。一覧にないURLを作らない。

## 記事の構成
次のH2をこの順番で必ず含めてください。見出しの「：」以降は記事テーマに合わせてよいですが、見出し名は省略しないでください。
- 冒頭で読者の状況に触れる（2〜3行）
- 「## 結論：〜」で先に答えを出す
- 「## 成果が人に依存する原因」で、判断基準が言語化されていない、情報が個人に分散している、完了条件がないなど、構造としての原因を書く
- 「## 最初に可視化すること」で、対象業務の担当者、入力、判断、完了条件、例外、記録場所を整理する
- 「## 仕組みにする手順」で、対象業務を1つに絞り、各手順の入力・担当・完了条件・例外時の処理を書く
- 「## 測る指標と見方」で、指標の定義と計算方法、集計単位、見直しのタイミングを書く。件数が少ない期間の率だけで判断しない。成果保証はしない
- 「## 人が判断すること・自動化しないこと」で、金額・契約・クレーム・個人情報・例外対応など、人が確認すべき境界を書く
- 「## 着手に向いている状態・先に別課題へ取り組む状態」で、導入判断を具体的な状態で分ける
- 「## まとめ」で箇条書き
- 本文中に内部リンクを3つ以上（既存記事を2つ以上、支援ページまたは相談窓口を1つ以上）

## 内部リンクに使えるページ
### 既存記事
${existingArticles().join('\n') || '（まだありません）'}

### 支援・事例・相談
${STATIC_LINK_TARGETS.map((t) => `- ${t.label} → ${t.path}`).join('\n')}

記事末尾では、読者の状況に合う支援ページ（/service/web/、/service/sns/、/service/ai-dx/ のいずれか）と、相談窓口 /contact/ を案内してください。無理に売り込まないでください。

## 出力形式
以下のfrontmatterから始まるMarkdownだけを出力してください。説明文は不要です。

---
title: （60文字以内）
description: （60〜140文字）
category: ${category}
intent: （この記事が答える検索意図を1文で）
primaryKeyword: ${keyword}
keywords:
  - （関連キーワード）
publishedAt: ${publishedAt}
relatedServices:
  - ${RELATED_SERVICE[category] ?? 'ai-dx'}
firstParty: false
generated: true
draft: false
---

（本文）`;

// 参考記事の追加や文言変更で旧文脈が再流入していないかを、送信前に確認する。
const promptLegacy = findLegacyTermsInPrompt(prompt);
if (promptLegacy.length > 0) {
  console.error(`生成プロンプトに旧リフォーム特化文脈が含まれるため中止します: ${promptLegacy.join('、')}`);
  process.exit(1);
}

if (promptOutput) {
  mkdirSync(dirname(promptOutput), { recursive: true });
  writeFileSync(promptOutput, `${prompt}\n`, 'utf-8');
  console.log(`記事生成用プロンプトを作成しました: ${promptOutput}`);
  process.exit(0);
}

let markdown;

if (responseFile) {
  if (!existsSync(responseFile)) {
    console.error(`AIの応答ファイルが見つかりません: ${responseFile}`);
    process.exit(1);
  }
  markdown = readFileSync(responseFile, 'utf-8').trim();
} else {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('--response-file または ANTHROPIC_API_KEY が必要です。');
    process.exit(1);
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 8000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    console.error(`記事生成に失敗しました: ${response.status} ${await response.text()}`);
    process.exit(1);
  }

  const result = await response.json();
  markdown = result.content.map((block) => block.text ?? '').join('').trim();
}

// コードフェンスで包まれて返ってきた場合に外す
markdown = markdown.replace(/^```(?:markdown|md)?\n/, '').replace(/\n```$/, '');

if (!markdown.startsWith('---')) {
  console.error('frontmatter で始まっていないため保存を中止します。');
  process.exit(1);
}

const frontmatterMatch = markdown.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
if (!frontmatterMatch) {
  console.error('frontmatter の終端が見つからないため保存を中止します。');
  process.exit(1);
}

const modelFrontmatter = frontmatterMatch[1];
const body = markdown.slice(frontmatterMatch[0].length).trim();
if (body.replace(/\s/g, '').length < 2200) {
  console.error('記事本文が2,200文字未満のため保存を中止します。');
  process.exit(1);
}

const field = (name) => {
  const value = modelFrontmatter.match(new RegExp(`^${name}:\\s*(.+)$`, 'm'))?.[1]?.trim() ?? '';
  return value.replace(/^['"]|['"]$/g, '').trim();
};

const compact = (value) => value.replace(/\s+/g, ' ').trim();
const title = compact(field('title') || `${keyword}｜人に依存しない仕組みにする手順`).slice(0, 60);
let description = compact(field('description'));
const fallbackDescription = `中小企業・地域企業が「${keyword}」に取り組むとき、どの業務から可視化し、誰が何を判断し、何を測って改善するかを実務の手順で整理します。`;
if (description.length < 60) description = fallbackDescription;
description = description.slice(0, 140);
const intent = compact(
  field('intent') || `${keyword}を、特定の人に依存しない仕組みとして進める手順と判断基準を知りたい`
);
const relatedService = RELATED_SERVICE[category] ?? 'ai-dx';
const yaml = (value) => JSON.stringify(value);

// スキーマに関わる値はモデルへ委ねず、検証済みの入力から毎回組み直す。
markdown = `---
title: ${yaml(title)}
description: ${yaml(description)}
category: ${category}
intent: ${yaml(intent)}
primaryKeyword: ${yaml(keyword)}
keywords:
  - ${yaml(keyword)}
  - ${yaml(`${keyword} 進め方`)}
  - ${yaml(CATEGORY_KEYWORD[category] ?? '仕組み化 中小企業')}
publishedAt: ${publishedAt}
relatedServices:
  - ${relatedService}
firstParty: false
generated: true
draft: false
---

${body}`;

// 品質ゲートより前に止める。frontmatter・本文・CTA・内部リンクをまとめて検査する。
const legacy = findLegacyTerms(markdown);
if (legacy.length > 0) {
  console.error(`旧リフォーム特化文脈が含まれるため保存を中止します: ${legacy.join('、')}`);
  process.exit(1);
}

const disallowedLinks = findDisallowedInternalLinks(body, KNOWLEDGE_DIR);
if (disallowedLinks.length > 0) {
  console.error(`存在しない、または参照を許可していない内部リンクがあるため保存を中止します: ${disallowedLinks.join('、')}`);
  process.exit(1);
}

writeFileSync(outPath, `${markdown}\n`, 'utf-8');
console.log(`公開候補を作成しました: ${outPath}`);
console.log('自動作成されたPRで内容を確認し、マージすると公開されます。');
