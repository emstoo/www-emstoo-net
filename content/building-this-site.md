# このサイトの構成について

このサイトは Hono + Cloudflare Workers で動く個人サイトで、記事の本文は
Cloudflare R2 に置いた Markdown ファイルをリクエストごとにレンダリングして表示している。
いま読んでいるこの記事も、R2 上に置かれた Markdown のひとつだ。

もともとこのドメインはメンテナンス用の `503` を返すだけの状態だったが、
「Markdown を置けばそのままページになる」程度の軽い仕組みがあれば十分だと考え、
最小限の構成で組んだ。その記録を残しておく。

## 技術構成

| 役割 | 採用したもの |
| --- | --- |
| Web フレームワーク | [Hono](https://hono.dev) |
| 実行環境 | Cloudflare Workers |
| コンテンツ置き場 | Cloudflare R2 |
| Markdown 変換 | [marked](https://marked.js.org) |
| スタイル | 自前 CSS（ライト / ダーク対応） |

データベースや管理画面は持たない。記事の実体は R2 上の `.md` ファイルだけで、
ビルドステップもない。ファイルを置けば公開され、削除すれば消える。

## ルーティング

ルートは大きく二つに分かれる。

- `/` … R2 の `content/` プレフィックス配下にある `.md` を列挙し、新しい順に並べた一覧を返す
- `/posts/<slug>` … `content/<slug>.md` を取得して HTML に変換し、スタイルを付けて返す

`<slug>` は R2 上のファイルパスにそのまま対応する。
たとえばこの記事のファイルは `content/building-this-site.md` なので、
URL は `/posts/building-this-site` になる。ファイルパスと URL が一対一で対応するため、
ルーティングのためのメタ情報や設定ファイルは必要ない。

記事ページの実装は次のようになっている。`:slug{.+}` は `/` を含むパスにもマッチするため、
`content/foo/bar.md` のようなサブディレクトリも `/posts/foo/bar` で扱える。

```ts
app.get('/posts/:slug{.+}', async (c) => {
  const slug = c.req.param('slug')
  const obj = await c.env.CONTENT.get(`content/${slug}.md`)
  if (!obj) return notFound(c)

  const md = await obj.text()
  const rendered = await marked.parse(md)
  return c.html(layout({ title, body: rendered, bodyClass: 'markdown-body' }))
})
```

ページのタイトルは本文の最初の `# 見出し` から取得し、見出しがなければ slug を使う。
これにより、記事ごとにタイトルを別管理する必要がなくなっている。

## 設計上の判断

個人サイトとはいえ、基本的な堅牢性は確保しておきたかった。
いくつか手を入れた点を挙げる。

### セキュリティヘッダ

`hono/secure-headers` を使い、CSP をはじめとするセキュリティヘッダを全レスポンスに付与している。
このサイトはクライアントサイドの JavaScript を一切配信しないため、
CSP は `script-src 'none'` として、スクリプトの実行経路そのものを塞いでいる。

### キャッシュ

記事と一覧のレスポンスには `Cache-Control: public, max-age=300, stale-while-revalidate=600`
を設定し、R2 への読み取り回数とレイテンシを抑えている。
一方、メンテナンスページや 404 は `no-store` とし、状態の切り替えが即座に反映されるようにした。

### 404 ハンドリング

存在しない記事も、定義していない URL も、共通の `notFound` ハンドラに集約し、
他のページと同じレイアウトの 404 を返す。デフォルトの素のエラー画面は出さない。

## 記事の追加

新しい記事を公開する手順は単純だ。

1. リポジトリの `content/` に Markdown を追加する
2. R2 へ同期する

```txt
npm run content:push
```

再ビルドや再デプロイは不要で、アップロード後（キャッシュの失効後）に記事が反映される。
元の Markdown はリポジトリの `content/` で管理し、R2 へは同期する運用にしている。

## ソースコード

このサイトのコードはすべて GitHub で公開している。

→ <https://github.com/emstoo/www-emstoo-net>
