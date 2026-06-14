import { Hono } from 'hono'
import type { Context } from 'hono'
import { secureHeaders } from 'hono/secure-headers'
import { marked } from 'marked'
import { layout } from './layout'

type Bindings = {
  MAINTENANCE_MODE: string
  // R2 bucket holding the markdown content (bound in wrangler.toml).
  CONTENT: R2Bucket
}

type AppContext = Context<{ Bindings: Bindings }>

// All markdown lives under this prefix inside the R2 bucket, e.g. content/hello.md
const CONTENT_PREFIX = 'content/'

// Cache successful content responses (browser + Cloudflare edge).
const CONTENT_CACHE = 'public, max-age=300, stale-while-revalidate=600'

const app = new Hono<{ Bindings: Bindings }>()

marked.setOptions({ gfm: true, breaks: false })

/**
 * Security headers on every response. No client-side JS is served, so the
 * CSP locks scripts down entirely; inline styles come from the layout.
 */
app.use(
  '*',
  secureHeaders({
    contentSecurityPolicy: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", 'https:', 'data:'],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'none'"],
      frameAncestors: ["'none'"],
    },
  })
)

/**
 * Maintenance mode. Runs first for all incoming requests.
 */
app.use('*', async (c, next) => {
  if (c.env.MAINTENANCE_MODE === 'true') {
    return c.html(
      layout({
        title: 'Service temporarily unavailable',
        bodyClass: 'markdown-body',
        body: '<h1>Service Temporarily Unavailable</h1><p>Please come back again a bit later.</p>',
      }),
      503,
      { 'Retry-After': '3600', 'Cache-Control': 'no-store' }
    )
  }
  await next()
})

// content/some/post.md -> "some/post"
const keyToSlug = (key: string) => key.slice(CONTENT_PREFIX.length).replace(/\.md$/, '')
// "some/post" -> content/some/post.md
const slugToKey = (slug: string) => `${CONTENT_PREFIX}${slug}.md`

// Pull the first markdown heading as a display title, falling back to the slug.
const titleFromMarkdown = (md: string, slug: string) => {
  const m = md.match(/^\s*#\s+(.+?)\s*$/m)
  return m ? m[1] : slug.split('/').pop() ?? slug
}

// Shared styled 404 (used by missing posts and unmatched routes).
const notFound = (c: AppContext) =>
  c.html(
    layout({
      title: 'Not Found',
      bodyClass: 'markdown-body',
      body: '<h1>404 Not Found</h1><p>ページが見つかりませんでした。</p><a class="back" href="/">← 一覧へ</a>',
    }),
    404,
    { 'Cache-Control': 'no-store' }
  )

/**
 * Index: list all markdown files in the bucket.
 */
app.get('/', async (c) => {
  const listed = await c.env.CONTENT.list({ prefix: CONTENT_PREFIX })
  const posts = listed.objects
    .filter((o) => o.key.endsWith('.md'))
    .sort((a, b) => b.uploaded.getTime() - a.uploaded.getTime())
    .map((o) => ({
      slug: keyToSlug(o.key),
      uploaded: o.uploaded,
    }))

  const body =
    posts.length === 0
      ? '<p class="empty">まだ記事がありません。</p>'
      : `<ul class="post-list">${posts
          .map(
            (p) => `<li>
  <div class="title"><a href="/posts/${encodeURI(p.slug)}">${escapeHtml(p.slug)}</a></div>
  <div class="meta">${p.uploaded.toISOString().slice(0, 10)}</div>
</li>`
          )
          .join('')}</ul>`

  return c.html(layout({ title: 'emstoo.net', body }), 200, {
    'Cache-Control': CONTENT_CACHE,
  })
})

/**
 * Individual post: render content/<slug>.md
 */
app.get('/posts/:slug{.+}', async (c) => {
  const slug = c.req.param('slug')
  const obj = await c.env.CONTENT.get(slugToKey(slug))

  if (!obj) {
    return notFound(c)
  }

  const md = await obj.text()
  const title = titleFromMarkdown(md, slug)
  const rendered = await marked.parse(md)
  const body = `${rendered}<a class="back" href="/">← 一覧へ</a>`

  return c.html(layout({ title, bodyClass: 'markdown-body', body }), 200, {
    'Cache-Control': CONTENT_CACHE,
  })
})

// Styled 404 for any unmatched route.
app.notFound(notFound)

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (ch) => {
    switch (ch) {
      case '&':
        return '&amp;'
      case '<':
        return '&lt;'
      case '>':
        return '&gt;'
      case '"':
        return '&quot;'
      default:
        return '&#39;'
    }
  })
}

export default app
