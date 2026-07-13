export function createPostSlug(title: string, now = Date.now()): string {
  const normalized = title
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)

  if (normalized) return normalized

  const date = new Date(now).toISOString().slice(0, 10)
  return `post-${date}-${now.toString(36).slice(-6)}`
}
