import { db } from '@/lib/db'
import { getUserFromRequest, unauthorized } from '@/lib/auth'

/** نوتیفیکیشن‌ها */
export async function GET(req: Request) {
  const user = await getUserFromRequest(req)
  if (!user) return unauthorized()
  const notifications = await db.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
  const unread = notifications.filter(n => !n.isRead).length
  return Response.json({ notifications, unread })
}

/** علامت‌گذاری همه به‌عنوان خوانده‌شده */
export async function POST(req: Request) {
  const user = await getUserFromRequest(req)
  if (!user) return unauthorized()
  await db.notification.updateMany({ where: { userId: user.id, isRead: false }, data: { isRead: true } })
  return Response.json({ success: true })
}
