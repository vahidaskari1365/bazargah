import { db } from '@/lib/db'
import { getUserFromRequest, unauthorized, parseRoles } from '@/lib/auth'

/** مدیریت کاربران (ادمین) */
export async function GET(req: Request) {
  const admin = await getUserFromRequest(req)
  if (!admin) return unauthorized()
  if (!parseRoles(admin.roles).includes('ADMIN')) {
    return Response.json({ error: 'دسترسی ادمین لازم است' }, { status: 403 })
  }
  const users = await db.user.findMany({
    include: { _count: { select: { ads: true, animals: true, orders: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
  return Response.json({ users })
}

/** تغییر نقش/مسدود کردن کاربر */
export async function PUT(req: Request) {
  const admin = await getUserFromRequest(req)
  if (!admin) return unauthorized()
  if (!parseRoles(admin.roles).includes('ADMIN')) {
    return Response.json({ error: 'دسترسی ادمین لازم است' }, { status: 403 })
  }
  try {
    const { userId, roles, block } = await req.json()
    const data: Record<string, string> = {}
    if (roles) data.roles = JSON.stringify(roles)
    if (block !== undefined) data.isVerified = !block
    const user = await db.user.update({ where: { id: userId }, data })
    return Response.json({ user })
  } catch (e) {
    return Response.json({ error: 'خطا در ویرایش کاربر' }, { status: 500 })
  }
}
