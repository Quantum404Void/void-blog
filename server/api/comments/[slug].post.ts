import type { H3Event } from 'h3';
import { queryD1 } from '~~/server/utils/d1';

const MAX_CONTENT_LEN = 2000;
const MIN_CONTENT_LEN = 2;
const MAX_NICKNAME_LEN = 50;
const RATE_LIMIT_SEC = 30;

export default defineEventHandler(async (event: H3Event) => {
  await ensureCommentsTable(event);
  const slug = getRouterParam(event, 'slug')!;
  const body = await readBody<{
    nickname: string;
    email?: string;
    content: string;
    parent_id?: number | null;
  }>(event);

  // Validate
  const nickname = (body.nickname || '').trim();
  const content = (body.content || '').trim();
  const email = (body.email || '').trim().slice(0, 200);

  if (!nickname || nickname.length > MAX_NICKNAME_LEN) {
    throw createError({ statusCode: 400, message: '昵称无效' });
  }
  if (!content || content.length < MIN_CONTENT_LEN || content.length > MAX_CONTENT_LEN) {
    throw createError({ statusCode: 400, message: '评论内容长度需在 2-2000 字符之间' });
  }

  // Simple rate limiting by IP
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown';
  const recent = await queryD1<{ c: number }>(
    event,
    `SELECT COUNT(*) as c FROM comments
     WHERE slug = ? AND created_at > datetime('now', ?)`,
    [slug, `-${RATE_LIMIT_SEC} seconds`]
  );
  if (recent[0]?.c > 5) {
    throw createError({ statusCode: 429, message: '评论过于频繁，请稍后再试' });
  }

  await queryD1(
    event,
    `INSERT INTO comments (slug, nickname, email, content, parent_id, approved)
     VALUES (?, ?, ?, ?, ?, 1)`,
    [slug, nickname, email, content, body.parent_id || null]
  );

  return { ok: true };
});
