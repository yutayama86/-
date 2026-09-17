import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { writeFileSync, unlinkSync, readFileSync } from 'node:fs';

const TMP = 'src/content/knowledge/zz-quality-check-test.md';

function check(body) {
  const frontmatter = readFileSync('src/content/knowledge/shikumika-toha.md', 'utf-8').split('\n---\n')[0];
  writeFileSync(TMP, `${frontmatter}\n---\n${body}`);
  try {
    execFileSync('node', ['scripts/quality-check.mjs'], { encoding: 'utf-8' });
    return { ok: true, output: '' };
  } catch (error) {
    return { ok: false, output: `${error.stdout ?? ''}${error.stderr ?? ''}` };
  } finally {
    unlinkSync(TMP);
  }
}

const filler = 'この段落は検査用の本文です。仕組み化の手順を確認できる状態にしておきます。'.repeat(40);

test('中身のない見出しを検出する', () => {
  const result = check(`本文です。[関連](/service/web/)\n\n## 結論：何も書かれていない\n\n## まとめ\n\n${filler}\n`);
  assert.equal(result.ok, false);
  assert.match(result.output, /中身のない見出し/);
});

test('小見出しが続く見出しは中身なしとみなさない', () => {
  const result = check(`本文です。[関連](/service/web/)\n\n## 手順\n\n### 手順1\n\n${filler}\n\n## まとめ\n\n${filler}\n`);
  assert.ok(result.ok, result.output);
});

test('長すぎる見出しを検出する', () => {
  const long = '## 結論：属人化を解消するための考え方と、最初に着手する業務の選び方、判断基準の書き出し方、検証の回し方までを一つの見出しに詰め込んだ見出し';
  const result = check(`本文です。[関連](/service/web/)\n\n${long}\n\n${filler}\n\n## まとめ\n\n${filler}\n`);
  assert.equal(result.ok, false);
  assert.match(result.output, /見出しが長すぎます/);
});
