import type { Crumb } from '../components/Breadcrumbs.astro';

/**
 * BreadcrumbList 構造化データを、可視パンくずと同じ配列から生成する。
 * 表示と構造化データがずれないよう、必ず同じ items を両方へ渡すこと。
 * item（URL）は href があるものだけに付ける（現在地は position だけで良い）。
 */
export function breadcrumbJsonLd(items: Crumb[], site: URL | undefined): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      ...(crumb.href ? { item: new URL(crumb.href, site).href } : {}),
    })),
  };
}
