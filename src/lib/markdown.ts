// src/lib/markdown.ts
// Server-side MDX/Markdown rendering via unified

import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeRaw from 'rehype-raw'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypeStringify from 'rehype-stringify'
import rehypeHighlight from 'rehype-highlight'
import type { Root } from 'hast'
import { visit } from 'unist-util-visit'

export interface Heading {
  depth: number
  text: string
  slug: string
}

// Strip JSX/MDX imports and component calls from content
function stripMdxSyntax(content: string): string {
  return content
    .replace(/^import\s+.*$/gm, '')
    .replace(/^export\s+const\s+\w+\s*=[\s\S]*?(?=\n\n|\n#|\n---|$)/gm, '')
    .replace(/<[A-Z][A-Za-z]*[^>]*\/>/g, '')
    .replace(/<[A-Z][A-Za-z]*[^>]*>[\s\S]*?<\/[A-Z][A-Za-z]*>/g, '')
    .trim()
}

export async function renderMarkdown(content: string): Promise<{ html: string; headings: Heading[] }> {
  const cleaned = stripMdxSyntax(content)
  const headings: Heading[] = []

  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings, { behavior: 'append' })
    .use(rehypeHighlight, { detect: true })
    .use(() => (tree: Root) => {
      visit(tree, 'element', (node: any) => {
        if (['h1', 'h2', 'h3', 'h4'].includes(node.tagName)) {
          const text = node.children
            .filter((c: any) => c.type === 'text')
            .map((c: any) => c.value)
            .join('')
          headings.push({
            depth: parseInt(node.tagName[1]),
            text,
            slug: node.properties?.id as string ?? '',
          })
        }
      })
    })
    .use(rehypeStringify)

  const file = await processor.process(cleaned)
  return { html: String(file), headings }
}
