// server/api/admin/overview.get.ts — 全站概览（admin 专用）
export default defineEventHandler(async (event) => {
  const [postRow] = await queryD1<{ total: number; published: number; drafts: number }>(
    event,
    `SELECT COUNT(*) AS total,
            SUM(CASE WHEN draft=0 THEN 1 ELSE 0 END) AS published,
            SUM(CASE WHEN draft=1 THEN 1 ELSE 0 END) AS drafts
     FROM posts`
  )

  const [statsRow] = await queryD1<{ total_views: number; total_likes: number; posts_with_stats: number }>(
    event,
    `SELECT COALESCE(SUM(views), 0) AS total_views,
            COALESCE(SUM(likes), 0) AS total_likes,
            COUNT(*) AS posts_with_stats
     FROM post_stats`
  )

  // 最热文章 top5（按访问量）
  const topViewed = await queryD1<{ slug: string; title: string; views: number; likes: number }>(
    event,
    `SELECT p.slug, p.title, COALESCE(s.views,0) AS views, COALESCE(s.likes,0) AS likes
     FROM posts p
     LEFT JOIN post_stats s ON p.slug=s.slug
     WHERE p.draft=0
     ORDER BY views DESC LIMIT 5`
  )

  // 最近活跃（最近 7 天有记录更新的）
  const recentActive = await queryD1<{ slug: string; views: number; updated_at: string }>(
    event,
    `SELECT slug, views, updated_at FROM post_stats
     ORDER BY updated_at DESC LIMIT 5`
  )

  return {
    posts: {
      total: postRow?.total ?? 0,
      published: postRow?.published ?? 0,
      drafts: postRow?.drafts ?? 0,
    },
    stats: {
      totalViews: statsRow?.total_views ?? 0,
      totalLikes: statsRow?.total_likes ?? 0,
    },
    topViewed,
    recentActive,
  }
})
