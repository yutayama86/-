/**
 * イバトコ 公開前の簡易パスワード保護（Basic認証）。
 *
 * Cloudflare のシークレット `SITE_PASSWORD` を設定すると、サイト全体に
 * パスワードがかかります（知っている人だけ閲覧可）。
 * シークレット未設定なら通常どおり公開されます（ロックアウト防止）。
 * 公開したくなったら、Cloudflareでシークレットを削除するだけでOK。
 */
export default {
  async fetch(request, env) {
    const password = env.SITE_PASSWORD;

    // パスワードが設定されている時だけ認証をかける
    if (password) {
      const header = request.headers.get('Authorization') || '';
      const [scheme, encoded] = header.split(' ');
      let authorized = false;

      if (scheme === 'Basic' && encoded) {
        try {
          const decoded = atob(encoded); // "ユーザー名:パスワード"
          const supplied = decoded.slice(decoded.indexOf(':') + 1);
          authorized = supplied === password;
        } catch {
          authorized = false;
        }
      }

      if (!authorized) {
        return new Response('イバトコは現在準備中です。関係者の方はパスワードを入力してください。', {
          status: 401,
          headers: {
            'WWW-Authenticate': 'Basic realm="Ibatoco (準備中)", charset="UTF-8"',
            'Content-Type': 'text/plain; charset=utf-8',
          },
        });
      }
    }

    // 認証OK（またはパスワード未設定）→ 静的サイトを配信
    return env.ASSETS.fetch(request);
  },
};
