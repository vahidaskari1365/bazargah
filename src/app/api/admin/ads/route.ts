import { db } from '@/lib/db'
import { getUserFromRequest, unauthorized, parseRoles } from '@/lib/auth'

/** مدیریت آگهی‌ها (ادمین): همه آگهی‌ها + تغییر وضعیت */
export async function GET(req: Request) {
  const admin = await getUserFromRequest(req)
  if (!admin) return unauthorized()
  if (!parseRoles(admin.roles).includes('ADMIN')) {
    return Response.json({ error: 'دسترسی ادمین لازم است' }, { status: 403 })
  }
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const where = status ? { status } : {}
  const ads = await db.ad.findMany({
    where,
    include: {
      category: { select: { name: true } },
      user: { select: { firstName: true, lastName: true, phone: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
  return Response.json({ ads })
}

/** تغییر وضعیت آگهی: approve, reject, suspend, feature, delete */
export async function PUT(req: Request) {
  const admin = await getUserFromRequest(req)
  if (!admin) return unauthorized()
  if (!parseRoles(admin.roles).includes('ADMIN')) {
    return Response.json({ error: 'دسترسی ادمین لازم است' }, { status: 403 })
  }
  try {
    const { adId, action } = await req.json()
    const statusMap: Record<string, string> = {
      approve: 'ACTIVE', reject: 'REJECTED', suspend: 'SUSPENDED', delete: 'DELETED',
    }
    if (action === 'feature') {
      const ad = await db.ad.update({
        where: { id: adId },
        data: { isFeatured: true, featuredUntil: new Date(Date.now() + 7 * 864e5) },
      })
      return Response.json({ ad })
    }
    const status = statusMap[action]
    if (!status) return Response.json({ error: 'عملیات نامعتبر' }, { status: 400 })
    const ad = await db.ad.update({ where: { id: adId }, data: { status } })
    return Response.json({ ad })
  } catch (e) {
    return Response.json({ error: 'خطا در تغییر وضعیت' }, { status: 500 })
  }
}
