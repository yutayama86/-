/**
 * 本番へ反映されるまで待つ。
 *
 *   node scripts/wait-deploy.mjs <path> <含まれるはずの文字列> [--timeout 600]
 *   node scripts/wait-deploy.mjs /news/foo/ "見出しの一部"
 *
 * HTTP 200 だけでは判断できない（反映直後は旧版がキャッシュで返る）ため、
 * 「新版にしか無い文字列」を条件にする。
 *
 * 注意：生成HTMLには data-astro-cid-… が入るので、タグを含む文字列は
 * 一致しないことがある。テキストだけを渡すこと。
 */
const SITE = 'https://ibatoco.jp';

const args = process.argv.slice(2);
const timeoutIdx = args.indexOf('--timeout');
const timeoutSec = timeoutIdx >= 0 ? Number(args[timeoutIdx + 1]) : 600;
const [path, needle] = args.filter((a, i) => !a.startsWith('--') && i !== timeoutIdx + 1);

if (!path || !needle) {
  console.error('使い方: node scripts/wait-deploy.mjs <path> <含まれるはずの文字列> [--timeout 秒]');
  process.exit(2);
}
if (/[<>]/.test(needle)) {
  console.error('! タグを含む文字列は避けてください。Astroが属性を差し込むため一致しません。');
}

const url = `${SITE}${path.startsWith('/') ? path : `/${path}`}`;
const interval = 20_000;
const deadline = Date.now() + timeoutSec * 1000;
let attempt = 0;

process.stdout.write(`本番の反映を待っています: ${url}\n`);

while (Date.now() < deadline) {
  attempt += 1;
  const res = await fetch(url, { cache: 'no-store' }).catch(() => null);
  if (res?.ok) {
    const body = await res.text();
    if (body.includes(needle)) {
      const waited = Math.round((attempt - 1) * interval / 1000);
      console.log(`\x1b[32m反映済み\x1b[0m（試行 ${attempt}／待機 ${waited}秒）`);
      process.exit(0);
    }
    process.stdout.write(`  試行 ${attempt}: 200だが旧版（文字列なし）\n`);
  } else {
    process.stdout.write(`  試行 ${attempt}: ${res ? res.status : '取得失敗'}\n`);
  }
  if (Date.now() + interval >= deadline) break;
  await new Promise((r) => setTimeout(r, interval));
}

console.log(`\x1b[31m${timeoutSec}秒待っても反映されませんでした\x1b[0m`);
process.exit(1);
