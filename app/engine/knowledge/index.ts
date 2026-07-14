/**
 * engine/knowledge/index.ts — 知识库注册中心
 */
import { engine } from '@/engine/core'
import { baziKnowledgeBase } from './bazi'

export function registerAllKnowledge(): void {
  engine.register(baziKnowledgeBase)
}

export const REGISTERED_MODULES = [
  { id: 'bazi', name: '八字命理', icon: '☯️', route: 'bazi', status: 'ready' as const },
  { id: 'tarot', name: '塔罗占卜', icon: '🃏', route: 'tarot', status: 'ready' as const },
  { id: 'astrology', name: '星座运势', icon: '♈', route: 'astrology', status: 'ready' as const },
  { id: 'lots', name: '抽签解签', icon: '🏮', route: 'lots', status: 'ready' as const },
  { id: 'ziwei', name: '紫微斗数', icon: '⭐', route: 'ziwei', status: 'ready' as const },
  { id: 'liuyao', name: '六爻纳甲', icon: '🪙', route: 'liuyao', status: 'ready' as const },
  { id: 'meihua', name: '梅花易数', icon: '🌸', route: 'meihua', status: 'ready' as const },
  { id: 'qimen', name: '奇门遁甲', icon: '🚪', route: 'qimen', status: 'ready' as const },
  { id: 'daliuren', name: '大六壬', icon: '💧', route: 'daliuren', status: 'ready' as const },
  { id: 'fengshui', name: '风水堪舆', icon: '🏔️', route: 'fengshui', status: 'ready' as const },
  { id: 'nameology', name: '姓名学', icon: '📛', route: 'nameology', status: 'ready' as const },
  { id: 'chenggu', name: '称骨歌', icon: '⚖️', route: 'chenggu', status: 'ready' as const },
  { id: 'iching', name: '易经六十四卦', icon: '☰', route: 'iching', status: 'ready' as const },
  { id: 'dream', name: '周公解梦', icon: '🌙', route: 'dream', status: 'ready' as const },
  { id: 'mianxiang', name: '面相', icon: '👤', route: 'mianxiang', status: 'ready' as const }
]
