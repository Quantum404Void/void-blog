// server/routes/about.ts
// curl https://void.redx.space/about → ASCII art for terminal users
export default defineEventHandler(async (event) => {
  const ua = getHeader(event, 'user-agent') || ''
  const isCurl = ua.toLowerCase().startsWith('curl')
  if (!isCurl) return // 非 curl 走正常页面路由

  const config = useRuntimeConfig()
  const text = `
\x1b[32m
 ██╗   ██╗ ██████╗ ██╗██████╗    ██████╗ ███████╗██╗   ██╗
 ██║   ██║██╔═══██╗██║██╔══██╗   ██╔══██╗██╔════╝██║   ██║
 ██║   ██║██║   ██║██║██║  ██║   ██║  ██║█████╗  ██║   ██║
 ╚██╗ ██╔╝██║   ██║██║██║  ██║   ██║  ██║██╔══╝  ╚██╗ ██╔╝
  ╚████╔╝ ╚██████╔╝██║██████╔╝   ██████╔╝███████╗ ╚████╔╝
   ╚═══╝   ╚═════╝ ╚═╝╚═════╝    ╚═════╝ ╚══════╝  ╚═══╝
\x1b[0m
\x1b[36m  ${config.public.authorName} @ ${config.public.siteName}\x1b[0m
\x1b[90m  C++ / AI Agent / 桌面应用 / 折腾不止\x1b[0m

\x1b[33m  blog    \x1b[0m${config.public.siteUrl}/blog
\x1b[33m  github  \x1b[0m${config.public.authorGithub}
\x1b[33m  rss     \x1b[0m${config.public.siteUrl}/rss.xml
\x1b[33m  search  \x1b[0m${config.public.siteUrl}/search

\x1b[90m  $ curl ${config.public.siteUrl}/about  # you are here\x1b[0m
\x1b[32m  $ _\x1b[0m

`
  setHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
  return text
})
