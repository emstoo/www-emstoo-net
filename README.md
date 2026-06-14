# www.emstoo.net

R2 に置いた Markdown を一覧 / 個別ページとして表示する Hono + Cloudflare Workers の個人サイト。

- `/` … R2 バケット内の Markdown 一覧（更新日の新しい順）
- `/posts/<slug>` … `content/<slug>.md` をスタイル付きで表示

## Content

記事の元 Markdown はこのリポジトリの `content/` ディレクトリで管理する。
配信時は同じパス構成で R2 バケット `www-emstoo-net-content` の `content/`
プレフィックス配下へアップロードする（`content/foo/bar.md` → `/posts/foo/bar`）。
URL の slug はファイルパスに対応し、ページタイトルは本文の最初の `# 見出し`、
無ければ slug を使う。

```txt
# バケット作成（初回のみ）
npx wrangler r2 bucket create www-emstoo-net-content

# content/ 配下の全 .md を R2 へ同期（本番）
npm run content:push

# 同上をローカル dev 用 R2 へ（npm run dev で見られる）
npm run content:push:local
```

個別ファイルだけ上げたい場合は直接:

```txt
npx wrangler r2 object put www-emstoo-net-content/content/hello.md --file=content/hello.md
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
