<template>
  <div class="min-h-screen bg-[var(--color-void)] flex flex-col items-center justify-center p-4">
    <nav class="fixed top-0 left-0 right-0 z-50 border-b border-[var(--color-void-border)] bg-[rgba(10,10,15,0.85)] backdrop-blur-xl">
      <div class="max-w-5xl mx-auto px-6 h-14 flex items-center gap-4">
        <NuxtLink href="/lab" class="font-mono text-sm text-[var(--color-neon-green)] hover:opacity-80 transition-opacity">~/lab</NuxtLink>
        <span class="text-[var(--color-text-muted)]">/</span>
        <span class="font-mono text-xs text-[var(--color-neon-cyan)]">breakout</span>
        <div class="ml-auto flex items-center gap-3 font-mono text-xs text-[var(--color-text-muted)]">
          <span>SCORE: <span id="score-el" style="color:#00d4ff;font-weight:700">0</span></span>
          <span>LIVES: <span id="lives-el" style="color:#ff00aa;font-weight:700">3</span></span>
        </div>
      </div>
    </nav>

    <div class="pt-20 w-full max-w-5xl">
      <div class="text-center mb-4">
        <p class="font-mono text-[10px] text-[var(--color-text-muted)] tracking-[0.25em] uppercase mb-1">process: breakout.exe</p>
        <h1 class="font-mono text-2xl font-bold mb-1" style="color:#00d4ff;text-shadow:0 0 20px rgba(0,212,255,0.5)">BREAKOUT</h1>
        <p class="font-mono text-xs text-[var(--color-text-muted)]">鼠标移动 / ← → 键控制挡板</p>
      </div>

      <div class="relative border border-[var(--color-void-border)] rounded-xl overflow-hidden mx-auto" style="width:100%;max-width:800px;aspect-ratio:800/520;background:#06060e;box-shadow:0 0 40px rgba(0,212,255,0.1),inset 0 0 60px rgba(0,0,0,0.5)">
        <canvas id="breakout-canvas" width="800" height="520" style="display:block;width:100%;height:100%"></canvas>
        <div id="game-overlay" class="absolute inset-0 flex flex-col items-center justify-center font-mono" style="background:rgba(6,6,14,0.92)">
          <div style="font-size:2.5rem;margin-bottom:0.75rem">🧱</div>
          <div id="overlay-title" class="text-xl font-bold mb-2" style="color:#00d4ff;text-shadow:0 0 15px #00d4ff">BREAKOUT</div>
          <div id="overlay-sub" class="text-xs mb-6" style="color:#8888aa">按 Space 或 Enter 开始</div>
          <button id="start-btn" class="font-mono text-sm px-6 py-2 rounded-lg border transition-all" style="border-color:rgba(0,212,255,0.4);color:#00d4ff;background:rgba(0,212,255,0.08)">▶ START</button>
        </div>
      </div>

      <div class="mt-4 grid grid-cols-3 gap-2 font-mono text-[10px] text-center text-[var(--color-text-muted)] max-w-xs mx-auto">
        <div class="border border-[var(--color-void-border)] rounded-lg p-2 bg-[var(--color-void-card)]"><div class="text-[var(--color-neon-cyan)] mb-1">移动</div><div>鼠标 / ← →</div></div>
        <div class="border border-[var(--color-void-border)] rounded-lg p-2 bg-[var(--color-void-card)]"><div class="text-[var(--color-neon-green)] mb-1">暂停</div><div>Space</div></div>
        <div class="border border-[var(--color-void-border)] rounded-lg p-2 bg-[var(--color-void-card)]"><div class="text-[var(--color-neon-purple)] mb-1">重置</div><div>R</div></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { siteName } = useSiteConfig()
useHead({ title: `Breakout | ${siteName}` })

onMounted(() => {
  const canvas = document.getElementById('breakout-canvas') as HTMLCanvasElement
  const ctx = canvas.getContext('2d')!
  const W = 800, H = 520

  const scoreEl = document.getElementById('score-el')!
  const livesEl = document.getElementById('lives-el')!
  const overlay = document.getElementById('game-overlay')!
  const overlayTitle = document.getElementById('overlay-title')!
  const overlaySub = document.getElementById('overlay-sub')!
  const startBtn = document.getElementById('start-btn')!

  // Bricks config
  const BRICK_COLS = 10
  const BRICK_ROWS = 6
  const BRICK_W = 68
  const BRICK_H = 20
  const BRICK_PAD = 6
  const BRICK_OFF_X = (W - BRICK_COLS * (BRICK_W + BRICK_PAD) + BRICK_PAD) / 2
  const BRICK_OFF_Y = 48

  const PADDLE_W = 110
  const PADDLE_H = 10
  const BALL_R = 7

  const ROW_COLORS = ['#ff00aa', '#f47067', '#ffa500', '#00ff88', '#00d4ff', '#b400ff']

  type Brick = { x: number; y: number; alive: boolean; color: string }

  let bricks: Brick[] = []
  let paddleX = W / 2 - PADDLE_W / 2
  let ballX = W / 2, ballY = H - 80
  let ballDX = 4, ballDY = -4
  let score = 0, lives = 3
  let gameState: 'idle' | 'running' | 'paused' | 'dead' | 'win' = 'idle'
  let animId = 0
  let mouseX = W / 2
  let keys = { left: false, right: false }

  function initBricks() {
    bricks = []
    for (let r = 0; r < BRICK_ROWS; r++) {
      for (let c = 0; c < BRICK_COLS; c++) {
        bricks.push({
          x: BRICK_OFF_X + c * (BRICK_W + BRICK_PAD),
          y: BRICK_OFF_Y + r * (BRICK_H + BRICK_PAD),
          alive: true,
          color: ROW_COLORS[r % ROW_COLORS.length]
        })
      }
    }
  }

  function resetBall() {
    ballX = paddleX + PADDLE_W / 2
    ballY = H - 80
    const angle = (Math.random() * 60 + 60) * Math.PI / 180
    const speed = 5
    ballDX = speed * Math.cos(angle) * (Math.random() > 0.5 ? 1 : -1)
    ballDY = -Math.abs(speed * Math.sin(angle))
  }

  function startGame() {
    score = 0; lives = 3; paddleX = W / 2 - PADDLE_W / 2
    scoreEl.textContent = '0'; livesEl.textContent = '3'
    initBricks(); resetBall()
    gameState = 'running'; overlay.style.display = 'none'
    loop()
  }

  function hexToRgb(hex: string) {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return { r, g, b }
  }

  function glowColor(hex: string, alpha = 0.6) {
    const { r, g, b } = hexToRgb(hex)
    return `rgba(${r},${g},${b},${alpha})`
  }

  function draw() {
    ctx.clearRect(0, 0, W, H)

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.025)'; ctx.lineWidth = 0.5
    for (let x = 0; x <= W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke() }
    for (let y = 0; y <= H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke() }

    // Bricks
    bricks.forEach(b => {
      if (!b.alive) return
      ctx.save()
      ctx.shadowBlur = 10; ctx.shadowColor = b.color
      ctx.fillStyle = glowColor(b.color, 0.18)
      ctx.strokeStyle = b.color; ctx.lineWidth = 1.5
      roundRect(ctx, b.x, b.y, BRICK_W, BRICK_H, 4)
      ctx.fill(); ctx.stroke()
      ctx.restore()
    })

    // Paddle
    ctx.save()
    ctx.shadowBlur = 20; ctx.shadowColor = '#00d4ff'
    const grad = ctx.createLinearGradient(paddleX, 0, paddleX + PADDLE_W, 0)
    grad.addColorStop(0, 'rgba(0,212,255,0.4)'); grad.addColorStop(0.5, 'rgba(0,212,255,0.9)'); grad.addColorStop(1, 'rgba(0,212,255,0.4)')
    ctx.fillStyle = grad
    roundRect(ctx, paddleX, H - 35, PADDLE_W, PADDLE_H, 5)
    ctx.fill()
    ctx.restore()

    // Ball
    ctx.save()
    ctx.shadowBlur = 24; ctx.shadowColor = '#00ff88'
    const ballGrad = ctx.createRadialGradient(ballX, ballY, 1, ballX, ballY, BALL_R)
    ballGrad.addColorStop(0, '#ffffff'); ballGrad.addColorStop(0.4, '#00ff88'); ballGrad.addColorStop(1, 'rgba(0,255,136,0.3)')
    ctx.fillStyle = ballGrad
    ctx.beginPath(); ctx.arc(ballX, ballY, BALL_R, 0, Math.PI * 2); ctx.fill()
    ctx.restore()

    if (gameState === 'paused') {
      ctx.fillStyle = 'rgba(10,10,15,0.7)'; ctx.fillRect(0, 0, W, H)
      ctx.fillStyle = '#00d4ff'; ctx.font = 'bold 28px JetBrains Mono,monospace'
      ctx.textAlign = 'center'; ctx.shadowBlur = 20; ctx.shadowColor = '#00d4ff'
      ctx.fillText('PAUSED', W / 2, H / 2)
      ctx.font = '12px JetBrains Mono,monospace'; ctx.fillStyle = '#8888aa'; ctx.shadowBlur = 0
      ctx.fillText('Press Space to continue', W / 2, H / 2 + 30)
    }
  }

  function roundRect(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    c.beginPath(); c.moveTo(x + r, y)
    c.lineTo(x + w - r, y); c.arcTo(x + w, y, x + w, y + r, r)
    c.lineTo(x + w, y + h - r); c.arcTo(x + w, y + h, x + w - r, y + h, r)
    c.lineTo(x + r, y + h); c.arcTo(x, y + h, x, y + h - r, r)
    c.lineTo(x, y + r); c.arcTo(x, y, x + r, y, r); c.closePath()
  }

  function update() {
    // Paddle by keyboard
    if (keys.left) paddleX = Math.max(0, paddleX - 6)
    if (keys.right) paddleX = Math.min(W - PADDLE_W, paddleX + 6)
    // Paddle by mouse
    paddleX = Math.max(0, Math.min(W - PADDLE_W, mouseX - PADDLE_W / 2))

    ballX += ballDX; ballY += ballDY

    // Wall bounce
    if (ballX - BALL_R < 0) { ballX = BALL_R; ballDX = Math.abs(ballDX) }
    if (ballX + BALL_R > W) { ballX = W - BALL_R; ballDX = -Math.abs(ballDX) }
    if (ballY - BALL_R < 0) { ballY = BALL_R; ballDY = Math.abs(ballDY) }

    // Paddle collision
    if (
      ballY + BALL_R >= H - 35 && ballY + BALL_R <= H - 35 + PADDLE_H &&
      ballX >= paddleX - BALL_R && ballX <= paddleX + PADDLE_W + BALL_R &&
      ballDY > 0
    ) {
      const relX = (ballX - paddleX) / PADDLE_W - 0.5  // -0.5 to 0.5
      const speed = Math.sqrt(ballDX * ballDX + ballDY * ballDY)
      ballDX = relX * speed * 2.2
      ballDY = -Math.abs(ballDY)
      ballY = H - 35 - BALL_R
    }

    // Ball lost
    if (ballY - BALL_R > H) {
      lives--; livesEl.textContent = String(lives)
      if (lives <= 0) { die(); return }
      resetBall()
    }

    // Brick collision
    for (const b of bricks) {
      if (!b.alive) continue
      if (ballX + BALL_R > b.x && ballX - BALL_R < b.x + BRICK_W && ballY + BALL_R > b.y && ballY - BALL_R < b.y + BRICK_H) {
        b.alive = false
        score += 10; scoreEl.textContent = String(score)
        // Determine bounce direction
        const overlapLeft = ballX + BALL_R - b.x
        const overlapRight = b.x + BRICK_W - (ballX - BALL_R)
        const overlapTop = ballY + BALL_R - b.y
        const overlapBottom = b.y + BRICK_H - (ballY - BALL_R)
        const minH = Math.min(overlapLeft, overlapRight)
        const minV = Math.min(overlapTop, overlapBottom)
        if (minH < minV) ballDX = -ballDX
        else ballDY = -ballDY
        break
      }
    }

    // Win check
    if (bricks.every(b => !b.alive)) {
      gameState = 'win'
      cancelAnimationFrame(animId)
      showOverlay('🏆', 'YOU WIN!', `Score: ${score}`, 'PLAY AGAIN', '#00ff88')
    }
  }

  function die() {
    gameState = 'dead'
    cancelAnimationFrame(animId)
    let f = 0
    const flash = setInterval(() => {
      ctx.fillStyle = `rgba(255,0,100,${f % 2 === 0 ? 0.3 : 0})`; ctx.fillRect(0, 0, W, H)
      if (++f >= 6) { clearInterval(flash); showOverlay('💀', 'GAME OVER', `Score: ${score}`, 'RESTART', '#ff00aa') }
    }, 80)
  }

  function showOverlay(icon: string, title: string, sub: string, btn: string, color: string) {
    const iconEl = overlay.querySelector('div') as HTMLElement
    if (iconEl) iconEl.textContent = icon
    overlayTitle.textContent = title; overlayTitle.style.color = color; overlayTitle.style.textShadow = `0 0 15px ${color}`
    overlaySub.textContent = sub; startBtn.textContent = `▶ ${btn}`
    overlay.style.display = 'flex'
  }

  function loop() {
    if (gameState !== 'running') return
    update(); draw()
    animId = requestAnimationFrame(loop)
  }

  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect()
    mouseX = (e.clientX - rect.left) * (W / rect.width)
  })

  document.addEventListener('keydown', e => {
    if (['ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault()
    if (e.key === ' ' || e.key === 'Enter') {
      if (gameState === 'idle' || gameState === 'dead' || gameState === 'win') startGame()
      else if (gameState === 'running') { gameState = 'paused'; cancelAnimationFrame(animId); draw() }
      else if (gameState === 'paused') { gameState = 'running'; loop() }
    }
    if (e.key === 'r' || e.key === 'R') startGame()
    if (e.key === 'ArrowLeft') keys.left = true
    if (e.key === 'ArrowRight') keys.right = true
  })
  document.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft') keys.left = false
    if (e.key === 'ArrowRight') keys.right = false
  })
  startBtn.addEventListener('click', () => {
    if (gameState === 'idle' || gameState === 'dead' || gameState === 'win') startGame()
  })

  draw()
})
</script>
