import { db } from '@/lib/db'
import { getUserFromRequest, unauthorized } from '@/lib/auth'

/** لیست مکالمات کاربر */
export async function GET(req: Request) {
  const user = await getUserFromRequest(req)
  if (!user) return unauthorized()
  try {
    const conversations = await db.conversationA.findMany({
      where: { OR: [{ buyerId: user.id }, { sellerId: user.id }] },
      include: {
        buyer: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        seller: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { lastMessageAt: 'desc' },
    })
    return Response.json({ conversations })
  } catch (e) {
    console.error('Chat GET error:', e)
    return Response.json({ error: 'خطا در دریافت مکالمات' }, { status: 500 })
  }
}

/** شروع مکالمه جدید (یا بازگشت مکالمه موجود) */
export async function POST(req: Request) {
  const user = await getUserFromRequest(req)
  if (!user) return unauthorized()
  try {
    const { sellerId, adId } = await req.json()
    if (!sellerId) return Response.json({ error: 'شناسه فروشنده الزامی است' }, { status: 400 })
    if (sellerId === user.id) return Response.json({ error: 'نمی‌توانید با خودتان گفتگو کنید' }, { status: 400 })

    let conv = await db.conversationA.findFirst({
      where: { buyerId: user.id, sellerId, adId: adId || null },
    })
    if (!conv) {
      conv = await db.conversationA.create({
        data: { buyerId: user.id, sellerId, adId: adId || null },
      })
    }
    return Response.json({ conversation: conv })
  } catch (e) {
    console.error('Chat POST error:', e)
    return Response.json({ error: 'خطا در ایجاد گفتگو' }, { status: 500 })
  }
}
