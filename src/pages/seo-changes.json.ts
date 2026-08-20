import type { APIRoute } from 'astro';
import { SEO_CHANGES, SEO_VERDICT_RULES } from '../data/seo-changes';

/**
 * /seo-changes.json — SEO改善履歴の配信口。
 * Google Apps Script から UrlFetchApp で読み、GSCの実測と突合して
 * 「変更前7日 / 変更後7日 / 変更後28日」を自動比較するために使う。
 *
 * 中身は変更の事実（日付・URL・狙いクエリ・変更内容）だけで、指標は持たない。
 * 指標は毎回GSCから取り直すので、この配信物が古くなることはない。
 *
 * 運用データなので robots.txt で Disallow し、sitemap にも載せない。
 */
export const GET: APIRoute = async () => {
  const body = {
    generatedAt: new Date().toISOString(),
    site: 'https://ibatoco.jp',
    /** 判定しきい値。Apps Script側はこれを読んで判定する */
    rules: SEO_VERDICT_RULES,
    /** 変更履歴（新しい順） */
    changes: SEO_CHANGES,
  };
  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
};
