import type { Post } from '~~/app/types/post'

export const DEMO_POST_SLUG = 'building-a-resilient-nuxt-content-pipeline'

export const demoPost: Post = {
  slug: DEMO_POST_SLUG,
  title: '构建一条可靠的 Nuxt 内容管线：从 Markdown 到边缘渲染',
  description: '一篇用于验证真实阅读体验的示例文章：涵盖 SSR、渐进增强、代码高亮、可访问性与失败回退。',
  pub_date: '2026-07-10',
  tags: ['Nuxt', 'Vue', 'Cloudflare', '工程实践'],
  draft: false,
  demo: true,
  word_count: 2380,
  content: `真正可靠的内容页面，不是“Markdown 能变成 HTML”就结束了。它还要在数据库暂时不可用、JavaScript 尚未加载、语法高亮仍在下载时，保持内容可读、链接可用、布局稳定。

这篇文章用一条小而完整的管线说明如何把这些约束放进同一个设计里：**服务端先交付结构，客户端再增强体验，任何一步失败都不遮住正文。**

> 好的渐进增强不是准备两套页面，而是让同一份内容在能力增加时逐层变好。

## 先定义可靠性的边界

在写组件之前，先明确页面必须守住的底线。

| 阶段 | 必须可用 | 可以延后 |
| --- | --- | --- |
| SSR 响应 | 标题、摘要、正文、链接 | 语法高亮、复制按钮 |
| Hydration | 导航、目录、阅读进度 | 统计、评论 |
| 增强完成 | 高亮、分享、朗读 | 非关键动画 |

这个顺序带来一个直接判断：如果 Shiki 加载失败，文章仍应完整；如果统计接口超时，标题和正文不应跟着报错。

:::tip 设计原则
把“内容可见”当作基线，把动画和高亮当作奖励。不要让奖励成为进入内容的门票。
:::

## 服务端交付稳定的 HTML

服务端渲染只承担结构化工作：标题锚点、基础 Markdown、图片懒加载。高成本语法高亮留给客户端。

~~~ts
export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) {
    throw createError({ statusCode: 400, message: 'Missing slug' })
  }

  const post = await findPublishedPost(event, slug)
  return {
    ...post,
    content_html: getServerMd().render(post.content),
  }
})
~~~

这里有两个刻意的选择：

1. 查询只返回已发布内容，权限边界留在服务端。
2. HTML 与 Markdown 同时返回，客户端可在高亮器就绪后无闪烁替换。

### 为什么不在服务端加载全部语言

Shiki 的语言包和主题会显著增加边缘函数体积。对于 Cloudflare Pages，冷启动和包大小比“首屏代码立刻有颜色”更值得优先考虑。

~~~ts
const displayContent = computed(() =>
  renderedContent.value || post.value?.content_html || '',
)
~~~

这行代码很普通，却是整个回退策略的核心：增强结果不存在时，基础 HTML 永远还在。

## 客户端只做渐进增强

客户端挂载后再启动高亮器，并且只在结果确实变化时替换 DOM。

~~~ts
watch(
  () => post.value?.content,
  async (content) => {
    if (!content) return

    const markdown = await buildMd()
    const highlighted = markdown.render(content)
    if (highlighted !== renderedContent.value) {
      renderedContent.value = highlighted
    }
  },
  { immediate: true },
)
~~~

:::warning 避免内容闪烁
不要在高亮开始前清空服务端 HTML。慢速网络下，那会让正文先出现、再消失、最后重新出现。
:::

### 目录也要来自最终结构

目录不应该重新解析原始 Markdown，因为代码注释里的 \`#\`、自定义容器或内联 HTML 都可能制造错误标题。更稳妥的方式是从已渲染的 \`h2\`、\`h3\` 中提取锚点。

## 把失败隔离在功能边界内

浏览量、点赞和评论都是有价值的功能，但它们不是阅读文章的前置条件。每个功能独立请求、独立失败，正文不等待它们。

~~~ts
async function loadStats() {
  try {
    stats.value = await $fetch(\`/api/stats/\${slug}\`)
  }
  catch {
    stats.value = { views: 0, likes: 0 }
  }
}
~~~

这种隔离也让本地开发更舒服：没有 D1 binding 时仍能校验排版、目录、代码块与响应式布局。

## 可访问性不是最后一轮补丁

文章页最常被忽略的不是颜色，而是交互尺寸和运动偏好：

- 浮动目录按钮至少保留 44 × 44 像素触控区域；
- 抽屉使用明确的 \`aria-label\` 与展开状态；
- 键盘焦点不能只依靠颜色变化；
- \`prefers-reduced-motion\` 下关闭平滑滚动和位移动画；
- 正文行长控制在约 68–72 个字符，避免视线长距离往返。

:::info 验证方式
不要只拖动浏览器窗口。用 Playwright 固定桌面与手机视口，检查水平溢出、触控尺寸、控制台错误和减少动态效果媒体查询。
:::

## 最后的检查清单

上线前，我会按下面的顺序检查：

1. 禁用 JavaScript，确认标题、正文和链接存在。
2. 模拟慢速网络，确认高亮加载时没有内容闪烁。
3. 让统计接口返回 500，确认阅读不受影响。
4. 在 390px 视口打开目录，确认按钮和关闭操作可触达。
5. 开启减少动态效果，确认阅读进度之外没有强制运动。

可靠性很少来自某个复杂插件。它更常来自一组明确的优先级：**先让内容抵达，再让体验变好；先隔离失败，再添加能力。**
`,
}

export const demoPostSummary = {
  slug: demoPost.slug,
  title: demoPost.title,
  description: demoPost.description,
  pub_date: demoPost.pub_date,
  tags: demoPost.tags,
  draft: demoPost.draft,
  demo: true,
  word_count: demoPost.word_count,
}
