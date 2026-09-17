#!/usr/bin/env node
/**
 * daily-growth が選んだ既存ページを、必要な箇所だけ改善する。
 *
 * 記事を全文作り直さない。AIには「置換する箇所」だけを返させ、
 * 元の本文に完全一致した場所しか書き換えない。
 *
 * 使い方:
 *   node scripts/improve-page.mjs --context ctx.json --prompt-output prompt.md
 *   node scripts/improve-page.mjs --context ctx.json --response-file response.md
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import {
  BRAND_POSITION,
  BRAND_PRIME_DIRECTIVE,
  STATIC_LINK_TARGETS,
  findDisallowedInternalLinks,
  findLegacyTerms,
  referenceArticles,
} from './lib/brand-guard.mjs';

const KNOWLEDGE_DIR = 'src/content/knowledge';

/** 改善タイプごとに、AIへ出させる変更の種類を固定する。 */
const ACTION_RULES = {
  title_description: {
    label: 'title と description の書き直し',
    instruction:
      '本文は変更しません。title（60文字以内）と description（60〜140文字）だけを、検索する人の状況と、この記事で得られる判断材料が伝わる表現に書き直してください。',
    allowMeta: true,
    allowEdits: false,
  },
  content_rewrite: {
    label: '不足している観点の追記・書き直し',
    instruction:
      '検索意図に対して不足している観点を、既存の構成を保ったまま追記または書き直してください。段落単位で最小限の置換にとどめ、記事全体を作り直さないでください。',
    allowMeta: false,
    allowEdits: true,
  },
  internal_links: {
    label: 'サイト内リンクの追加',
    instruction:
      '文脈が合う位置に、関連する既存記事へのMarkdownリンクを追加してください。リンクのためだけの不自然な一文を足さず、既存の文へ自然に組み込んでください。',
    allowMeta: false,
    allowEdits: true,
  },
  service_link: {
    label: '支援ページへの導線の追加',
    instruction:
      '記事の内容に合う支援ページへのMarkdownリンクを、読者の次の行動として自然な位置に追加してください。売り込みの表現は使わないでください。',
    allowMeta: false,
    allowEdits: true,
  },
  case_link: {
    label: '公開ケーススタディへの導線の追加',
    instruction:
      'シクミベース自身が運営するイバトコの公開ケーススタディ（/case/ibatoco/）へのリンクを、記事の主張の根拠として自然な位置に追加してください。顧客事例として書かないでください。',
    allowMeta: false,
    allowEdits: true,
  },
  cta: {
    label: '相談導線の見直し',
    instruction:
      '結論やまとめの直後など、読者が次の行動を考える位置に、相談導線（支援ページまたは /contact/ へのリンク）を置き直してください。煽らず、どんな状態の人が相談に向いているかを一文で示してください。',
    allowMeta: false,
    allowEdits: true,
  },
};

const LIMITS = {
  maxEdits: 6,
  minFindLength: 12,
  maxReplacedRatio: 0.4,
  minBodyRatio: 0.9,
  maxBodyRatio: 1.8,
};

function arg(name) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : null;
}

const contextPath = arg('context') ?? '.growth/target.json';
const promptOutput = arg('prompt-output');
const responseFile = arg('response-file');

if (!contextPath || !existsSync(contextPath)) {
  console.error('使い方: node scripts/improve-page.mjs --context <path> (--prompt-output <path> | --response-file <path>)');
  process.exit(1);
}

const context = JSON.parse(readFileSync(contextPath, 'utf-8'));
const { target, metrics } = context;

if (target.target_type !== 'existing_page') {
  console.error(`既存ページの改善ではないため終了します: target_type=${target.target_type}`);
  process.exit(1);
}
if (!target.editable || !target.target_file || !existsSync(target.target_file)) {
  console.error(`自動改善の対象外です: ${target.target_file || '(ファイル不明)'}`);
  process.exit(1);
}

const rule = ACTION_RULES[target.action_type];
if (!rule) {
  console.error(`未対応の改善タイプです: ${target.action_type}`);
  process.exit(1);
}

const original = readFileSync(target.target_file, 'utf-8');
const parsed = original.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
if (!parsed) {
  console.error(`frontmatter を読み取れません: ${target.target_file}`);
  process.exit(1);
}
const [, frontmatter, body] = parsed;

const field = (key) =>
  (frontmatter.match(new RegExp(`^${key}:\\s*(.*)$`, 'm'))?.[1] ?? '').trim().replace(/^['"]|['"]$/g, '');

/* --- プロンプトの作成 ------------------------------------------------- */

function metricsText() {
  const lines = [];
  const search = metrics?.search ?? null;
  const ga4 = metrics?.ga4 ?? null;

  if (search?.page) {
    lines.push(
      `- 検索（${search.period.start}〜${search.period.end}）: 表示${search.page.impressions}回 / クリック${search.page.clicks}回 / CTR ${(search.page.ctr * 100).toFixed(2)}% / 平均${search.page.position.toFixed(1)}位`
    );
  } else if (search?.totals) {
    lines.push(
      `- 検索（${search.period.start}〜${search.period.end}）: このページ単体の実績はまだ計測されていません（サイト全体で表示${search.totals.impressions}回）`
    );
  } else {
    lines.push('- 検索: データなし');
  }

  if (ga4?.page) {
    lines.push(`- サイト内（${ga4.period.start}〜${ga4.period.end}）: セッション${ga4.page.sessions} / 表示${ga4.page.views}`);
  }
  if (ga4?.pageEvents) {
    lines.push(`- このページのCTAクリック: ${ga4.pageEvents.cta_click ?? 0}件`);
  }
  if (ga4?.events) {
    lines.push(
      `- サイト全体の問い合わせファネル: CTA${ga4.events.cta_click} → フォーム開始${ga4.events.contact_form_start} → 送信完了${ga4.events.generate_lead}`
    );
  }
  if (ga4 && ga4.attributionAvailable === false) {
    lines.push('- 問い合わせの入口ページ: 取得できていません（LP帰属未確定。推測しないでください）');
  }

  return lines.join('\n');
}

const referenceList = referenceArticles(KNOWLEDGE_DIR)
  .filter((article) => article.path !== target.target_path)
  .map((article) => `- ${article.title} → ${article.path}`)
  .join('\n');

const prompt = `# 最上位制約（他のどの指示よりも優先する）
${BRAND_PRIME_DIRECTIVE}

あなたは、公開済みの記事を必要な箇所だけ改善する日本語BtoB編集者です。

## シクミベースについて
- ${BRAND_POSITION}
- 山野辺雄太が個人で運営する事業ブランドです。法人ではありません。「株式会社シクミベース」「代表取締役」は使いません。
- イバトコはシクミベースが自ら運営する地域メディアの公開ケーススタディです。顧客事例として書かないでください。

## 今回の改善対象
- URL: https://shikumi-base.com${target.target_path}
- 改善タイプ: ${target.action_type}（${rule.label}）
- この対象を選んだ理由: ${target.reason}
- 実施する内容: ${target.action}

## 実測値（この数値を書き換えたり、本文に成果として書いたりしないでください）
${metricsText()}

## 守ること
1. ${rule.instruction}
2. 検証できない実績、架空の顧客、外部統計、出典のない数値を追加しない。
3. 効果を断定しない（「防ぐ」ではなく「防止を目的にする」）。
4. 法務・税務・労務を断定しない。
5. 記事の主張や構成を大きく変えない。既存の見出しは消さない。
6. 内部リンクは、下の一覧にあるURLだけを使う。一覧にないURLを作らない。
7. 特定業界向けの商品・固定価格・パッケージを書かない。

## 内部リンクに使えるページ
### 既存記事
${referenceList || '（ほかに記事はありません）'}

### 支援・事例・相談
${STATIC_LINK_TARGETS.map((item) => `- ${item.label} → ${item.path}`).join('\n')}

## 現在のtitle / description
- title: ${field('title')}
- description: ${field('description')}

## 現在の本文（このテキストを基準に置換箇所を指定してください）
\`\`\`markdown
${body}
\`\`\`

## 出力形式
次の形のJSONだけを出力してください。説明文・コードフェンスは不要です。

${
  rule.allowMeta
    ? `{
  "summary": "何をなぜ変えたかを1文で",
  "title": "新しいtitle（60文字以内）",
  "description": "新しいdescription（60〜140文字）"
}`
    : `{
  "summary": "何をなぜ変えたかを1文で",
  "edits": [
    {
      "find": "本文に一度だけ現れる既存のテキスト（${LIMITS.minFindLength}文字以上・改行を含めてよい）",
      "replace": "置き換え後のテキスト"
    }
  ]
}`
}

${
  rule.allowMeta
    ? '本文は変更しないため、editsは出力しないでください。'
    : `- edits は最大${LIMITS.maxEdits}件までです。
- find は現在の本文と1文字も違わない文字列にしてください。見つからない場合は適用されません。
- 記事全体を1つのeditで置き換えないでください。変更が必要な段落だけを指定してください。`
}`;

if (promptOutput) {
  mkdirSync(dirname(promptOutput), { recursive: true });
  writeFileSync(promptOutput, `${prompt}\n`, 'utf-8');
  console.log(`改善用プロンプトを作成しました: ${promptOutput}`);
  console.log(`対象: ${target.target_file}（${target.action_type}）`);
  process.exit(0);
}

/* --- 応答の適用 ------------------------------------------------------- */

if (!responseFile || !existsSync(responseFile)) {
  console.error('--prompt-output か --response-file のどちらかが必要です。');
  process.exit(1);
}

const raw = readFileSync(responseFile, 'utf-8').trim();
const jsonText = raw
  .replace(/^```(?:json)?\s*/i, '')
  .replace(/```$/, '')
  .trim();

let result;
try {
  result = JSON.parse(jsonText);
} catch (error) {
  console.error(`AIの応答をJSONとして読み取れません: ${error.message}`);
  process.exit(1);
}

const fail = (message) => {
  console.error(message);
  process.exit(1);
};

const today = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Tokyo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).format(new Date());

let newFrontmatter = frontmatter;
let newBody = body;
const applied = [];

if (rule.allowMeta) {
  const title = String(result.title ?? '').replace(/\s+/g, ' ').trim();
  const description = String(result.description ?? '').replace(/\s+/g, ' ').trim();

  if (!title || title.length > 60) fail(`titleの長さが不正です（${title.length}文字 / 60以内）`);
  if (description.length < 60 || description.length > 140) {
    fail(`descriptionの長さが不正です（${description.length}文字 / 60〜140）`);
  }
  if (title === field('title') && description === field('description')) fail('titleもdescriptionも変わっていません');

  const quote = (value) => JSON.stringify(value);
  newFrontmatter = newFrontmatter
    .replace(/^title:\s*.*$/m, `title: ${quote(title)}`)
    .replace(/^description:\s*.*$/m, `description: ${quote(description)}`);
  applied.push(`title / description を更新`);
} else {
  const edits = Array.isArray(result.edits) ? result.edits : [];
  if (edits.length === 0) fail('editsが空です');
  if (edits.length > LIMITS.maxEdits) fail(`editsが多すぎます（${edits.length}件 / 最大${LIMITS.maxEdits}件）`);

  let replacedChars = 0;

  for (const [index, edit] of edits.entries()) {
    const find = String(edit?.find ?? '');
    const replace = String(edit?.replace ?? '');

    if (find.length < LIMITS.minFindLength) fail(`edits[${index}].find が短すぎます（${find.length}文字）`);
    if (find === replace) fail(`edits[${index}] は変更になっていません`);

    const occurrences = newBody.split(find).length - 1;
    if (occurrences === 0) fail(`edits[${index}].find が本文に見つかりません: ${find.slice(0, 40)}…`);
    if (occurrences > 1) fail(`edits[${index}].find が本文に${occurrences}箇所あり、置換先を特定できません`);

    newBody = newBody.replace(find, replace);
    replacedChars += find.length;
    applied.push(`置換${index + 1}: ${find.slice(0, 30).replace(/\n/g, ' ')}…`);
  }

  const ratio = replacedChars / body.length;
  if (ratio > LIMITS.maxReplacedRatio) {
    fail(`本文の${(ratio * 100).toFixed(0)}%を置換しようとしています。必要箇所だけの改善にしてください（上限${LIMITS.maxReplacedRatio * 100}%）`);
  }

  const lengthRatio = newBody.length / body.length;
  if (lengthRatio < LIMITS.minBodyRatio || lengthRatio > LIMITS.maxBodyRatio) {
    fail(`本文量の変化が大きすぎます（${(lengthRatio * 100).toFixed(0)}%）`);
  }

  // 既存の見出しを消していないか
  const headings = (text) => (text.match(/^##\s+.*$/gm) ?? []).map((line) => line.trim());
  const before = headings(body);
  const after = headings(newBody);
  const removed = before.filter((heading) => !after.includes(heading));
  if (removed.length > 0) fail(`既存の見出しが削除されています: ${removed.join(' / ')}`);
}

const updated = `---\n${newFrontmatter}\n---\n${newBody}`;

const legacy = findLegacyTerms(updated);
if (legacy.length > 0) fail(`旧リフォーム特化文脈が含まれるため中止します: ${legacy.join('、')}`);

const disallowed = findDisallowedInternalLinks(newBody, KNOWLEDGE_DIR).filter(
  (path) => path !== target.target_path
);
if (disallowed.length > 0) fail(`存在しない、または参照を許可していない内部リンクがあります: ${disallowed.join('、')}`);

if (updated === original) fail('変更点がありません');

// 更新日を記録する（既存のpublishedAtは変えない）
const withUpdatedAt = /^updatedAt:\s*.*$/m.test(updated)
  ? updated.replace(/^updatedAt:\s*.*$/m, `updatedAt: ${today}`)
  : updated.replace(/^(publishedAt:\s*.*)$/m, `$1\nupdatedAt: ${today}`);

writeFileSync(target.target_file, withUpdatedAt, 'utf-8');

console.log(`改善を適用しました: ${target.target_file}`);
console.log(`改善タイプ: ${target.action_type}`);
if (result.summary) console.log(`変更の要約: ${String(result.summary).slice(0, 200)}`);
for (const line of applied) console.log(`  - ${line}`);
