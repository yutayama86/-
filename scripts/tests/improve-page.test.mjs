import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, copyFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const SOURCE = 'src/content/knowledge/shikumika-toha.md';

function workspace() {
  const dir = mkdtempSync(join(tmpdir(), 'improve-page-'));
  const file = join(dir, 'article.md');
  copyFileSync(SOURCE, file);
  return { dir, file, original: readFileSync(file, 'utf-8') };
}

function contextFor({ dir, file }, actionType) {
  const path = join(dir, 'context.json');
  writeFileSync(
    path,
    JSON.stringify({
      date: '2026-09-17',
      target: {
        target_type: 'existing_page',
        target_path: '/knowledge/shikumika/shikumika-toha/',
        target_slug: 'shikumika-toha',
        target_category: 'shikumika',
        target_file: file,
        editable: true,
        action_type: actionType,
        rule: 'F',
        reason: 'テスト',
        action: 'テスト',
      },
      metrics: { search: { period: null, totals: null, page: null }, ga4: null },
    })
  );
  return path;
}

function run(args) {
  try {
    const stdout = execFileSync('node', ['scripts/improve-page.mjs', ...args], { encoding: 'utf-8' });
    return { ok: true, stdout };
  } catch (error) {
    return { ok: false, stdout: error.stdout ?? '', stderr: error.stderr ?? '' };
  }
}

function respond(dir, payload) {
  const path = join(dir, 'response.md');
  writeFileSync(path, typeof payload === 'string' ? payload : JSON.stringify(payload));
  return path;
}

test('プロンプトには対象URL・改善タイプ・現在の本文が入る', () => {
  const ws = workspace();
  const context = contextFor(ws, 'internal_links');
  const promptPath = join(ws.dir, 'prompt.md');
  const result = run(['--context', context, '--prompt-output', promptPath]);
  assert.ok(result.ok, result.stderr);

  const prompt = readFileSync(promptPath, 'utf-8');
  assert.match(prompt, /https:\/\/shikumi-base\.com\/knowledge\/shikumika\/shikumika-toha\//);
  assert.match(prompt, /改善タイプ: internal_links/);
  assert.ok(prompt.includes('仕組み化は便利な言葉'.slice(0, 6)) || prompt.includes('## 結論'));
  assert.match(prompt, /リフォーム支援事業ではない/, '最上位制約が入る');
});

test('指定された箇所だけを置換し、更新日を記録する', () => {
  const ws = workspace();
  const context = contextFor(ws, 'internal_links');
  const find = 'ツールを導入することでも、マニュアルを作ることでもありません。';
  const replace =
    'ツールを導入することでも、マニュアルを作ることでもありません。進め方は[業務マニュアルの作り方](/knowledge/shikumika/gyomu-manual-tsukurikata/)でも扱っています。';
  const response = respond(ws.dir, { summary: 'リンクを追加', edits: [{ find, replace }] });

  const result = run(['--context', context, '--response-file', response]);
  assert.ok(result.ok, result.stderr);

  const updated = readFileSync(ws.file, 'utf-8');
  assert.ok(updated.includes(replace), '置換が反映される');
  assert.match(updated, /^updatedAt: \d{4}-\d{2}-\d{2}$/m, '更新日が入る');
  assert.equal(
    updated.replace(/^updatedAt: .*$\n/m, '').replace(replace, find),
    ws.original,
    '指定箇所と更新日以外は変わらない'
  );
});

test('title_description では本文を変更しない', () => {
  const ws = workspace();
  const context = contextFor(ws, 'title_description');
  const response = respond(ws.dir, {
    summary: 'メタ情報を調整',
    title: '中小企業の仕組み化とは？社長依存を減らす進め方',
    description:
      '仕組み化という言葉の意味と、属人化・社長依存が起きる構造、そして中小企業が最初に着手すべき業務の選び方と手順を、実務の順番で整理します。',
  });

  const result = run(['--context', context, '--response-file', response]);
  assert.ok(result.ok, result.stderr);

  const updated = readFileSync(ws.file, 'utf-8');
  const bodyOf = (text) => text.split(/\n---\n/).slice(1).join('\n---\n');
  assert.equal(bodyOf(updated), bodyOf(ws.original), '本文は変わらない');
  assert.match(updated, /^title: "中小企業の仕組み化とは？社長依存を減らす進め方"$/m);
});

const rejects = [
  {
    name: '本文に存在しない箇所は置換しない',
    action: 'internal_links',
    payload: { edits: [{ find: 'この文章はどこにも存在しません。テスト用の文字列です。', replace: '置き換え' }] },
    expect: /見つかりません/,
  },
  {
    name: '本文の大半を置き換える提案は拒否する',
    action: 'content_rewrite',
    payload: (original) => ({
      edits: [{ find: original.split(/\n---\n/).slice(1).join('\n---\n').slice(0, 3000), replace: '短い置き換え文です。' }],
    }),
    expect: /置換しようとしています|本文量の変化/,
  },
  {
    name: '既存の見出しを消す提案は拒否する',
    action: 'content_rewrite',
    payload: { edits: [{ find: '## なぜ社長依存・属人化が起きるのか', replace: '## まったく別の見出しに差し替える' }] },
    expect: /見出しが削除/,
  },
  {
    name: '旧リフォーム文脈を含む提案は拒否する',
    action: 'content_rewrite',
    payload: {
      edits: [
        {
          find: 'ツールを導入することでも、マニュアルを作ることでもありません。',
          replace: 'リフォーム反響OS 30の導入で解決します。見積フォロー漏れ診断もあります。',
        },
      ],
    },
    expect: /旧リフォーム/,
  },
  {
    name: '存在しないURLへのリンクは拒否する',
    action: 'internal_links',
    payload: {
      edits: [
        {
          find: 'ツールを導入することでも、マニュアルを作ることでもありません。',
          replace: '詳しくは[こちら](/knowledge/shikumika/does-not-exist/)をご覧ください。',
        },
      ],
    },
    expect: /内部リンク/,
  },
  {
    name: 'JSONとして読めない応答は拒否する',
    action: 'internal_links',
    payload: 'これはJSONではありません',
    expect: /JSONとして読み取れません/,
  },
];

for (const item of rejects) {
  test(item.name, () => {
    const ws = workspace();
    const context = contextFor(ws, item.action);
    const payload = typeof item.payload === 'function' ? item.payload(ws.original) : item.payload;
    const response = respond(ws.dir, payload);

    const result = run(['--context', context, '--response-file', response]);
    assert.equal(result.ok, false, '失敗として終了する');
    assert.match(result.stderr, item.expect);
    assert.equal(readFileSync(ws.file, 'utf-8'), ws.original, 'ファイルは変更されない');
  });
}

test('自動編集の対象外（editable=false）なら何もしない', () => {
  const dir = mkdtempSync(join(tmpdir(), 'improve-page-'));
  mkdirSync(dir, { recursive: true });
  const context = join(dir, 'context.json');
  writeFileSync(
    context,
    JSON.stringify({
      target: {
        target_type: 'existing_page',
        target_path: '/contact/',
        target_file: 'src/pages/contact/index.astro',
        editable: false,
        action_type: 'cta',
      },
      metrics: {},
    })
  );

  const result = run(['--context', context, '--prompt-output', join(dir, 'prompt.md')]);
  assert.equal(result.ok, false);
  assert.match(result.stderr, /自動改善の対象外/);
});

test('新規記事の日は改善スクリプトを動かさない', () => {
  const dir = mkdtempSync(join(tmpdir(), 'improve-page-'));
  const context = join(dir, 'context.json');
  writeFileSync(context, JSON.stringify({ target: { target_type: 'new_article' }, metrics: {} }));

  const result = run(['--context', context, '--prompt-output', join(dir, 'prompt.md')]);
  assert.equal(result.ok, false);
  assert.match(result.stderr, /既存ページの改善ではない/);
});
