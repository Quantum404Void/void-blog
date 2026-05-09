<template>
  <div class="min-h-screen bg-[var(--color-void)] text-white font-mono">
    <AppNav :crumbs="[{ label: 'lab', href: '/lab' }, { label: 'games', href: '/lab' }, { label: 'ray-march' }]" />

    <div class="relative w-full" style="height: calc(100vh - 56px)">
      <!-- Canvas -->
      <canvas
        ref="canvasRef"
        class="absolute inset-0 w-full h-full"
        @mousedown="onMouseDown"
        @mousemove="onMouseMove"
        @mouseup="onMouseUp"
        @mouseleave="onMouseUp"
      />

      <!-- WebGL not supported fallback -->
      <div
        v-if="webglError"
        class="absolute inset-0 flex items-center justify-center bg-[var(--color-void)]"
      >
        <div class="text-center border border-[var(--color-void-border)] p-8 rounded-lg bg-[var(--color-void-card)]">
          <div class="text-[var(--color-neon-cyan)] text-4xl mb-4">⚠</div>
          <div class="text-lg mb-2">WebGL 不可用</div>
          <div class="text-sm text-gray-400">请使用支持 WebGL 的浏览器</div>
        </div>
      </div>

      <!-- UI Panel -->
      <div
        v-if="!webglError"
        class="absolute top-4 right-4 w-56 bg-[var(--color-void-card)] border border-[var(--color-void-border)] rounded-lg p-4 space-y-4 select-none"
        style="backdrop-filter: blur(8px)"
      >
        <!-- FPS -->
        <div class="flex justify-between items-center">
          <span class="text-xs text-gray-400">FPS</span>
          <span class="text-[var(--color-neon-cyan)] text-sm font-bold">{{ fps }}</span>
        </div>

        <!-- Scene Select -->
        <div>
          <div class="text-xs text-gray-400 mb-2">场景</div>
          <div class="grid grid-cols-2 gap-1">
            <button
              v-for="(name, idx) in sceneNames"
              :key="idx"
              @click="currentScene = idx"
              class="text-xs py-1 px-2 rounded border transition-colors"
              :class="currentScene === idx
                ? 'border-[var(--color-neon-cyan)] text-[var(--color-neon-cyan)] bg-[var(--color-neon-cyan)]/10'
                : 'border-[var(--color-void-border)] text-gray-400 hover:border-gray-500'"
            >
              {{ name }}
            </button>
          </div>
        </div>

        <!-- Light Direction -->
        <div>
          <div class="text-xs text-gray-400 mb-1">光源 X: {{ lightX }}°</div>
          <input type="range" min="-180" max="180" v-model.number="lightX" class="w-full accent-[#00d4ff] h-1" />
        </div>
        <div>
          <div class="text-xs text-gray-400 mb-1">光源 Y: {{ lightY }}°</div>
          <input type="range" min="0" max="90" v-model.number="lightY" class="w-full accent-[#00d4ff] h-1" />
        </div>

        <!-- AO -->
        <div>
          <div class="text-xs text-gray-400 mb-1">AO 强度: {{ aoStrength.toFixed(2) }}</div>
          <input type="range" min="0" max="1" step="0.01" v-model.number="aoStrength" class="w-full accent-[#00d4ff] h-1" />
        </div>

        <!-- Fog -->
        <div>
          <div class="text-xs text-gray-400 mb-1">雾密度: {{ fogDensity.toFixed(2) }}</div>
          <input type="range" min="0" max="1" step="0.01" v-model.number="fogDensity" class="w-full accent-[#00d4ff] h-1" />
        </div>

        <!-- Camera Height -->
        <div>
          <div class="text-xs text-gray-400 mb-1">相机高度: {{ camHeight.toFixed(1) }}</div>
          <input type="range" min="-2" max="5" step="0.1" v-model.number="camHeight" class="w-full accent-[#00d4ff] h-1" />
        </div>

        <!-- Pause -->
        <button
          @click="paused = !paused"
          class="w-full text-xs py-1.5 rounded border transition-colors"
          :class="paused
            ? 'border-[#ff00aa] text-[#ff00aa] bg-[#ff00aa]/10'
            : 'border-[var(--color-void-border)] text-gray-400 hover:border-gray-500'"
        >
          {{ paused ? '▶ 继续' : '⏸ 暂停' }}
        </button>

        <div class="text-xs text-gray-500 text-center">拖拽旋转相机</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { siteName } = useSiteConfig()
useSeoMeta({ title: `Ray Marching | ${siteName}` })
const canvasRef = ref<HTMLCanvasElement | null>(null)
const webglError = ref(false)
const fps = ref(0)
const paused = ref(false)
const currentScene = ref(0)
const sceneNames = ['霓虹球体', '无限隧道', 'Menger海绵', '扭曲环形']

const lightX = ref(45)
const lightY = ref(60)
const aoStrength = ref(0.5)
const fogDensity = ref(0.3)
const camHeight = ref(1.5)

// Mouse drag
let isDragging = false
let lastMX = 0, lastMY = 0
const camRotX = ref(0.3)
const camRotY = ref(0.0)

function onMouseDown(e: MouseEvent) {
  isDragging = true
  lastMX = e.clientX
  lastMY = e.clientY
}
function onMouseMove(e: MouseEvent) {
  if (!isDragging) return
  camRotY.value += (e.clientX - lastMX) * 0.005
  camRotX.value += (e.clientY - lastMY) * 0.003
  camRotX.value = Math.max(-0.5, Math.min(1.2, camRotX.value))
  lastMX = e.clientX
  lastMY = e.clientY
}
function onMouseUp() { isDragging = false }

// ---- WebGL ----
const VERT_SRC = `
attribute vec2 a_pos;
void main() {
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`

const FRAG_SRC = `
precision highp float;

uniform float u_time;
uniform vec2  u_resolution;
uniform int   u_scene;
uniform vec3  u_lightDir;
uniform float u_ao;
uniform float u_fog;
uniform float u_camHeight;
uniform float u_camRotX;
uniform float u_camRotY;

#define MAX_STEPS 100
#define MAX_DIST  80.0
#define SURF_DIST 0.001

// ---- SDF primitives ----
float sdSphere(vec3 p, float r) { return length(p) - r; }
float sdPlane(vec3 p, vec3 n, float h) { return dot(p, n) + h; }
float sdBox(vec3 p, vec3 b) {
  vec3 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}
float sdTorus(vec3 p, vec2 t) {
  vec2 q = vec2(length(p.xz) - t.x, p.y);
  return length(q) - t.y;
}
float sdHexPrism(vec3 p, vec2 h) {
  const vec3 k = vec3(-0.8660254, 0.5, 0.57735);
  p = abs(p);
  p.xy -= 2.0 * min(dot(k.xy, p.xy), 0.0) * k.xy;
  vec2 d = vec2(length(p.xy - vec2(clamp(p.x, -k.z*h.x, k.z*h.x), h.x)) * sign(p.y - h.x), p.z - h.y);
  return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
}

float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5*(b-a)/k, 0.0, 1.0);
  return mix(b, a, h) - k*h*(1.0-h);
}

// ---- Scene 0: Neon Spheres ----
float sdScene0(vec3 p) {
  float d = sdSphere(p - vec3(0.0, 0.0, 0.0), 0.8);
  d = smin(d, sdSphere(p - vec3(2.0, 0.3, 0.0), 0.5), 0.1);
  d = smin(d, sdSphere(p - vec3(-1.5, 0.2, 0.5), 0.6), 0.1);
  d = min(d, sdPlane(p, vec3(0.0, 1.0, 0.0), 1.0));
  return d;
}

// ---- Scene 1: Infinite Tunnel ----
float sdScene1(vec3 p) {
  vec3 rp = p;
  rp.xy = mod(rp.xy + 2.0, 4.0) - 2.0;
  float hex = sdHexPrism(rp, vec2(1.0, 0.15));
  return hex;
}

// ---- Scene 2: Menger Sponge ----
float sdMenger(vec3 p) {
  float d = sdBox(p, vec3(1.0));
  float scale = 1.0;
  for (int i = 0; i < 3; i++) {
    scale *= 3.0;
    vec3 a = mod(p * scale, 6.0) - 3.0;
    float r = 2.0 - 3.0 * abs(a);
    vec3 c = vec3(
      max(r.x, r.y),
      max(r.y, r.z),
      max(r.z, r.x)
    );
    float cut = min(c.x, min(c.y, c.z)) / scale;
    d = max(d, cut);
  }
  return d;
}
float sdScene2(vec3 p) {
  float d = sdMenger(p);
  d = min(d, sdPlane(p, vec3(0.0, 1.0, 0.0), 1.5));
  return d;
}

// ---- Scene 3: Twisted Torus ----
vec3 twist(vec3 p, float k) {
  float c = cos(k * p.y);
  float s = sin(k * p.y);
  mat2 m = mat2(c, -s, s, c);
  return vec3(m * p.xz, p.y);
}
float sdScene3(vec3 p) {
  float t = sin(u_time * 0.5) * 2.0;
  vec3 tp = twist(p, t);
  float d = sdTorus(tp, vec2(1.0, 0.35));
  d = smin(d, sdTorus(twist(p - vec3(0.0, 0.5, 0.0), -t * 1.3), vec2(0.6, 0.2)), 0.1);
  d = min(d, sdPlane(p, vec3(0.0, 1.0, 0.0), 1.5));
  return d;
}

float sceneDist(vec3 p) {
  if (u_scene == 0) return sdScene0(p);
  if (u_scene == 1) return sdScene1(p);
  if (u_scene == 2) return sdScene2(p);
  return sdScene3(p);
}

// ---- Normals (numerical gradient) ----
vec3 calcNormal(vec3 p) {
  float eps = 0.001;
  return normalize(vec3(
    sceneDist(p + vec3(eps,0,0)) - sceneDist(p - vec3(eps,0,0)),
    sceneDist(p + vec3(0,eps,0)) - sceneDist(p - vec3(0,eps,0)),
    sceneDist(p + vec3(0,0,eps)) - sceneDist(p - vec3(0,0,eps))
  ));
}

// ---- Ray March ----
float rayMarch(vec3 ro, vec3 rd) {
  float t = 0.0;
  for (int i = 0; i < MAX_STEPS; i++) {
    float d = sceneDist(ro + rd * t);
    if (d < SURF_DIST) return t;
    t += d;
    if (t > MAX_DIST) break;
  }
  return -1.0;
}

// ---- Soft Shadow ----
float softShadow(vec3 ro, vec3 rd, float mint, float maxt, float k) {
  float res = 1.0;
  float t = mint;
  for (int i = 0; i < 32; i++) {
    float h = sceneDist(ro + rd * t);
    if (h < 0.001) return 0.0;
    res = min(res, k * h / t);
    t += h;
    if (t > maxt) break;
  }
  return clamp(res, 0.0, 1.0);
}

// ---- AO ----
float calcAO(vec3 p, vec3 n) {
  float occ = 0.0;
  float sca = 1.0;
  for (int i = 0; i < 5; i++) {
    float h = 0.01 + 0.12 * float(i) / 4.0;
    float d = sceneDist(p + h * n);
    occ += (h - d) * sca;
    sca *= 0.95;
  }
  return clamp(1.0 - 3.0 * occ, 0.0, 1.0);
}

// ---- Material color by scene/position ----
vec3 getMaterial(vec3 p, vec3 n, int scene) {
  if (scene == 0) {
    float d0 = sdSphere(p - vec3(0.0, 0.0, 0.0), 0.8);
    float d1 = sdSphere(p - vec3(2.0, 0.3, 0.0), 0.5);
    float d2 = sdSphere(p - vec3(-1.5, 0.2, 0.5), 0.6);
    float dpl = sdPlane(p, vec3(0,1,0), 1.0);
    float minD = min(min(d0, d1), min(d2, dpl));
    if (abs(minD - dpl) < 0.01) {
      // Grid floor
      vec2 g = fract(p.xz * 2.0);
      float grid = step(0.95, max(g.x, g.y)) * 0.3;
      return vec3(0.05, 0.05, 0.1) + grid * vec3(0.0, 0.4, 0.5);
    }
    if (abs(minD - d0) < 0.01) return vec3(0.0, 0.83, 1.0);   // cyan
    if (abs(minD - d1) < 0.01) return vec3(1.0, 0.0, 0.67);   // pink
    return vec3(0.22, 1.0, 0.08);                               // green
  }
  if (scene == 1) {
    float stripe = sin(p.z * 4.0 + u_time * 2.0) * 0.5 + 0.5;
    return mix(vec3(0.0, 0.83, 1.0), vec3(1.0, 0.0, 0.67), stripe);
  }
  if (scene == 2) {
    vec3 c = abs(sin(p * 2.0 + u_time * 0.3));
    return mix(vec3(0.0, 0.83, 1.0), c, 0.4);
  }
  // scene 3
  float ring = sin(length(p.xz) * 8.0 - u_time * 2.0) * 0.5 + 0.5;
  return mix(vec3(0.22, 1.0, 0.08), vec3(1.0, 0.0, 0.67), ring);
}

// ---- Camera ----
mat3 setCamera(vec3 ro, vec3 ta) {
  vec3 f = normalize(ta - ro);
  vec3 r = normalize(cross(vec3(0,1,0), f));
  vec3 u = cross(f, r);
  return mat3(r, u, f);
}

void main() {
  vec2 uv = (gl_FragCoord.xy - u_resolution * 0.5) / u_resolution.y;

  // Camera setup
  vec3 ro, ta;
  if (u_scene == 1) {
    // Flying through tunnel
    float tz = u_time * 3.0;
    ro = vec3(0.0, 0.0, tz);
    ta = vec3(sin(u_time * 0.3) * 0.5, cos(u_time * 0.2) * 0.5, tz + 1.0);
  } else {
    float cy = cos(u_camRotY);
    float sy = sin(u_camRotY);
    float cx = cos(u_camRotX);
    float sx = sin(u_camRotX);
    ro = vec3(
      3.5 * cy * cx,
      u_camHeight + 3.5 * sx,
      3.5 * sy * cx
    );
    ta = vec3(0.0, 0.2, 0.0);
  }

  mat3 cam = setCamera(ro, ta);
  vec3 rd = cam * normalize(vec3(uv, 1.8));

  // Light direction
  float lx = radians(u_lightDir.x);
  float ly = radians(u_lightDir.y);
  vec3 lightDir = normalize(vec3(sin(lx)*cos(ly), sin(ly), cos(lx)*cos(ly)));

  // Background
  vec3 bgColor = mix(vec3(0.0, 0.0, 0.06), vec3(0.04, 0.0, 0.08), uv.y + 0.5);

  float t = rayMarch(ro, rd);
  vec3 col;

  if (t < 0.0) {
    col = bgColor;
  } else {
    vec3 p = ro + rd * t;
    vec3 n = calcNormal(p);
    vec3 mat = getMaterial(p, n, u_scene);

    // AO
    float ao = mix(1.0, calcAO(p, n), u_ao);

    // Shadow
    float sha = 1.0;
    if (u_scene != 1) {
      sha = softShadow(p + n * 0.002, lightDir, 0.02, 10.0, 8.0);
    }

    // Phong
    float diff = max(dot(n, lightDir), 0.0);
    vec3 h = normalize(lightDir - rd);
    float spec = pow(max(dot(n, h), 0.0), 32.0);
    vec3 ambient = mat * 0.15;
    vec3 diffuse = mat * diff * sha;
    vec3 specular = vec3(1.0) * spec * sha * 0.6;

    col = (ambient + diffuse + specular) * ao;

    // Neon glow emission (for sphere scene)
    if (u_scene == 0) {
      float glow = exp(-max(sdSphere(p - vec3(0.0,0.0,0.0), 0.8), 0.0) * 8.0);
      col += vec3(0.0, 0.5, 0.8) * glow * 0.5;
    }

    // Fog
    float fogAmt = 1.0 - exp(-t * u_fog * 0.15);
    col = mix(col, bgColor, fogAmt);

    // Gamma
    col = pow(max(col, 0.0), vec3(0.4545));
  }

  gl_FragColor = vec4(col, 1.0);
}
`

let gl: WebGLRenderingContext | null = null
let prog: WebGLProgram | null = null
let animId = 0
let startTime = 0
let lastFpsTime = 0
let frameCount = 0
let pausedTime = 0
let pausedAt = 0

function createShader(g: WebGLRenderingContext, type: number, src: string) {
  const s = g.createShader(type)!
  g.shaderSource(s, src)
  g.compileShader(s)
  if (!g.getShaderParameter(s, g.COMPILE_STATUS)) {
    console.error(g.getShaderInfoLog(s))
    return null
  }
  return s
}

function initGL() {
  const canvas = canvasRef.value
  if (!canvas) return
  const g = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
  if (!g) { webglError.value = true; return }
  gl = g as WebGLRenderingContext

  const vs = createShader(gl, gl.VERTEX_SHADER, VERT_SRC)
  const fs = createShader(gl, gl.FRAGMENT_SHADER, FRAG_SRC)
  if (!vs || !fs) { webglError.value = true; return }

  prog = gl.createProgram()!
  gl.attachShader(prog, vs)
  gl.attachShader(prog, fs)
  gl.linkProgram(prog)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(prog))
    webglError.value = true; return
  }
  gl.useProgram(prog)

  // Full-screen quad
  const buf = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buf)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW)
  const loc = gl.getAttribLocation(prog, 'a_pos')
  gl.enableVertexAttribArray(loc)
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

  startTime = performance.now()
  lastFpsTime = startTime
  render()
}

function setUniform(name: string, ...args: number[]) {
  if (!gl || !prog) return
  const loc = gl.getUniformLocation(prog, name)
  if (args.length === 1) gl.uniform1f(loc, args[0])
  else if (args.length === 2) gl.uniform2f(loc, args[0], args[1])
  else if (args.length === 3) gl.uniform3f(loc, args[0], args[1], args[2])
}
function setUniformI(name: string, v: number) {
  if (!gl || !prog) return
  gl.uniform1i(gl.getUniformLocation(prog, name), v)
}

function render() {
  if (!gl || !prog) return
  const canvas = canvasRef.value
  if (!canvas) return

  // Resize
  if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
    canvas.width = canvas.clientWidth
    canvas.height = canvas.clientHeight
    gl.viewport(0, 0, canvas.width, canvas.height)
  }

  const now = performance.now()

  // FPS
  frameCount++
  if (now - lastFpsTime > 500) {
    fps.value = Math.round(frameCount * 1000 / (now - lastFpsTime))
    frameCount = 0
    lastFpsTime = now
  }

  let elapsed: number
  if (paused.value) {
    if (pausedAt === 0) pausedAt = now
    elapsed = (pausedAt - startTime - pausedTime) / 1000
  } else {
    if (pausedAt !== 0) {
      pausedTime += now - pausedAt
      pausedAt = 0
    }
    elapsed = (now - startTime - pausedTime) / 1000
  }

  setUniform('u_time', elapsed)
  setUniform('u_resolution', canvas.width, canvas.height)
  setUniformI('u_scene', currentScene.value)
  setUniform('u_lightDir', lightX.value, lightY.value, 0)
  setUniform('u_ao', aoStrength.value)
  setUniform('u_fog', fogDensity.value)
  setUniform('u_camHeight', camHeight.value)
  setUniform('u_camRotX', camRotX.value)
  setUniform('u_camRotY', camRotY.value)

  gl.drawArrays(gl.TRIANGLES, 0, 6)
  animId = requestAnimationFrame(render)
}

onMounted(() => { nextTick(initGL) })
onUnmounted(() => { cancelAnimationFrame(animId) })
</script>
