import { load as loadYaml } from 'js-yaml'
import catalogRaw from '@/assets/data/xuanwei/data/classics-catalog.yaml?raw'

export interface ClassicRecord {
  id: string
  title: string
  system: string
  period: string
  author: string
  mode: 'structured' | 'indexed'
  source_status: 'open' | 'excerpt_open' | 'bibliography' | 'variant' | 'copyright_review' | 'title_review'
  source_url?: string
}

interface ClassicsCatalog {
  schema: string
  classics: ClassicRecord[]
}

const parsed = loadYaml(catalogRaw) as ClassicsCatalog

if (parsed.schema !== 'xuanwei-classics-catalog/v1' || !Array.isArray(parsed.classics)) {
  throw new Error('玄微古籍目录格式无效')
}

export const CLASSICS = Object.freeze(parsed.classics)
