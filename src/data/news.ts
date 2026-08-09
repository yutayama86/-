export const NEWS_CATEGORIES = {
  government: { label: '自治体・行政' },
  tourism: { label: '観光' },
  economy: { label: '地域経済' },
  transport: { label: '交通' },
  sports: { label: 'スポーツ' },
  dx: { label: 'DX' },
  startup: { label: 'スタートアップ' },
  other: { label: '地域ニュース' },
} as const;

export type NewsCategoryKey = keyof typeof NEWS_CATEGORIES;
export const NEWS_CATEGORY_KEYS = Object.keys(NEWS_CATEGORIES) as [NewsCategoryKey, ...NewsCategoryKey[]];
