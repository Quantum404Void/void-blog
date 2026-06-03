<div align="center">
<br />
<br />

**void.dev**

不灸水，不追热点，只写真正踩过坑的东西

<br />

[void.redx.space](https://void.redx.space)

<br />
<br />

<table>
<tr><td align="center" width="560">

**Stack** — Nuxt 4 · Vue 3 · Tailwind v4 · Cloudflare Pages · D1 · Shiki · GSAP

</td></tr>
</table>

<br />

</div>

<div align="center"><table><tr><td width="560">

## Get started

```bash
git clone https://github.com/Quantum404Void/void-blog.git
cd void-blog
npm install
npm run dev
```

First deploy — run D1 migrations:

```bash
npx wrangler d1 execute void-blog-posts --remote \
  --file=migrations/0001_init.sql
npx wrangler d1 execute void-blog-posts --remote \
  --file=migrations/0002_fts_wordcount.sql
```

CF Pages env vars: `NUXT_ADMIN_PASSWORD` · `NUXT_JWT_SECRET`

<br />

---

MIT © 2026 [Void](https://void.redx.space)

</td></tr></table></div>
