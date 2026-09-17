#!/usr/bin/env node
/**
 * Cloudflare Workers AIでプロンプトを実行し、応答を保存する。
 *
 *   --mode article （既定）新規記事。執筆と事実監査の2回に分ける。
 *   --mode edit           既存ページの改善。JSONの変更指示を1回で返させる。
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { BRAND_POSITION, BRAND_PRIME_DIRECTIVE, findLegacyTerms } from './lib/brand-guard.mjs';

function arg(name) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : null;
}

const contextFile = '.growth/target.json';
const modeFromContext = () => {
  if (!existsSync(contextFile)) return 'article';
  try {
    return JSON.parse(readFileSync(contextFile, 'utf-8')).target?.target_type === 'new_article' ? 'article' : 'edit';
  } catch {
    return 'article';
  }
};
const mode = arg('mode') || modeFromContext();
const promptFile = arg('prompt-file');
const outputFile = arg('output-file');
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
const apiToken = process.env.CLOUDFLARE_AI_API_TOKEN?.trim();
const model = process.env.CLOUDFLARE_AI_MODEL || '@cf/openai/gpt-oss-120b';

if (!promptFile || !outputFile) {
  console.error('使い方: node scripts/infer-article.mjs --prompt-file <path> --output-file <path> [--mode article|edit]');
  process.exit(1);
}

if (mode !== 'article' && mode !== 'edit') {
  console.error(`未対応のモードです: ${mode}`);
  process.exit(1);
}

if (!existsSync(promptFile)) {
  console.error(`記事プロンプトが見つかりません: ${promptFile}`);
  process.exit(1);
}

if (!accountId || !apiToken) {
  console.error('CLOUDFLARE_ACCOUNT_ID と CLOUDFLARE_AI_API_TOKEN が必要です。');
  process.exit(1);
}

const prompt = readFileSync(promptFile, 'utf-8');
const endpoint = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/ai/v1/chat/completions`;

const system =
  mode === 'edit'
    ? `${BRAND_PRIME_DIRECTIVE}

あなたは、公開済みの記事を必要な箇所だけ直す日本語BtoB編集者です。${BRAND_POSITION}
記事を作り直さず、指示された変更だけを返します。出力は指定されたJSONのみで、説明文やコードフェンスを付けません。`
    : `${BRAND_PRIME_DIRECTIVE}

あなたは、中小企業・地域企業の仕組み化を扱う日本語BtoB編集者です。${BRAND_POSITION}
特定の業界向けの記事にせず、一般論、同語反復、未検証の効果断定を排し、与えられた事実だけで完成原稿を書いてください。`;

/** 新規記事のときだけ行う、2回目の事実監査の指示。 */
const AUDIT_INSTRUCTION = `上の原稿を事実監査し、Markdown全文をリライトしてください。

- 最上位制約を再確認してください: ${BRAND_PRIME_DIRECTIVE}
- 特定の業界を前提にした業務フロー、商品名、価格、期間、回数、件数の約束が含まれていれば削除し、多くの中小企業・地域企業に共通する業務の説明へ置き換えてください。
- Web・SNS・AI・SEOを商品そのものとして売り込まず、仕組みを実装する手段として書いてください。
- 明示されていない画面、連携先、割り振り方法、通知時刻、対応期限、金額基準、件数基準を削除してください。
- 効果は保証せず、「防ぐ」「削減できる」ではなく「防止を目的にする」「確認しやすくする」としてください。
- スプレッドシート、DB、PDF、タグ、フラグなど、採用が決まっていない実装技術を削除してください。
- 「山野辺雄太さん」「毎日多数」など、不自然な呼び方や根拠のない量表現を削除してください。
- イバトコに触れる場合は、シクミベースが自ら運営する地域メディアの公開ケーススタディとして扱い、顧客事例として書かないでください。
- 内部リンクは、最初の指示の「内部リンクに使えるページ」にあるURLだけを通常のMarkdownリンクで使ってください。
- 外部統計、架空の実績、架空の顧客、根拠のない閾値は使わないでください。
- frontmatterと必須H2、2,200文字以上、内部リンク3件以上を維持してください。

説明や監査メモは付けず、修正後のMarkdown全文だけを返してください。`;

async function infer(messages) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.1,
      repetition_penalty: 1.1,
      frequency_penalty: 0.2,
      max_tokens: 6500,
      stream: false,
    }),
  });

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 1500);
    throw new Error(`Cloudflare Workers AIの記事生成に失敗しました: ${response.status} ${detail}`);
  }

  const result = await response.json();
  const content = result.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error('Cloudflare Workers AIから本文が返りませんでした。');
  return content;
}

let markdown;

try {
  if (mode === 'edit') {
    // 改善は1回で返させる。全文生成ではないため監査パスは行わない。
    markdown = await infer([
      { role: 'system', content: system },
      { role: 'user', content: prompt },
    ]);
  } else {
    const draft = await infer([
      { role: 'system', content: system },
      { role: 'user', content: prompt },
    ]);
    markdown = await infer([
      { role: 'system', content: system },
      { role: 'user', content: prompt },
      { role: 'assistant', content: draft },
      {
        role: 'user',
        content: AUDIT_INSTRUCTION,
      },
    ]);
  }
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

if (!markdown) {
  console.error('Cloudflare Workers AIから本文が返りませんでした。');
  process.exit(1);
}

// 保存前に止め、旧文脈を含む応答を後続の保存・検証へ渡さない。
const legacy = findLegacyTerms(markdown);
if (legacy.length > 0) {
  console.error(`AI応答に旧リフォーム特化文脈が含まれるため破棄します: ${legacy.join('、')}`);
  process.exit(1);
}

mkdirSync(dirname(outputFile), { recursive: true });
writeFileSync(outputFile, `${markdown}\n`, 'utf-8');
console.log(`AI記事応答を保存しました: ${outputFile}`);
