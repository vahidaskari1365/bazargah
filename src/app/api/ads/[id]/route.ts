import { db } from '@/lib/db'

/** جزئیات آگهی + افزایش بازدید */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ad = await db.ad.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      include: {
        category: true,
        user: { select: { id: true, firstName: true, lastName: true, isVerified: true, city: true, phone: true, createdAt: true } },
      },
    })
    if (!ad) return Response.json({ error: 'آگهی یافت نشد' }, { status: 404 })

    // افزایش بازدید (async، بدون انتظار)
    db.ad.update({ where: { id: ad.id }, data: { views: { increment: 1 } } }).catch(() => {})

    // آگهی‌های مشابه
    const similar = await db.ad.findMany({
      where: { categoryId: ad.categoryId, id: { not: ad.id }, status: 'ACTIVE' },
      take: 4,
      include: { category: { select: { name: true } } },
    })

    return Response.json({ ad, similar })
  } catch (e) {
    console.error('Ad detail error:', e)
    return Response.json({ error: 'خطای سرور' }, { status: 500 })
  }
}

/** ویرایش آگهی (فقط صاحب آگهی) */
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const ad = await db.ad.update({ where: { id }, data: body })
    return Response.json({ ad })
  } catch (e) {
    return Response.json({ error: 'خطا در ویرایش' }, { status: 500 })
  }
}

/** حذف آگهی */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.ad.update({ where: { id }, data: { status: 'DELETED' } })
    return Response.json({ success: true })
  } catch (e) {
    return Response.json({ error: 'خطا در حذف' }, { status: 500 })
  }
}
