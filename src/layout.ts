import { html, raw } from 'hono/html'

const STYLE = `
:root {
  --fg: #24292f;
  --fg-muted: #57606a;
  --bg: #ffffff;
  --border: #d0d7de;
  --link: #0969da;
  --code-bg: #f6f8fa;
  --accent: #0969da;
}
@media (prefers-color-scheme: dark) {
  :root {
    --fg: #e6edf3;
    --fg-muted: #9198a1;
    --bg: #0d1117;
    --border: #30363d;
    --link: #4493f8;
    --code-bg: #161b22;
    --accent: #4493f8;
  }
}
* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue",
    "Hiragino Sans", "Hiragino Kaku Gothic ProN", Meiryo, sans-serif;
  font-size: 16px;
  line-height: 1.7;
  color: var(--fg);
  background: var(--bg);
}
.wrap {
  max-width: 760px;
  margin: 0 auto;
  padding: 2.5rem 1.25rem 5rem;
}
.site-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 2.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border);
}
.site-header a.home { font-weight: 700; font-size: 1.15rem; color: var(--fg); text-decoration: none; }
.site-header nav a { color: var(--fg-muted); text-decoration: none; font-size: 0.9rem; }
.site-header nav a:hover { color: var(--link); }
a { color: var(--link); text-decoration: none; }
a:hover { text-decoration: underline; }

/* post list */
.post-list { list-style: none; padding: 0; margin: 0; }
.post-list li { padding: 0.9rem 0; border-bottom: 1px solid var(--border); }
.post-list .title { font-size: 1.1rem; font-weight: 600; }
.post-list .meta { color: var(--fg-muted); font-size: 0.85rem; margin-top: 0.2rem; }
.empty { color: var(--fg-muted); }

/* markdown body */
.markdown-body h1, .markdown-body h2, .markdown-body h3,
.markdown-body h4, .markdown-body h5, .markdown-body h6 {
  margin-top: 1.8em; margin-bottom: 0.6em; line-height: 1.3; font-weight: 700;
}
.markdown-body h1 { font-size: 1.9rem; padding-bottom: 0.3em; border-bottom: 1px solid var(--border); }
.markdown-body h2 { font-size: 1.5rem; padding-bottom: 0.3em; border-bottom: 1px solid var(--border); }
.markdown-body h3 { font-size: 1.25rem; }
.markdown-body p { margin: 0 0 1rem; }
.markdown-body ul, .markdown-body ol { padding-left: 1.6em; margin: 0 0 1rem; }
.markdown-body li { margin: 0.25em 0; }
.markdown-body blockquote {
  margin: 0 0 1rem; padding: 0.2em 1em; color: var(--fg-muted);
  border-left: 0.25em solid var(--border);
}
.markdown-body code {
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  font-size: 0.875em; background: var(--code-bg);
  padding: 0.2em 0.4em; border-radius: 6px;
}
.markdown-body pre {
  background: var(--code-bg); padding: 1rem; border-radius: 8px;
  overflow: auto; margin: 0 0 1rem;
}
.markdown-body pre code { background: none; padding: 0; font-size: 0.85rem; }
.markdown-body img { max-width: 100%; height: auto; }
.markdown-body table { border-collapse: collapse; width: 100%; margin: 0 0 1rem; display: block; overflow: auto; }
.markdown-body th, .markdown-body td { border: 1px solid var(--border); padding: 0.4em 0.8em; }
.markdown-body th { background: var(--code-bg); }
.markdown-body hr { border: none; border-top: 1px solid var(--border); margin: 2rem 0; }
.markdown-body a { word-break: break-word; }

.post-meta { color: var(--fg-muted); font-size: 0.85rem; margin-bottom: 2rem; }
.back { display: inline-block; margin-top: 3rem; color: var(--fg-muted); font-size: 0.9rem; }
`

type LayoutOptions = {
  title: string
  body: string
  bodyClass?: string
}

export function layout({ title, body, bodyClass }: LayoutOptions) {
  return html`<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<style>${raw(STYLE)}</style>
</head>
<body>
<div class="wrap">
<header class="site-header">
<a class="home" href="/">emstoo.net</a>
<nav><a href="/">記事一覧</a></nav>
</header>
<main class="${bodyClass ?? ''}">${raw(body)}</main>
</div>
</body>
</html>`
}
