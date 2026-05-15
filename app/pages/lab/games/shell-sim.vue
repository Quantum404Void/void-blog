<template>
  <div class="min-h-screen bg-[var(--color-void)] text-[var(--color-text-primary)]">
    <AppNav :crumbs="[{ label: 'lab', href: '/lab' }, { label: 'games', href: '/lab' }, { label: 'shell-sim' }]" />

    <div class="max-w-5xl mx-auto px-4 py-8">
      <div class="mb-6">
        <h1 class="text-2xl font-mono font-bold text-[var(--color-neon-green)] mb-1">
          $ browser-shell
        </h1>
        <p class="text-[var(--color-text-muted)] font-mono text-sm">
          A simulated Unix shell running in your browser. Try <span class="text-[var(--color-neon-cyan)]">neofetch</span>, <span class="text-[var(--color-neon-cyan)]">sl</span>, or <span class="text-[var(--color-neon-cyan)]">help</span>.
        </p>
      </div>

      <!-- Terminal Window -->
      <div
        class="rounded-lg border border-[var(--color-void-border)] overflow-hidden shadow-2xl"
        style="box-shadow: 0 0 30px rgba(0,212,255,0.1)"
      >
        <!-- Title bar -->
        <div class="flex items-center gap-2 px-4 py-2 bg-[var(--color-void-card)] border-b border-[var(--color-void-border)]">
          <div class="w-3 h-3 rounded-full bg-red-500 opacity-80"></div>
          <div class="w-3 h-3 rounded-full bg-yellow-500 opacity-80"></div>
          <div class="w-3 h-3 rounded-full bg-green-500 opacity-80"></div>
          <span class="ml-3 font-mono text-xs text-[var(--color-text-muted)]">void@blog — bash — 120×36</span>
        </div>

        <!-- Terminal body -->
        <div
          ref="terminalEl"
          class="bg-black font-mono text-sm p-4 overflow-y-auto cursor-text"
          style="height: 520px; color: #39ff14;"
          @click="focusInput"
        >
          <!-- Output lines -->
          <div v-for="(line, i) in outputLines" :key="i" v-html="line" class="leading-5 whitespace-pre-wrap break-all"></div>

          <!-- Current input line -->
          <div v-if="!topMode" class="flex items-center leading-5">
            <span class="text-[var(--color-neon-cyan)]">void@blog</span>
            <span style="color:#aaa">:</span>
            <span class="text-yellow-400">{{ cwd }}</span>
            <span style="color:#aaa">$&nbsp;</span>
            <span style="color:#39ff14">{{ currentInput }}</span>
            <span
              class="inline-block w-2 h-4 ml-px"
              :style="{ background: cursorVisible ? '#39ff14' : 'transparent' }"
            ></span>
          </div>

          <!-- Hidden actual input -->
          <input
            ref="inputEl"
            v-model="currentInput"
            class="opacity-0 absolute w-0 h-0"
            @keydown="handleKeydown"
            autocomplete="off"
            autocorrect="off"
            autocapitalize="off"
            spellcheck="false"
          />
        </div>
      </div>

      <p class="mt-4 text-xs text-[var(--color-text-muted)] font-mono text-center">
        Type <kbd class="px-1 py-0.5 rounded border border-[var(--color-void-border)] text-[var(--color-neon-cyan)]">help</kbd> to see available commands
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
const { siteName } = useSiteConfig()
useSeoMeta({ title: `Shell Sim | ${siteName}` })
import { ref, onMounted, onUnmounted, nextTick } from 'vue'

definePageMeta({ layout: 'default' })

// --- Virtual Filesystem ---
interface FSNode {
  type: 'dir' | 'file'
  content?: string
  children?: Record<string, FSNode>
}

const fs: FSNode = {
  type: 'dir',
  children: {
    home: {
      type: 'dir',
      children: {
        void: {
          type: 'dir',
          children: {
            'README.md': {
              type: 'file',
              content: `# void-blog

A personal blog powered by Nuxt 3 + Vue 3 + Tailwind v4.

## About
This is void's digital home on the internet. Built with love and caffeine.

## Stack
- Nuxt 3 (SSG mode)
- Vue 3 Composition API
- Tailwind CSS v4
- Dark neon theme

## Running
\`\`\`
npm run dev
npm run build
\`\`\`

Happy hacking! 🔧`
            },
            '.bashrc': {
              type: 'file',
              content: `# ~/.bashrc — void's config

export USER=void
export HOME=/home/void
export SHELL=/bin/bash
export PATH=$HOME/.local/bin:$PATH
export EDITOR=nvim

alias ll='ls -la'
alias gs='git status'
alias gc='git commit'
alias vim='nvim'
alias python='python3'

# Neon prompt
PS1='\\[\\e[36m\\]\\u@\\h\\[\\e[0m\\]:\\[\\e[33m\\]\\w\\[\\e[0m\\]$ '`
            },
            'secret.txt': {
              type: 'file',
              content: `🎉 You found the Easter Egg!

The answer to life, the universe, and everything: 42

But seriously... here's something useful:

  void --version 0.1.0-alpha
  
  "Any sufficiently advanced technology is indistinguishable from magic."
  — Arthur C. Clarke

  "Real programmers count from 0."
  — Unknown

You made it here. That means you're curious.
Stay curious. Keep hacking. 🔧`
            },
            'projects': {
              type: 'dir',
              children: {
                'void-blog': { type: 'dir', children: {} },
                'neural-net': { type: 'dir', children: {} },
                'dotfiles': { type: 'dir', children: {} }
              }
            }
          }
        }
      }
    },
    etc: {
      type: 'dir',
      children: {
        'hostname': { type: 'file', content: 'void-blog\n' },
        'shells': { type: 'file', content: `/bin/sh
/bin/bash
/bin/zsh
/usr/bin/fish` },
        'passwd': {
          type: 'file',
          content: `root:x:0:0:root:/root:/bin/bash
void:x:1000:1000:Void,,,:/home/void:/bin/bash
daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin`
        }
      }
    },
    var: {
      type: 'dir',
      children: {
        log: {
          type: 'dir',
          children: {
            'syslog': {
              type: 'file',
              content: `May 10 01:00:01 void-blog systemd[1]: Started void-blog.service
May 10 01:00:02 void-blog nuxt[1234]: Nuxt 3 server started on :3000
May 10 01:00:03 void-blog nginx[5678]: nginx/1.24.0 started
May 10 01:00:10 void-blog kernel: [    0.000000] Initializing void-blog kernel
May 10 01:01:00 void-blog void[9999]: Blog post published: "Hello World"`
            },
            'auth.log': {
              type: 'file',
              content: `May 10 00:59:58 void-blog sshd[4321]: Accepted publickey for void
May 10 01:00:00 void-blog sudo[4322]: void : TTY=pts/0 ; COMMAND=/bin/bash`
            }
          }
        }
      }
    },
    tmp: { type: 'dir', children: {} },
    bin: { type: 'dir', children: {} },
    usr: { type: 'dir', children: { bin: { type: 'dir', children: {} } } }
  }
}

// --- State ---
const terminalEl = ref<HTMLElement>()
const inputEl = ref<HTMLInputElement>()
const outputLines = ref<string[]>([])
const currentInput = ref('')
const cmdHistory = ref<string[]>([])
const historyIndex = ref(-1)
const cwd = ref('~')
const cwdPath = ref('/home/void')
const cursorVisible = ref(true)
const topMode = ref(false)

let cursorTimer: ReturnType<typeof setInterval>
let topTimer: ReturnType<typeof setInterval>
let slTimer: ReturnType<typeof setInterval>

// --- Helpers ---
function ansi(text: string, color: string) {
  return `<span style="color:${color}">${escHtml(text)}</span>`
}
function escHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
function green(s: string) { return `<span style="color:#39ff14">${escHtml(s)}</span>` }
function cyan(s: string) { return `<span style="color:#00d4ff">${escHtml(s)}</span>` }
function yellow(s: string) { return `<span style="color:#fbbf24">${escHtml(s)}</span>` }
function red(s: string) { return `<span style="color:#f87171">${escHtml(s)}</span>` }
function dim(s: string) { return `<span style="color:#6b7280">${escHtml(s)}</span>` }
function purple(s: string) { return `<span style="color:#a78bfa">${escHtml(s)}</span>` }

function pushLine(html: string) {
  outputLines.value.push(html)
}
function pushPrompt(cmd: string) {
  pushLine(`${cyan('void@blog')}${dim(':')}${yellow(cwd.value)}${dim('$ ')}${green(cmd)}`)
}
function pushEmpty() { pushLine('') }

async function scrollBottom() {
  await nextTick()
  if (terminalEl.value) {
    terminalEl.value.scrollTop = terminalEl.value.scrollHeight
  }
}

// --- FS navigation ---
function resolveNode(path: string): FSNode | null {
  const parts = path.split('/').filter(Boolean)
  let node: FSNode = fs
  for (const p of parts) {
    if (node.type !== 'dir' || !node.children?.[p]) return null
    node = node.children[p]
  }
  return node
}

function resolvePath(input: string): string {
  if (input === '~') return '/home/void'
  if (input.startsWith('~/')) return '/home/void/' + input.slice(2)
  if (input.startsWith('/')) return input
  if (input === '..') {
    const parts = cwdPath.value.split('/').filter(Boolean)
    parts.pop()
    return '/' + parts.join('/')
  }
  return cwdPath.value + '/' + input
}

function normalizePath(p: string): string {
  const parts = p.split('/').filter(Boolean)
  const stack: string[] = []
  for (const part of parts) {
    if (part === '..') stack.pop()
    else if (part !== '.') stack.push(part)
  }
  return '/' + stack.join('/')
}

function cwdDisplay(path: string): string {
  if (path === '/home/void') return '~'
  if (path.startsWith('/home/void/')) return '~/' + path.slice('/home/void/'.length)
  return path
}

// --- Commands ---
const COMMANDS = ['ls', 'cat', 'pwd', 'cd', 'echo', 'whoami', 'uname', 'ps', 'top', 'history', 'man', 'clear', 'neofetch', 'sl', 'cowsay', 'help']

function cmdLs(args: string[]): string[] {
  const flags = args.filter(a => a.startsWith('-'))
  const long = flags.some(f => f.includes('l'))
  const all = flags.some(f => f.includes('a'))
  const target = args.find(a => !a.startsWith('-'))
  const path = target ? normalizePath(resolvePath(target)) : cwdPath.value
  const node = resolveNode(path)
  if (!node || node.type !== 'dir') return [red(`ls: ${escHtml(path)}: No such file or directory`)]
  const entries = Object.entries(node.children || {})
  const filtered = all ? entries : entries.filter(([n]) => !n.startsWith('.'))
  if (!long) {
    const names = filtered.map(([name, n]) =>
      n.type === 'dir' ? cyan(name + '/') : green(name)
    )
    return [names.join('  ') || '']
  }
  const lines: string[] = [dim('total ' + filtered.length * 4)]
  for (const [name, n] of filtered) {
    const perm = n.type === 'dir' ? 'drwxr-xr-x' : '-rw-r--r--'
    const size = n.type === 'file' ? String((n.content?.length || 0)).padStart(6) : '   4096'
    const date = 'May 10 01:00'
    const nameStr = n.type === 'dir' ? cyan(name) : green(name)
    lines.push(`${dim(perm)}  ${dim('1 void void')} ${dim(size)} ${dim(date)} ${nameStr}`)
  }
  return lines
}

function cmdCat(args: string[]): string[] {
  if (!args.length) return [red('cat: missing file operand')]
  const path = normalizePath(resolvePath(args[0]))
  const node = resolveNode(path)
  if (!node) return [red(`cat: ${escHtml(args[0])}: No such file or directory`)]
  if (node.type === 'dir') return [red(`cat: ${escHtml(args[0])}: Is a directory`)]
  return (node.content || '').split('\n').map(l => escHtml(l))
}

function cmdEcho(args: string[]): string[] {
  const vars: Record<string, string> = {
    '$USER': 'void',
    '$HOME': '/home/void',
    '$SHELL': '/bin/bash',
    '$PATH': '/home/void/.local/bin:/usr/local/bin:/usr/bin:/bin',
    '$TERM': 'xterm-256color',
    '$LANG': 'en_US.UTF-8'
  }
  const text = args.join(' ').replace(/\$\w+/g, m => vars[m] || m)
  return [escHtml(text)]
}

function cmdMan(args: string[]): string[] {
  const manPages: Record<string, string[]> = {
    ls: ['LS(1)  —  list directory contents', '', 'USAGE: ls [-la] [path]', '  -l   long listing format', '  -a   show hidden files'],
    cat: ['CAT(1)  —  concatenate and print files', '', 'USAGE: cat <file>'],
    cd: ['CD(1)  —  change directory', '', 'USAGE: cd <dir | ~ | ..>'],
    echo: ['ECHO(1)  —  display a line of text', '', 'USAGE: echo [text]', 'Variables: $USER $HOME $SHELL $PATH'],
    neofetch: ['NEOFETCH(1)  —  system info tool', '', 'USAGE: neofetch', 'Displays system info with ASCII art.'],
    cowsay: ['COWSAY(1)  —  cow ASCII art', '', 'USAGE: cowsay <text>'],
    sl: ['SL(1)  —  steam locomotive', '', 'USAGE: sl', 'Runs a train across the terminal.'],
  }
  if (!args.length) return [red('What manual page do you want?')]
  const page = manPages[args[0]]
  if (!page) return [red(`No manual entry for ${escHtml(args[0])}`)]
  return page.map(l => escHtml(l))
}

function cmdPs(): string[] {
  return [
    dim('USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND'),
    'void      1234  0.0  1.2 123456 12345 pts/0    S    01:00   0:00 node server.js',
    'void      5678  0.1  0.8  98765  8765 pts/0    S    01:00   0:01 nginx: master',
    'void      9012  0.0  0.5  65432  5432 pts/1    Ss   01:00   0:00 bash',
    'void      9999  0.2  2.1 234567 21000 pts/1    S    01:00   0:03 nuxt dev',
    'void     10000  0.0  0.1  12345  1234 pts/1    R+   01:01   0:00 ps aux',
  ]
}

function cmdNeofetch(): string[] {
  const art = [
    '      ██╗   ██╗ ██████╗ ██╗██████╗ ',
    '      ██║   ██║██╔═══██╗██║██╔══██╗',
    '      ██║   ██║██║   ██║██║██║  ██║',
    '      ╚██╗ ██╔╝██║   ██║██║██║  ██║',
    '       ╚████╔╝ ╚██████╔╝██║██████╔╝',
    '        ╚═══╝   ╚═════╝ ╚═╝╚═════╝ ',
  ]
  const info = [
    `${cyan('void')}${dim('@')}${cyan('blog')}`,
    dim('─────────────────────────────'),
    `${cyan('OS:')}     void-linux 1.0 (browser edition)`,
    `${cyan('Host:')}   Chromium Virtual Machine`,
    `${cyan('Kernel:')} 6.5.0-void-blog #1 SMP x86_64`,
    `${cyan('Shell:')}  bash 5.2.15`,
    `${cyan('DE:')}     Nuxt 3 + Vue 3`,
    `${cyan('WM:')}     Tailwind CSS v4`,
    `${cyan('Theme:')}  Neon Dark`,
    `${cyan('Font:')}   JetBrains Mono`,
    `${cyan('RAM:')}    420MB / 1337MB`,
    `${cyan('CPU:')}    Intel i7-void @ 4.2GHz`,
    '',
    `<span style="background:#1a1a2e;color:#1a1a2e">███</span><span style="background:#00d4ff;color:#00d4ff">███</span><span style="background:#39ff14;color:#39ff14">███</span><span style="background:#a78bfa;color:#a78bfa">███</span><span style="background:#fbbf24;color:#fbbf24">███</span><span style="background:#f87171;color:#f87171">███</span>`,
  ]
  const lines: string[] = []
  const max = Math.max(art.length, info.length)
  for (let i = 0; i < max; i++) {
    const a = art[i] ? `<span style="color:#00d4ff">${escHtml(art[i])}</span>` : ' '.repeat(36)
    const b = info[i] || ''
    lines.push(`${a}   ${b}`)
  }
  return lines
}

function cmdCowsay(args: string[]): string[] {
  const text = args.join(' ') || 'Moo!'
  const pad = text.length + 2
  const border = '-'.repeat(pad)
  return [
    ` ${'_'.repeat(pad)} `,
    `< ${escHtml(text)} >`,
    ` ${'-'.repeat(pad)} `,
    '        \\   ^__^',
    '         \\  (oo)\\_______',
    '            (__)\\       )\\/\\',
    '                ||----w |',
    '                ||     ||',
  ]
}

function cmdHelp(): string[] {
  return [
    cyan('Available commands:'),
    '',
    `  ${green('ls')} [-la] [path]       list directory contents`,
    `  ${green('cat')} <file>            show file contents`,
    `  ${green('pwd')}                   print working directory`,
    `  ${green('cd')} <dir>              change directory`,
    `  ${green('echo')} <text>           print text (supports $USER $HOME $SHELL)`,
    `  ${green('whoami')}                print current user`,
    `  ${green('uname')} -a              system information`,
    `  ${green('ps')} aux               list processes`,
    `  ${green('top')}                   live process viewer (press q to quit)`,
    `  ${green('history')}               show command history`,
    `  ${green('man')} <cmd>             show manual page`,
    `  ${green('clear')}                 clear terminal`,
    `  ${green('neofetch')}              system info with ASCII art`,
    `  ${green('sl')}                    steam locomotive animation`,
    `  ${green('cowsay')} <text>         ASCII cow`,
    `  ${green('help')}                  show this help`,
    '',
    dim('Tip: Use ↑↓ for history, Tab for completion'),
  ]
}

// --- top mode ---
function fakeTopData(): string[] {
  const now = new Date().toLocaleTimeString()
  return [
    `${cyan('top')} - ${now} up 2:00, 1 user, load average: 0.42, 0.37, 0.30`,
    dim('Tasks:   5 total,   1 running,   4 sleeping,   0 stopped,   0 zombie'),
    dim('%Cpu(s): 3.2 us, 0.8 sy, 0.0 ni, 95.8 id, 0.2 wa, 0.0 hi, 0.0 si'),
    dim('MiB Mem:   1337.0 total,    917.0 free,    420.0 used,     0.0 buff/cache'),
    '',
    dim('  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND'),
    `${green(' 9999')} void      20   0  234567  21000   5678 S   ${(Math.random()*2).toFixed(1).padStart(4)}   2.1   0:03.00 nuxt-dev`,
    ` 1234 void      20   0  123456  12345   3456 S   0.3   0.9   0:00.10 node`,
    ` 5678 void      20   0   98765   8765   2345 S   0.1   0.7   0:01.00 nginx`,
    ` 9012 void      20   0   65432   5432   1234 S   0.0   0.4   0:00.00 bash`,
    ` 1000 void      20   0   12345   1234    567 R   0.0   0.1   0:00.00 top`,
    '',
    dim('Press q to quit'),
  ]
}

function startTop() {
  topMode.value = true
  outputLines.value = fakeTopData()
  topTimer = setInterval(() => {
    outputLines.value = fakeTopData()
    scrollBottom()
  }, 1000)
}

function stopTop() {
  clearInterval(topTimer)
  topMode.value = false
  outputLines.value = []
  cmdHistory.value = []
  // re-print welcome
  printWelcome()
}

// --- SL train ---
function cmdSl(): void {
  const frames = [
    [
      '      ====        ________                ___________            ',
      '  _D _|  |_______/        \\__I_I_____===__|___________|          ',
      '   |(_)---  |   H\\________/ |   |        =|___ ___|      _____   ',
      '   /     |  |   H  |  |     |   |         ||_| |_||     |_   _|  ',
      '  |      |  |   H  |__--------------------| [___] |   =|       | ',
      '  | ________|___H__/__|_____/[][]~\\_______|       |   -|       | ',
      '  |/ |   |-----------I_____I [][] []  D   |=======|____|_______|_',
      '__/ =| o |=-~~\\  /~~\\  /~~\\  /~~\\ ____Y___________|__|          ',
      ' |/-=|___|=    ||    ||    ||    |_____/~\\___/          |_D__D__D_|',
      '  \\_/      \\O=====O=====O=====O_/      \\_/                       ',
    ]
  ]
  let offset = 80
  const frame = frames[0]
  slTimer = setInterval(() => {
    const shifted = frame.map(l => ' '.repeat(Math.max(0, offset)) + l)
    const rendered = shifted.map(l => `<span style="color:#fbbf24">${escHtml(l)}</span>`)
    outputLines.value = [...outputLines.value.slice(0, -10 - 1), ...rendered]
    scrollBottom()
    offset -= 4
    if (offset < -120) {
      clearInterval(slTimer)
    }
  }, 80)
  // placeholder lines
  for (let i = 0; i < 10; i++) pushLine('')
}

// --- Execute command ---
function execute(raw: string) {
  const trimmed = raw.trim()
  if (!trimmed) {
    pushPrompt('')
    return
  }

  pushPrompt(trimmed)
  cmdHistory.value.unshift(trimmed)
  historyIndex.value = -1

  const parts = trimmed.split(/\s+/)
  const cmd = parts[0]
  const args = parts.slice(1)

  if (cmd === 'clear') {
    outputLines.value = []
    return
  }

  if (cmd === 'top') {
    startTop()
    return
  }

  if (cmd === 'sl') {
    cmdSl()
    pushEmpty()
    return
  }

  let result: string[] = []

  switch (cmd) {
    case 'ls': result = cmdLs(args); break
    case 'cat': result = cmdCat(args); break
    case 'pwd': result = [escHtml(cwdPath.value)]; break
    case 'cd': {
      const target = args[0] || '/home/void'
      const resolved = normalizePath(resolvePath(target))
      const node = resolveNode(resolved)
      if (!node) result = [red(`cd: ${escHtml(target)}: No such file or directory`)]
      else if (node.type !== 'dir') result = [red(`cd: ${escHtml(target)}: Not a directory`)]
      else {
        cwdPath.value = resolved
        cwd.value = cwdDisplay(resolved)
        result = []
      }
      break
    }
    case 'echo': result = cmdEcho(args); break
    case 'whoami': result = ['void']; break
    case 'uname': result = ['Linux void-blog 6.5.0-void #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux']; break
    case 'ps': result = cmdPs(); break
    case 'history':
      result = cmdHistory.value.slice().reverse().map((c, i) => `${dim(String(i + 1).padStart(4))}  ${escHtml(c)}`)
      break
    case 'man': result = cmdMan(args); break
    case 'neofetch': result = cmdNeofetch(); break
    case 'cowsay': result = cmdCowsay(args); break
    case 'help': result = cmdHelp(); break
    default:
      result = [red(`${escHtml(cmd)}: command not found`), dim(`Type 'help' to see available commands.`)]
  }

  result.forEach(l => pushLine(l))
  pushEmpty()
}

// --- Key handling ---
function handleKeydown(e: KeyboardEvent) {
  if (topMode.value) {
    if (e.key === 'q' || e.key === 'Q') {
      stopTop()
      pushEmpty()
      currentInput.value = ''
    }
    e.preventDefault()
    return
  }

  if (e.key === 'Enter') {
    const cmd = currentInput.value
    currentInput.value = ''
    execute(cmd)
    scrollBottom()
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    if (historyIndex.value < cmdHistory.value.length - 1) {
      historyIndex.value++
      currentInput.value = cmdHistory.value[historyIndex.value]
    }
  } else if (e.key === 'ArrowDown') {
    e.preventDefault()
    if (historyIndex.value > 0) {
      historyIndex.value--
      currentInput.value = cmdHistory.value[historyIndex.value]
    } else {
      historyIndex.value = -1
      currentInput.value = ''
    }
  } else if (e.key === 'Tab') {
    e.preventDefault()
    const parts = currentInput.value.split(/\s+/)
    if (parts.length === 1) {
      const prefix = parts[0]
      const matches = COMMANDS.filter(c => c.startsWith(prefix))
      if (matches.length === 1) {
        currentInput.value = matches[0] + ' '
      } else if (matches.length > 1) {
        pushPrompt(currentInput.value)
        pushLine(matches.join('  '))
        pushEmpty()
        scrollBottom()
      }
    }
  } else if (e.key === 'l' && e.ctrlKey) {
    e.preventDefault()
    outputLines.value = []
  } else if (e.key === 'c' && e.ctrlKey) {
    e.preventDefault()
    pushPrompt(currentInput.value + '^C')
    currentInput.value = ''
    pushEmpty()
    scrollBottom()
  }
}

function focusInput() {
  inputEl.value?.focus()
}

function printWelcome() {
  const lines = [
    `${cyan('void-blog')} ${dim('v1.0.0')} — Browser Shell Simulator`,
    dim('─────────────────────────────────────────────'),
    `Type ${green('help')} for available commands, ${green('neofetch')} for sysinfo.`,
    dim('Tip: Try `cat secret.txt` 👀'),
    '',
  ]
  lines.forEach(l => pushLine(l))
}

onMounted(() => {
  printWelcome()
  cursorTimer = setInterval(() => {
    cursorVisible.value = !cursorVisible.value
  }, 530)
  nextTick(() => inputEl.value?.focus())
})

onUnmounted(() => {
  clearInterval(cursorTimer)
  clearInterval(topTimer)
  clearInterval(slTimer)
})
</script>
