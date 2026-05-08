/**
 * 为 .prose 内所有 <pre><code> 注入复制按钮
 * 在文章页 onMounted 后调用 attachCopyButtons(articleEl)
 */
export function useCodeCopy() {
  function attachCopyButtons(container: HTMLElement | null) {
    if (!container) return
    container.querySelectorAll<HTMLElement>('pre').forEach((pre) => {
      if (pre.querySelector('.copy-btn')) return // 防重复
      pre.style.position = 'relative'

      const btn = document.createElement('button')
      btn.className = 'copy-btn'
      btn.setAttribute('aria-label', '复制代码')
      btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`
      Object.assign(btn.style, {
        position: 'absolute',
        top: '10px',
        right: '10px',
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: '6px',
        padding: '4px 6px',
        cursor: 'pointer',
        color: 'rgba(200,200,224,0.7)',
        display: 'flex',
        alignItems: 'center',
        transition: 'all 0.15s',
        zIndex: '10',
      })

      btn.addEventListener('mouseenter', () => {
        btn.style.background = 'rgba(0,212,255,0.12)'
        btn.style.color = 'rgba(0,212,255,0.9)'
        btn.style.borderColor = 'rgba(0,212,255,0.35)'
      })
      btn.addEventListener('mouseleave', () => {
        if (!btn.dataset.copied) {
          btn.style.background = 'rgba(255,255,255,0.06)'
          btn.style.color = 'rgba(200,200,224,0.7)'
          btn.style.borderColor = 'rgba(255,255,255,0.12)'
        }
      })

      btn.addEventListener('click', async () => {
        const code = pre.querySelector('code')?.innerText ?? ''
        await navigator.clipboard.writeText(code)
        btn.dataset.copied = '1'
        btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`
        btn.style.color = 'rgba(0,255,136,0.9)'
        btn.style.borderColor = 'rgba(0,255,136,0.4)'
        btn.style.background = 'rgba(0,255,136,0.08)'
        setTimeout(() => {
          delete btn.dataset.copied
          btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`
          btn.style.background = 'rgba(255,255,255,0.06)'
          btn.style.color = 'rgba(200,200,224,0.7)'
          btn.style.borderColor = 'rgba(255,255,255,0.12)'
        }, 1800)
      })

      pre.appendChild(btn)
    })
  }

  return { attachCopyButtons }
}
