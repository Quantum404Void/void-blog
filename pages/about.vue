<template>
  <div class="min-h-screen bg-[var(--color-void)]">
    <AppNav :crumbs="[{ label: 'about' }]" />

    <main class="max-w-3xl mx-auto px-6 py-16">
      <!-- 终端头部 -->
      <div class="font-mono mb-12">
        <div class="text-xs space-y-1 mb-6">
          <div>
            <span class="text-[var(--color-neon-green)]">root@void</span>
            <span class="text-[var(--color-text-muted)]">:~$ </span>
            <span class="text-[var(--color-text-secondary)]">whoami</span>
          </div>
          <div class="text-[var(--color-text-primary)] pl-2">{{ authorName }} | Software Engineer</div>
          <div class="mt-2">
            <span class="text-[var(--color-neon-green)]">root@void</span>
            <span class="text-[var(--color-text-muted)]">:~$ </span>
            <span class="text-[var(--color-text-secondary)]">cat /proc/self/status | grep -i name</span>
          </div>
          <div class="text-[var(--color-text-primary)] pl-2">Name: 好奇心驱动的工程师</div>
          <div class="mt-2">
            <span class="text-[var(--color-neon-green)]">root@void</span>
            <span class="text-[var(--color-text-muted)]">:~$ </span>
            <span class="text-[var(--color-text-secondary)]">history | grep -c "折腾"</span>
          </div>
          <div class="text-[var(--color-neon-cyan)] pl-2">无数次<span class="cursor-blink"></span></div>
        </div>
        <p class="text-xs text-[var(--color-text-secondary)] leading-relaxed border-l-2 border-[rgba(0,212,255,0.3)] pl-4">
          喜欢研究技术背后的原理，也喜欢把东西做出来、做好用。
        </p>
      </div>

      <div class="space-y-6 font-mono text-sm">
        <!-- whoami 信息 -->
        <div class="border border-[var(--color-void-border)] rounded-xl p-6 bg-[var(--color-void-card)]">
          <div class="text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest mb-4 flex items-center gap-2">
            <span class="text-[var(--color-neon-green)]">▸</span> cat ./whoami
          </div>
          <div class="space-y-1.5 text-[var(--color-text-secondary)] text-xs">
            <div class="flex gap-3">
              <span class="text-[var(--color-neon-cyan)] w-16 shrink-0">name</span>
              <span class="text-[var(--color-text-primary)]">{{ authorName }}</span>
            </div>
            <div class="flex gap-3">
              <span class="text-[var(--color-neon-cyan)] w-16 shrink-0">role</span>
              <span class="text-[var(--color-text-primary)]">C++ / Python / AI Agent / 桌面应用工程师</span>
            </div>
            <div class="flex gap-3">
              <span class="text-[var(--color-neon-cyan)] w-16 shrink-0">since</span>
              <span class="text-[var(--color-text-primary)]">2022.08</span>
            </div>
            <div class="flex gap-3">
              <span class="text-[var(--color-neon-cyan)] w-16 shrink-0">motto</span>
              <span class="text-[var(--color-text-muted)] italic">{{ authorMotto }}</span>
            </div>
          </div>
        </div>

        <!-- 这里写什么 -->
        <div class="border border-[var(--color-void-border)] rounded-xl p-6 bg-[var(--color-void-card)]">
          <div class="text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest mb-4 flex items-center gap-2">
            <span class="text-[var(--color-neon-cyan)]">▸</span> cat ./topics
            <span class="text-[var(--color-text-muted)] normal-case tracking-normal ml-1">没有固定方向，碰到值得记的就写</span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div v-for="topic in topics" :key="topic.tag"
              class="flex items-start gap-3 p-3 rounded-lg border border-[var(--color-void-border)] hover:border-[rgba(0,212,255,0.3)] hover:bg-[rgba(0,212,255,0.03)] transition-all">
              <span class="text-base shrink-0">{{ topic.icon }}</span>
              <div>
                <div class="text-[var(--color-text-primary)] text-xs font-semibold">{{ topic.title }}</div>
                <div class="text-[var(--color-text-muted)] text-[10px] mt-0.5 leading-relaxed">{{ topic.desc }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 技术栈 -->
        <div class="border border-[var(--color-void-border)] rounded-xl p-6 bg-[var(--color-void-card)]">
          <div class="text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest mb-4 flex items-center gap-2">
            <span class="text-[var(--color-neon-purple)]">▸</span> cat ./package.json | jq '.stack[]'
          </div>
          <div class="flex flex-wrap gap-2">
            <span v-for="tech in stack" :key="tech.name"
              class="font-mono text-xs px-3 py-1.5 rounded-lg border transition-all hover:scale-105 cursor-default"
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
          <div class="space-y-2 text-xs">
            <a :href="authorGithub" target="_blank" rel="noopener"
              class="flex items-center gap-3 group">
              <span class="text-[var(--color-text-muted)] w-16 shrink-0 group-hover:text-[var(--color-neon-green)] transition-colors">GitHub</span>
              <span class="text-[var(--color-text-muted)]">→</span>
              <span class="text-[var(--color-neon-green)] group-hover:underline">{{ authorGithub.replace('https://','') }}</span>
            </a>
            <a :href="`mailto:${authorEmail}`"
              class="flex items-center gap-3 group">
              <span class="text-[var(--color-text-muted)] w-16 shrink-0 group-hover:text-[var(--color-neon-cyan)] transition-colors">Email</span>
              <span class="text-[var(--color-text-muted)]">→</span>
              <span class="text-[var(--color-neon-cyan)] group-hover:underline">{{ authorEmail }}</span>
            </a>
            <NuxtLink href="/rss.xml"
              class="flex items-center gap-3 group">
              <span class="text-[var(--color-text-muted)] w-16 shrink-0 group-hover:text-[var(--color-neon-purple)] transition-colors">RSS</span>
              <span class="text-[var(--color-text-muted)]">→</span>
              <span class="text-[var(--color-neon-purple)] group-hover:underline">{{ siteUrl }}/rss.xml</span>
            </NuxtLink>
          </div>
        </div>

        <!-- 本站 -->
        <div class="border border-[var(--color-void-border)] rounded-xl p-6 bg-[var(--color-void-card)]">
          <div class="text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest mb-4 flex items-center gap-2">
            <span class="text-[var(--color-neon-green)]">▸</span> cat ./package.json | jq '.dependencies | keys[]'
          </div>
          <div class="text-xs space-y-1.5 text-[var(--color-text-muted)]">
            <div class="flex gap-3 items-baseline">
              <span class="text-[var(--color-neon-cyan)] shrink-0 w-28">"nuxt"</span>
              <span class="opacity-40">#</span>
              <span>v3 — Vue 全栈框架</span>
            </div>
            <div class="flex gap-3 items-baseline">
              <span class="text-[var(--color-neon-cyan)] shrink-0 w-28">"tailwindcss"</span>
              <span class="opacity-40">#</span>
              <span>v4 — CSS-first 配置</span>
            </div>
            <div class="flex gap-3 items-baseline">
              <span class="text-[var(--color-neon-cyan)] shrink-0 w-28">"cloudflare-d1"</span>
              <span class="opacity-40">#</span>
              <span>SQLite at the edge，无服务器</span>
            </div>
            <div class="flex gap-3 items-baseline">
              <span class="text-[var(--color-neon-cyan)] shrink-0 w-28">"source"</span>
              <span class="opacity-40">#</span>
              <a :href="authorGithub + '/void-blog'" target="_blank"
                class="text-[var(--color-neon-green)] hover:underline">
                GitHub (MIT) — 随便用
              </a>
            </div>
          </div>
          <!-- curl 提示 -->
          <div class="mt-4 pt-4 border-t border-[var(--color-void-border)] text-[10px] text-[var(--color-text-muted)]">
            <span class="text-[var(--color-neon-green)]">$</span>
            curl {{ siteUrl }}/about
            <span class="ml-2 text-[var(--color-text-muted)] opacity-50"># terminal 用户专属彩蛋</span>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
const { siteUrl, siteName, authorName, authorEmail, authorGithub, authorMotto } = useSiteConfig()
useSeoMeta({
  title: `About | ${siteName}`,
  description: `${authorName} — 好奇心驱动的工程师，专注 C++ / Python / AI Agent / 桌面应用。${authorMotto}`,
  ogTitle: `About | ${siteName}`,
  ogDescription: `${authorName} — 好奇心驱动的工程师，专注 C++ / Python / AI Agent / 桌面应用。`,
  ogUrl: `${siteUrl}/about`,
})

const topics = [
  { icon: '⚙️', tag: 'cpp',      title: '系统与底层',  desc: 'C++、驱动、通信协议、性能调优' },
  { icon: '🐍', tag: 'python',   title: 'Python',       desc: '数据处理、自动化脚本、asyncio、类型注解' },
  { icon: '🖥️', tag: 'electron', title: '桌面应用',    desc: 'Windows/Linux 跨平台、Electron、Qt' },
  { icon: '⚡',  tag: 'vue',      title: '前端工程',    desc: 'Vue3、Vite+、现代工具链、TypeScript' },
  { icon: '🤖', tag: 'agent',    title: 'AI Agent',    desc: 'LLM 工具链、自动化工作流、记忆系统' },
  { icon: '🐧', tag: 'linux',    title: '网络与工具',  desc: '代理协议、Linux、开发效率工具' },
  { icon: '🧮', tag: 'algo',     title: '算法',        desc: '不为刷题，为理解' },
]

const stack = [
  { name: 'C++17',       color: '#00d4ff' },
  { name: 'Python 3',    color: '#ffd43b' },
  { name: 'Qt',          color: '#41cd52' },
  { name: 'Vue 3',       color: '#42b883' },
  { name: 'TypeScript',  color: '#3178c6' },
  { name: 'Electron',    color: '#9feaf9' },
  { name: 'Linux',       color: '#f4a837' },
  { name: 'Nuxt 3',      color: '#00dc82' },
  { name: 'Cloudflare',  color: '#f6821f' },
  { name: 'OpenClaw',    color: '#b44cff' },
]
</script>
