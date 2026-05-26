// server/middleware/curl-about.ts
// curl https://void.redx.space/about → ASCII art，其他 user-agent 走正常页面
export default defineEventHandler(async (event) => {
  if (getRequestURL(event).pathname !== '/about') return
  const ua = getHeader(event, 'user-agent') || ''
  if (!ua.toLowerCase().startsWith('curl')) return

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
\x1b[90m  C++ / Python / AI Agent / 桌面应用\x1b[0m

\x1b[33m  blog    \x1b[0m${config.public.siteUrl}/blog
\x1b[33m  github  \x1b[0m${config.public.authorGithub}
\x1b[33m  email   \x1b[0m${config.public.authorEmail}
\x1b[33m  rss     \x1b[0m${config.public.siteUrl}/rss.xml
\x1b[33m  search  \x1b[0m${config.public.siteUrl}/search

\x1b[90m  $ curl ${config.public.siteUrl}/about  # you are here\x1b[0m
\x1b[32m  $ _\x1b[0m

`
  setHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
  return text
})
