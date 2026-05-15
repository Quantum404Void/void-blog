/**
 * useCodeCopy — 为 .prose 内 Shiki 代码块注入复制按钮
 * 定位由 CSS .copy-btn 控制（absolute top-right），JS 只处理交互状态
 */
export function useCodeCopy() {
  function attachCopyButtons(container: HTMLElement | null) {
    if (!container) return
    container.querySelectorAll<HTMLElement>('pre.shiki').forEach((pre) => {
      if (pre.querySelector('.copy-btn')) return

      const btn = document.createElement('button')
      btn.className = 'copy-btn'
      btn.setAttribute('aria-label', '复制代码')
      btn.setAttribute('title', 'copy')
      btn.innerHTML = iconCopy + '<span class="copy-label">copy</span>'

      btn.addEventListener('mouseenter', () => {
        if (!btn.dataset.copied) {
          btn.style.background = 'rgba(0,212,255,0.08)'
          btn.style.borderColor = 'rgba(0,212,255,0.3)'
          btn.style.color = 'rgba(0,212,255,0.85)'
        }
      })
      btn.addEventListener('mouseleave', () => {
        if (!btn.dataset.copied) resetStyle(btn)
      })
      btn.addEventListener('click', async () => {
        const code = pre.querySelector('code')?.innerText ?? pre.innerText
        try {
          await navigator.clipboard.writeText(code.replace(/\n$/, ''))
        } catch {
          const ta = Object.assign(document.createElement('textarea'), { value: code, style: 'position:fixed;opacity:0' })
          document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove()
        }
        btn.dataset.copied = '1'
        btn.innerHTML = iconCheck + '<span class="copy-label">copied!</span>'
        btn.style.background = 'rgba(0,255,136,0.08)'
        btn.style.borderColor = 'rgba(0,255,136,0.35)'
        btn.style.color = 'rgba(0,255,136,0.9)'
        setTimeout(() => {
          delete btn.dataset.copied
          btn.innerHTML = iconCopy + '<span class="copy-label">copy</span>'
          resetStyle(btn)
        }, 2000)
      })
      pre.appendChild(btn)
    })
  }

  return { attachCopyButtons }
}

function resetStyle(btn: HTMLButtonElement) {
  btn.style.background = ''
  btn.style.borderColor = ''
  btn.style.color = ''
}

const iconCopy = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`
const iconCheck = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`
