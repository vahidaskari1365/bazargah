import { db } from '@/lib/db'
import { getUserFromRequest, unauthorized } from '@/lib/auth'

/** سبد خرید — GET نمایش، POST افزودن، DELETE حذف */
export async function GET(req: Request) {
  const user = await getUserFromRequest(req)
  if (!user) return unauthorized()
  const items = await db.cartItem.findMany({
    where: { userId: user.id },
    include: { product: { include: { store: { select: { name: true, slug: true } } } } },
    orderBy: { createdAt: 'desc' },
  })
  const total = items.reduce((s, i) => s + i.product.price * i.qty, 0)
  return Response.json({ items, total })
}

export async function POST(req: Request) {
  const user = await getUserFromRequest(req)
  if (!user) return unauthorized()
  try {
    const { productId, qty } = await req.json()
    if (!productId) return Response.json({ error: 'محصول مشخص نیست' }, { status: 400 })

    const existing = await db.cartItem.findUnique({
      where: { userId_productId: { userId: user.id, productId } },
    })
    if (existing) {
      await db.cartItem.update({ where: { id: existing.id }, data: { qty: existing.qty + (qty || 1) } })
    } else {
      await db.cartItem.create({ data: { userId: user.id, productId, qty: qty || 1 } })
    }
    return Response.json({ success: true })
  } catch (e) {
    return Response.json({ error: 'خطا در افزودن به سبد' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const user = await getUserFromRequest(req)
  if (!user) return unauthorized()
  try {
    const { searchParams } = new URL(req.url)
    const itemId = searchParams.get('itemId')
    if (!itemId) return Response.json({ error: 'شناسه الزامی است' }, { status: 400 })
    await db.cartItem.deleteMany({ where: { id: itemId, userId: user.id } })
    return Response.json({ success: true })
  } catch (e) {
    return Response.json({ error: 'خطا در حذف' }, { status: 500 })
  }
}
