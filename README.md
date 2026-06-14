# www.emstoo.net

R2 に置いた Markdown を一覧 / 個別ページとして表示する Hono + Cloudflare Workers の個人サイト。

- `/` … R2 バケット内の Markdown 一覧（更新日の新しい順）
- `/posts/<slug>` … `content/<slug>.md` をスタイル付きで表示

## Content (R2)

Markdown は R2 バケット `www-emstoo-net-content` の `content/` プレフィックス配下に置く。
URL の slug はファイルパスと対応する（`content/foo/bar.md` → `/posts/foo/bar`）。
ページタイトルは本文の最初の `# 見出し`、無ければ slug を使う。

```txt
# バケット作成（初回のみ）
npx wrangler r2 bucket create www-emstoo-net-content

# 記事をアップロード（本番）
npx wrangler r2 object put www-emstoo-net-content/content/hello.md --file=./hello.md

# 記事をアップロード（ローカル dev 用）
npx wrangler r2 object put www-emstoo-net-content/content/hello.md --file=./hello.md --local
```

メンテモードは `MAINTENANCE_MODE`（`wrangler.toml` の `[vars]` / ローカルは `.dev.vars`）で切り替える。

## Develop / Deploy

```txt
npm install
npm run dev
```

```txt
npm run deploy
```

`wrangler.toml` を変更したら、Worker の型定義（`worker-configuration.d.ts`）を再生成する:

```txt
npm run cf-typegen
```
