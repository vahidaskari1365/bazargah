import { db } from '@/lib/db'
import { getUserFromRequest, unauthorized } from '@/lib/auth'

/** اطلاعات کاربر فعلی + به‌روزرسانی پروفایل */
export async function GET(req: Request) {
  const user = await getUserFromRequest(req)
  if (!user) return unauthorized()
  return Response.json({ user: { ...user, roleList: JSON.parse(user.roles) } })
}

export async function PUT(req: Request) {
  const user = await getUserFromRequest(req)
  if (!user) return unauthorized()
  try {
    const body = await req.json()
    const data: Record<string, string | boolean> = {}
    if (body.firstName !== undefined) data.firstName = body.firstName
    if (body.lastName !== undefined) data.lastName = body.lastName
    if (body.province !== undefined) data.province = body.province
    if (body.city !== undefined) data.city = body.city
    if (body.avatar !== undefined) data.avatar = body.avatar
    if (body.roles !== undefined) data.roles = JSON.stringify(body.roles)

    const updated = await db.user.update({ where: { id: user.id }, data })
    return Response.json({ user: { ...updated, roleList: JSON.parse(updated.roles) } })
  } catch (e) {
    console.error('Profile update error:', e)
    return Response.json({ error: 'خطا در به‌روزرسانی پروفایل' }, { status: 500 })
  }
}
