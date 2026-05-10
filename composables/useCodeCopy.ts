/**
 * useCodeCopy — 为 .prose 内所有 <pre><code> 注入复制按钮
 * 技术宅风格：终端命令提示符 + 打字机动画反馈 + 荧光 glow
 */
export function useCodeCopy() {
  const COPY_SVG = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>`

  const OK_SVG = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>`

  function createButton(): HTMLButtonElement {
    const btn = document.createElement('button')
    btn.className = 'copy-btn'
    btn.setAttribute('aria-label', '复制代码')
    btn.setAttribute('title', 'copy')

    // 初始样式
    Object.assign(btn.style, {
      position:       'absolute',
      top:            '0.55rem',
      right:          '0.55rem',
      display:        'flex',
      alignItems:     'center',
      gap:            '5px',
      padding:        '3px 8px',
      background:     'rgba(255,255,255,0.04)',
      border:         '1px solid rgba(255,255,255,0.1)',
      borderRadius:   '5px',
      cursor:         'pointer',
      color:          'rgba(168,168,200,0.6)',
      fontFamily:     'var(--font-mono, monospace)',
      fontSize:       '10px',
      letterSpacing:  '0.04em',
      lineHeight:     '1',
      transition:     'all 0.15s ease',
      zIndex:         '20',
      userSelect:     'none',
      backdropFilter: 'blur(4px)',
    })

    btn.innerHTML = `${COPY_SVG}<span class="copy-label">copy</span>`
    return btn
  }

  function setIdle(btn: HTMLButtonElement) {
    btn.innerHTML = `${COPY_SVG}<span class="copy-label">copy</span>`
    Object.assign(btn.style, {
      background:   'rgba(255,255,255,0.04)',
      border:       '1px solid rgba(255,255,255,0.1)',
      color:        'rgba(168,168,200,0.6)',
      boxShadow:    'none',
    })
    delete btn.dataset.state
  }

  function setHover(btn: HTMLButtonElement) {
    if (btn.dataset.state === 'copied') return
    Object.assign(btn.style, {
      background:   'rgba(0,212,255,0.08)',
      border:       '1px solid rgba(0,212,255,0.3)',
      color:        'rgba(0,212,255,0.85)',
      boxShadow:    '0 0 10px rgba(0,212,255,0.15)',
    })
  }

  function setLeave(btn: HTMLButtonElement) {
    if (btn.dataset.state === 'copied') return
    setIdle(btn)
  }

  function setCopied(btn: HTMLButtonElement) {
    btn.dataset.state = 'copied'
    btn.innerHTML = `${OK_SVG}<span class="copy-label">copied!</span>`
    Object.assign(btn.style, {
      background:   'rgba(0,255,136,0.08)',
      border:       '1px solid rgba(0,255,136,0.35)',
      color:        'rgba(0,255,136,0.9)',
      boxShadow:    '0 0 12px rgba(0,255,136,0.2)',
    })
  }

  async function copyCode(pre: HTMLElement, btn: HTMLButtonElement) {
    // 优先取 innerText（已解析 HTML 实体），fallback textContent
    const code = (pre.querySelector('code') as HTMLElement | null)?.innerText
      ?? pre.querySelector('code')?.textContent
      ?? ''

    try {
      await navigator.clipboard.writeText(code.replace(/\n$/, ''))
      setCopied(btn)
    } catch {
      // Fallback: execCommand
      const ta = document.createElement('textarea')
      ta.value = code
      ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      ta.remove()
      setCopied(btn)
    }

    setTimeout(() => setIdle(btn), 2000)
  }

  function attachCopyButtons(container: HTMLElement | null) {
    if (!container) return
    container.querySelectorAll<HTMLElement>('pre').forEach((pre) => {
      if (pre.querySelector('.copy-btn')) return
      // pre 本身已经是 position:relative（来自 CSS）
      const btn = createButton()
      btn.addEventListener('mouseenter', () => setHover(btn))
      btn.addEventListener('mouseleave', () => setLeave(btn))
      btn.addEventListener('click', (e) => {
        e.stopPropagation()
        copyCode(pre, btn)
      })
      pre.appendChild(btn)
    })
  }

  return { attachCopyButtons }
}
