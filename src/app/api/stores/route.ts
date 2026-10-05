import { db } from '@/lib/db'

/** لیست فروشگاه‌ها با محصولات */
export async function GET() {
  try {
    const stores = await db.store.findMany({
      include: { products: { where: { isActive: true } } },
      orderBy: { rating: 'desc' },
    })
    return Response.json({ stores })
  } catch (e) {
    console.error('Stores error:', e)
    return Response.json({ error: 'خطا در دریافت فروشگاه‌ها' }, { status: 500 })
  }
}
