import { db } from '@/lib/db'
import { getUserFromRequest, unauthorized } from '@/lib/auth'
import { Prisma } from '@prisma/client'

/** جستجو و فیلتر آگهی‌ها */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q') || ''
    const categoryId = searchParams.get('category') || ''
    const city = searchParams.get('city') || ''
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const sort = searchParams.get('sort') || 'NEWEST' // NEWEST, CHEAPEST, EXPENSIVE, POPULAR
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
    const featured = searchParams.get('featured')
    const userId = searchParams.get('userId')
    const status = searchParams.get('status') || 'ACTIVE'

    const where: Prisma.AdWhereInput = { status }
    if (q) {
      where.OR = [
        { title: { contains: q } },
        { description: { contains: q } },
      ]
    }
    if (categoryId) where.categoryId = categoryId
    if (city) where.city = { contains: city }
    if (minPrice) where.price = { ...where.price as Prisma.IntFilter, gte: parseInt(minPrice) }
    if (maxPrice) where.price = { ...where.price as Prisma.IntFilter, lte: parseInt(maxPrice) }
    if (featured === '1') where.isFeatured = true
    if (userId) where.userId = userId

    let orderBy: Prisma.AdOrderByWithRelationInput[] = [{ ladderedUntil: 'desc' }, { createdAt: 'desc' }]
    if (sort === 'CHEAPEST') orderBy = [{ price: 'asc' }]
    if (sort === 'EXPENSIVE') orderBy = [{ price: 'desc' }]
    if (sort === 'POPULAR') orderBy = [{ views: 'desc' }]

    const [ads, total] = await Promise.all([
      db.ad.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          category: { select: { name: true, slug: true } },
          user: { select: { id: true, firstName: true, lastName: true, isVerified: true, city: true } },
        },
      }),
      db.ad.count({ where }),
    ])

    return Response.json({ ads, total, page, pages: Math.ceil(total / limit) })
  } catch (e) {
    console.error('Ads GET error:', e)
    return Response.json({ error: 'خطا در دریافت آگهی‌ها' }, { status: 500 })
  }
}

/** ثبت آگهی جدید */
export async function POST(req: Request) {
  const user = await getUserFromRequest(req)
  if (!user) return unauthorized()
  try {
    const body = await req.json()
    if (!body.title || !body.categoryId || !body.price === undefined) {
      return Response.json({ error: 'عنوان، دسته و قیمت الزامی است' }, { status: 400 })
    }

    // محدودیت آگهی فعال بر اساس پلن
    const plan = await db.subscriptionPlan.findUnique({ where: { key: user.planKey } })
    const maxActive = plan?.maxActiveAds ?? 5
    const activeCount = await db.ad.count({ where: { userId: user.id, status: 'ACTIVE' } })
    if (activeCount >= maxActive) {
      return Response.json({ error: `محدودیت پلن ${plan?.name}: حداکثر ${maxActive} آگهی فعال. اشتراک را ارتقا دهید.` }, { status: 403 })
    }

    const slug = body.slug || `${body.title.replace(/\s+/g, '-').slice(0, 40)}-${Math.random().toString(36).slice(2, 7)}`
    const ad = await db.ad.create({
      data: {
        slug,
        title: body.title,
        description: body.description || '',
        price: parseInt(body.price) || 0,
        negotiable: body.negotiable || false,
        province: body.province || user.province || 'تهران',
        city: body.city || user.city || 'تهران',
        images: JSON.stringify(body.images || []),
        categoryId: body.categoryId,
        userId: user.id,
        status: 'ACTIVE', // در پروداکشن: PENDING برای بازبینی
        attributes: JSON.stringify(body.attributes || {}),
        expiresAt: new Date(Date.now() + 30 * 864e5),
      },
      include: { category: true, user: true },
    })

    // نوتیفیکیشن خوش‌آمد
    await db.notification.create({
      data: { userId: user.id, title: 'آگهی شما منتشر شد', body: `آگهی «${ad.title}» با موفقیت منتشر شد`, type: 'AD' },
    })

    return Response.json({ ad })
  } catch (e) {
    console.error('Ads POST error:', e)
    return Response.json({ error: 'خطا در ثبت آگهی' }, { status: 500 })
  }
}
