<template>
  <div class="min-h-screen bg-[var(--color-void)]">
    <AppNav :crumbs="[{ label: 'about' }]" />

    <main class="max-w-3xl mx-auto px-6 py-16">
      <!-- 终端风头部 -->
      <div class="font-mono mb-12">
        <p class="text-[10px] text-[var(--color-text-muted)] tracking-[0.2em] uppercase mb-4">
          <span class="text-[var(--color-neon-green)]">root@void</span>
          <span class="text-[var(--color-text-muted)]">:~$</span>
          <span class="text-[var(--color-text-secondary)]"> cat /etc/whoami</span>
        </p>
        <pre class="text-[var(--color-neon-green)] text-xs leading-relaxed opacity-80 select-none">{{ asciiLogo }}</pre>
      </div>

      <!-- 身份信息 -->
      <div class="space-y-8 font-mono text-sm">
        <!-- whoami -->
        <div class="border border-[var(--color-void-border)] rounded-xl p-6 bg-[var(--color-void-card)]">
          <div class="text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest mb-4 flex items-center gap-2">
            <span class="text-[var(--color-neon-green)]">▸</span> whoami
          </div>
          <div class="space-y-2 text-[var(--color-text-secondary)]">
            <div><span class="text-[var(--color-neon-cyan)]">name</span>    = <span class="text-[var(--color-text-primary)]">{{ authorName }}</span></div>
            <div><span class="text-[var(--color-neon-cyan)]">role</span>    = <span class="text-[var(--color-text-primary)]">Software Engineer</span></div>
            <div><span class="text-[var(--color-neon-cyan)]">focus</span>   = <span class="text-[var(--color-text-primary)]">C++ · AI Agent · 桌面应用</span></div>
            <div><span class="text-[var(--color-neon-cyan)]">since</span>   = <span class="text-[var(--color-text-primary)]">2022</span></div>
            <div><span class="text-[var(--color-neon-cyan)]">online</span>  = <span class="text-[var(--color-text-primary)]">{{ siteUrl }}</span></div>
          </div>
        </div>

        <!-- 这里写什么 -->
        <div class="border border-[var(--color-void-border)] rounded-xl p-6 bg-[var(--color-void-card)]">
          <div class="text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest mb-4 flex items-center gap-2">
            <span class="text-[var(--color-neon-cyan)]">▸</span> cat ./topics
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div v-for="topic in topics" :key="topic.tag"
              class="flex items-start gap-3 p-3 rounded-lg border border-[var(--color-void-border)] hover:border-[rgba(0,212,255,0.3)] hover:bg-[rgba(0,212,255,0.03)] transition-all cursor-default">
              <span class="text-lg shrink-0">{{ topic.icon }}</span>
              <div>
                <div class="text-[var(--color-text-primary)] text-xs font-bold">{{ topic.title }}</div>
                <div class="text-[var(--color-text-muted)] text-[10px] mt-0.5">{{ topic.desc }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 技术栈 -->
        <div class="border border-[var(--color-void-border)] rounded-xl p-6 bg-[var(--color-void-card)]">
          <div class="text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest mb-4 flex items-center gap-2">
            <span class="text-[var(--color-neon-purple)]">▸</span> cat ./package.json | jq '.stack'
          </div>
          <div class="flex flex-wrap gap-2">
            <span v-for="tech in stack" :key="tech.name"
              class="font-mono text-xs px-3 py-1.5 rounded-lg border transition-all hover:scale-105"
              :style="`color:${tech.color};border-color:${tech.color}33;background:${tech.color}0a`">
              {{ tech.name }}
            </span>
          </div>
        </div>

        <!-- 联系 -->
        <div class="border border-[var(--color-void-border)] rounded-xl p-6 bg-[var(--color-void-card)]">
          <div class="text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest mb-4 flex items-center gap-2">
            <span class="text-[var(--color-neon-pink)]">▸</span> cat ./contact
          </div>
          <div class="space-y-2 text-[var(--color-text-secondary)]">
            <a :href="authorGithub" target="_blank" rel="noopener"
              class="flex items-center gap-3 hover:text-[var(--color-neon-green)] transition-colors group">
              <span class="text-[var(--color-text-muted)] group-hover:text-[var(--color-neon-green)]">GitHub</span>
              <span class="text-[var(--color-text-muted)] font-mono text-xs">→</span>
              <span class="text-[var(--color-neon-green)] text-xs">{{ authorGithub.replace('https://','') }}</span>
            </a>
            <div class="flex items-center gap-3">
              <span class="text-[var(--color-text-muted)]">RSS</span>
              <span class="text-[var(--color-text-muted)] font-mono text-xs">→</span>
              <NuxtLink href="/rss.xml" class="text-[var(--color-neon-cyan)] text-xs hover:underline">{{ siteUrl }}/rss.xml</NuxtLink>
            </div>
          </div>
        </div>

        <!-- 本站技术栈 -->
        <div class="border border-[var(--color-void-border)] rounded-xl p-6 bg-[var(--color-void-card)]">
          <div class="text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest mb-4 flex items-center gap-2">
            <span class="text-[var(--color-neon-green)]">▸</span> this site runs on
          </div>
          <div class="space-y-1 text-xs text-[var(--color-text-muted)]">
            <div><span class="text-[var(--color-neon-cyan)]">framework</span>  <span class="text-[var(--color-text-secondary)] ml-2">Nuxt 3 + Tailwind v4</span></div>
            <div><span class="text-[var(--color-neon-cyan)]">database</span>   <span class="text-[var(--color-text-secondary)] ml-2">Cloudflare D1 (SQLite)</span></div>
            <div><span class="text-[var(--color-neon-cyan)]">hosting</span>    <span class="text-[var(--color-text-secondary)] ml-2">Cloudflare Pages</span></div>
            <div><span class="text-[var(--color-neon-cyan)]">source</span>     <a :href="authorGithub + '/void-blog'" target="_blank" class="text-[var(--color-neon-green)] ml-2 hover:underline">GitHub (MIT)</a></div>
            <div><span class="text-[var(--color-neon-cyan)]">curl</span>       <span class="text-[var(--color-text-secondary)] ml-2">curl {{ siteUrl }}/about</span></div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
const { siteUrl, siteName, authorName, authorGithub } = useSiteConfig()
useSeoMeta({
  title: `About | ${siteName}`,
  description: `${authorName} — C++ / AI Agent / 桌面应用工程师，${siteName} 博客作者`,
  ogTitle: `About | ${siteName}`,
  ogUrl: `${siteUrl}/about`,
})

const asciiLogo = `
 ██╗   ██╗ ██████╗ ██╗██████╗     ██████╗ ███████╗██╗   ██╗
 ██║   ██║██╔═══██╗██║██╔══██╗    ██╔══██╗██╔════╝██║   ██║
 ██║   ██║██║   ██║██║██║  ██║    ██║  ██║█████╗  ██║   ██║
 ╚██╗ ██╔╝██║   ██║██║██║  ██║    ██║  ██║██╔══╝  ╚██╗ ██╔╝
  ╚████╔╝ ╚██████╔╝██║██████╔╝    ██████╔╝███████╗ ╚████╔╝
   ╚═══╝   ╚═════╝ ╚═╝╚═════╝     ╚═════╝ ╚══════╝  ╚═══╝`.trim()

const topics = [
  { icon: '⚙️', tag: 'cpp', title: '系统与底层', desc: 'C++、驱动、通信协议、性能调优' },
  { icon: '🖥️', tag: 'electron', title: '桌面应用', desc: 'Windows/Linux、Electron、Qt' },
  { icon: '⚡', tag: 'vue', title: '前端工程', desc: 'Vue3、Vite、TypeScript' },
  { icon: '🤖', tag: 'agent', title: 'AI Agent', desc: 'LLM 工具链、自动化、记忆系统' },
  { icon: '🐧', tag: 'linux', title: '网络与工具', desc: '代理协议、Linux、开发效率' },
  { icon: '🧮', tag: '算法', title: '算法', desc: '不为刷题，为理解' },
]

const stack = [
  { name: 'C++17', color: '#00d4ff' },
  { name: 'Qt', color: '#41cd52' },
  { name: 'Vue 3', color: '#42b883' },
  { name: 'TypeScript', color: '#3178c6' },
  { name: 'Electron', color: '#9feaf9' },
  { name: 'Python', color: '#ffd43b' },
  { name: 'Linux', color: '#f4a837' },
  { name: 'Nuxt 3', color: '#00dc82' },
  { name: 'Cloudflare', color: '#f6821f' },
  { name: 'OpenClaw', color: '#b44cff' },
]
</script>
