/**
 * 問い合わせフォームの受け口（Cloudflare Pages Functions）。
 *
 * 必要な環境変数（Cloudflare Pages → Settings → Environment variables）:
 *   RESEND_API_KEY   Resend の API キー
 *   CONTACT_TO       通知の宛先メールアドレス
 *   CONTACT_FROM     送信元（Resend で認証済みのドメインのアドレス）
 *   TURNSTILE_SECRET_KEY  Cloudflare Turnstile のシークレットキー
 *
 * これらが未設定の場合は 503 を返し、フォーム側で代替の連絡先を案内します。
 * 設定されていないことを黙って握りつぶさないための挙動です。
 */

interface Env {
  RESEND_API_KEY?: string;
  CONTACT_TO?: string;
  CONTACT_FROM?: string;
  TURNSTILE_SECRET_KEY?: string;
}

interface Submission {
  topic?: string;
  name?: string;
  company?: string;
  email?: string;
  companyUrl?: string;
  message?: string;
  agree?: string;
  'cf-turnstile-response'?: string;
  /** スパム対策用。人間には見えないフィールド。 */
  website?: string;
}

// src/pages/contact/index.astro の選択肢（src/data/taxonomy.ts のサービス名）と揃える。
const TOPIC_LABELS: Record<string, string> = {
  system: 'どこから仕組み化すべきか整理したい',
  web: '集客・営業の仕組み',
  sns: '発信の仕組み',
  'ai-dx': '業務・改善の仕組み',
  local: '茨城・地域のプロジェクト',
  other: 'その他',
};

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });

const MAX_REQUEST_BYTES = 24_000;
const ALLOWED_ORIGINS = new Set(['https://shikumi-base.com', 'https://www.shikumi-base.com']);

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const stringRecord = (value: Record<string, unknown>): Submission | null => {
  const result: Record<string, string> = {};
  for (const [key, item] of Object.entries(value)) {
    if (typeof item !== 'string') return null;
    result[key] = item;
  }
  return result;
};

const parseSubmission = async (request: Request): Promise<Submission | null> => {
  const declaredLength = Number(request.headers.get('content-length') ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_REQUEST_BYTES) return null;

  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > MAX_REQUEST_BYTES) return null;

  const contentType = request.headers.get('content-type')?.toLowerCase() ?? '';
  if (contentType.includes('application/json')) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return null;
    }
    return isPlainObject(parsed) ? stringRecord(parsed) : null;
  }

  if (
    contentType.includes('application/x-www-form-urlencoded') ||
    contentType.includes('multipart/form-data')
  ) {
    try {
      const form = await new Response(raw, {
        headers: { 'Content-Type': contentType },
      }).formData();
      const parsed: Record<string, unknown> = {};
      form.forEach((item, key) => {
        parsed[key] = item;
      });
      return stringRecord(parsed);
    } catch {
      return null;
    }
  }

  return null;
};

const within = (value: string, max: number) => value.length <= max;

interface TurnstileResult {
  success?: boolean;
  hostname?: string;
  action?: string;
  'error-codes'?: string[];
}

const verifyTurnstile = async (
  secret: string,
  token: string,
  remoteIp: string | null
): Promise<boolean> => {
  const payload = new URLSearchParams({ secret, response: token });
  if (remoteIp) payload.set('remoteip', remoteIp);

  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: payload,
  });
  if (!response.ok) return false;

  const result = (await response.json()) as TurnstileResult;
  return Boolean(
    result.success &&
      result.action === 'contact' &&
      (!result.hostname || result.hostname === 'shikumi-base.com' || result.hostname === 'www.shikumi-base.com')
  );
};

/* Cloudflare Workers の型定義に依存せず、必要な形だけをここで定義する。 */
interface RequestContext {
  request: Request;
  env: Env;
}

export const onRequestPost = async ({ request, env }: RequestContext): Promise<Response> => {
  const origin = request.headers.get('origin');
  if (origin && !ALLOWED_ORIGINS.has(origin)) {
    return json(403, { message: 'この送信元からは受け付けられません' });
  }

  let data: Submission | null;
  try {
    data = await parseSubmission(request);
  } catch {
    return json(400, { message: 'リクエストの形式が不正です' });
  }
  if (!data) return json(400, { message: 'リクエストの形式またはサイズが不正です' });

  // ハニーポット。埋まっていれば自動送信とみなし、成功を装って破棄する。
  if (data.website) {
    return json(200, { ok: true });
  }

  const name = (data.name ?? '').trim();
  const company = (data.company ?? '').trim();
  const email = (data.email ?? '').trim();
  const message = (data.message ?? '').trim();
  const topic = (data.topic ?? '').trim();
  const turnstileToken = (data['cf-turnstile-response'] ?? '').trim();

  const errors: string[] = [];
  if (!name) errors.push('お名前');
  if (!company) errors.push('会社名・屋号');
  if (!email) errors.push('メールアドレス');
  if (!message) errors.push('ご相談内容');
  if (!topic) errors.push('ご相談の種類');
  if (!data.agree) errors.push('プライバシーポリシーへの同意');

  if (errors.length > 0) {
    return json(400, { message: `${errors.join('、')}が未入力です` });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json(400, { message: 'メールアドレスの形式が正しくありません' });
  }

  if (!TOPIC_LABELS[topic]) {
    return json(400, { message: 'ご相談の種類が正しくありません' });
  }

  if (
    !within(name, 100) ||
    !within(company, 200) ||
    !within(email, 254) ||
    /[\r\n]/.test(name) ||
    /[\r\n]/.test(company) ||
    /[\r\n]/.test(email)
  ) {
    return json(400, { message: 'お名前、会社名またはメールアドレスが長すぎます' });
  }

  // WebサイトURLは任意。入力された場合だけ形式を確認する。
  const companyUrl = (data.companyUrl ?? '').trim();
  if (companyUrl) {
    if (!within(companyUrl, 500) || /[\r\n]/.test(companyUrl)) {
      return json(400, { message: 'WebサイトURLが長すぎます' });
    }
    try {
      const url = new URL(companyUrl);
      if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error('invalid protocol');
    } catch {
      return json(400, { message: 'WebサイトURLの形式が正しくありません' });
    }
  }

  if (message.length > 5000) {
    return json(400, { message: 'ご相談内容が長すぎます（5000文字以内）' });
  }

  const TURNSTILE_SECRET_KEY = env.TURNSTILE_SECRET_KEY?.trim();
  if (!TURNSTILE_SECRET_KEY) {
    console.error('TURNSTILE_SECRET_KEY が未設定です');
    return json(503, { message: 'フォームが一時的に利用できません' });
  }
  if (!turnstileToken || !within(turnstileToken, 4096)) {
    return json(400, { message: 'セキュリティ確認を完了してください' });
  }

  try {
    const verified = await verifyTurnstile(
      TURNSTILE_SECRET_KEY,
      turnstileToken,
      request.headers.get('CF-Connecting-IP')
    );
    if (!verified) return json(400, { message: 'セキュリティ確認に失敗しました。再度お試しください' });
  } catch (error) {
    console.error('Turnstile検証で例外が発生しました', error);
    return json(503, { message: 'セキュリティ確認が一時的に利用できません' });
  }

  // 貼り付け時に混入しがちな前後の空白・改行を落とす
  const RESEND_API_KEY = env.RESEND_API_KEY?.trim();
  const CONTACT_TO = env.CONTACT_TO?.trim();
  const CONTACT_FROM = env.CONTACT_FROM?.trim();
  if (!RESEND_API_KEY || !CONTACT_TO || !CONTACT_FROM) {
    // 設定漏れを検知できるようログに残す
    console.error('送信設定が未設定のため送信できません', {
      hasKey: Boolean(RESEND_API_KEY),
      hasTo: Boolean(CONTACT_TO),
      hasFrom: Boolean(CONTACT_FROM),
    });
    return json(503, { message: 'フォームが一時的に利用できません' });
  }

  const topicLabel = TOPIC_LABELS[topic] ?? topic;
  const body = [
    `ご相談の種類: ${topicLabel}`,
    `お名前: ${name}`,
    `会社名・屋号: ${company}`,
    `メールアドレス: ${email}`,
    `WebサイトURL: ${companyUrl || '（未記入）'}`,
    '',
    '--- ご相談内容 ---',
    message,
    '',
    '--- 送信情報 ---',
    `送信日時: ${new Date().toISOString()}`,
    `参照元: ${request.headers.get('referer') ?? '不明'}`,
  ].join('\n');

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: CONTACT_FROM,
        to: [CONTACT_TO],
        // 受信後そのまま返信できるようにする
        reply_to: email,
        subject: `【シクミベース】${topicLabel}／${name}様`,
        text: body,
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      // 設定ミスの切り分けに必要なので、原因はログに残す
      console.error('メール送信に失敗しました', response.status, detail);
      return json(500, { message: '送信処理に失敗しました' });
    }
  } catch (error) {
    console.error('メール送信で例外が発生しました', error);
    return json(500, { message: '送信処理に失敗しました' });
  }

  return json(200, { ok: true });
};
