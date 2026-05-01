import { config, fields, collection } from '@keystatic/core'

export default config({
  storage: {
    kind: 'github',
    repo: 'Quantum505Void/void-blog',
    branchPrefix: 'keystatic/',
  },

  ui: {
    brand: { name: 'void.dev' },
  },

  collections: {
    blog: collection({
      label: '文章',
      slugField: 'title',
      path: 'src/content/blog/*',
      format: { contentField: 'content' },
      entryLayout: 'content',
      schema: {
        title: fields.slug({ name: { label: '标题' } }),
        description: fields.text({
          label: '描述',
          multiline: false,
        }),
        pubDate: fields.date({
          label: '发布日期',
          defaultValue: { kind: 'today' },
        }),
        updatedDate: fields.date({ label: '更新日期' }),
        tags: fields.array(
          fields.text({ label: '标签' }),
          {
            label: '标签',
            itemLabel: (props) => props.fields.value.value ?? '标签',
          }
        ),
        draft: fields.checkbox({ label: '草稿', defaultValue: false }),
        content: fields.mdx({ label: '内容' }),
      },
    }),
  },
})
