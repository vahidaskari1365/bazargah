import { db } from '@/lib/db'
import { getUserFromRequest, unauthorized } from '@/lib/auth'

/** علاقه‌مندی‌های کاربر */
export async function GET(req: Request) {
  const user = await getUserFromRequest(req)
  if (!user) return unauthorized()
  const favs = await db.favorite.findMany({
    where: { userId: user.id },
    include: { ad: { include: { category: { select: { name: true } } } } },
    orderBy: { createdAt: 'desc' },
  })
  return Response.json({ favorites: favs, adIds: favs.map(f => f.adId) })
}

/** افزودن/حذف علاقه‌مندی (toggle) */
export async function POST(req: Request) {
  const user = await getUserFromRequest(req)
  if (!user) return unauthorized()
  try {
    const { adId } = await req.json()
    if (!adId) return Response.json({ error: 'شناسه آگهی الزامی است' }, { status: 400 })

    const existing = await db.favorite.findUnique({
      where: { userId_adId: { userId: user.id, adId } },
    })
    if (existing) {
      await db.favorite.delete({ where: { id: existing.id } })
      return Response.json({ favorited: false })
    }
    await db.favorite.create({ data: { userId: user.id, adId } })
    return Response.json({ favorited: true })
  } catch (e) {
    console.error('Favorite error:', e)
    return Response.json({ error: 'خطا' }, { status: 500 })
  }
}
