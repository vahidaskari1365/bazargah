import { db } from '@/lib/db'
import { getUserFromRequest, unauthorized } from '@/lib/auth'

/** پیام‌های یک مکالمه (با polling سمت کلاینت برای realtime) */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(req)
  if (!user) return unauthorized()
  try {
    const { id } = await params
    const conv = await db.conversationA.findUnique({
      where: { id },
      include: { buyer: true, seller: true },
    })
    if (!conv) return Response.json({ error: 'مکالمه یافت نشد' }, { status: 404 })
    if (conv.buyerId !== user.id && conv.sellerId !== user.id) {
      return Response.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
    }

    // علامت‌گذاری پیام‌های طرف مقابل به عنوان خوانده‌شده
    await db.message.updateMany({
      where: { conversationId: id, senderId: { not: user.id }, isRead: false },
      data: { isRead: true },
    })

    const messages = await db.message.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: 'asc' },
    })
    return Response.json({
      messages,
      meId: user.id,
      conversation: {
        id: conv.id,
        buyerId: conv.buyerId,
        sellerId: conv.sellerId,
        buyer: { firstName: conv.buyer.firstName, lastName: conv.buyer.lastName, isVerified: conv.buyer.isVerified },
        seller: { firstName: conv.seller.firstName, lastName: conv.seller.lastName, isVerified: conv.seller.isVerified },
      },
    })
  } catch (e) {
    console.error('Messages GET error:', e)
    return Response.json({ error: 'خطای سرور' }, { status: 500 })
  }
}

/** ارسال پیام */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(req)
  if (!user) return unauthorized()
  try {
    const { id } = await params
    const { content } = await req.json()
    if (!content || !content.trim()) return Response.json({ error: 'متن پیام خالی است' }, { status: 400 })

    const conv = await db.conversationA.findUnique({ where: { id } })
    if (!conv) return Response.json({ error: 'مکالمه یافت نشد' }, { status: 404 })
    if (conv.buyerId !== user.id && conv.sellerId !== user.id) {
      return Response.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
    }

    const message = await db.message.create({
      data: { conversationId: id, senderId: user.id, content: content.trim() },
    })
    await db.conversationA.update({
      where: { id },
      data: { lastMessage: content.trim().slice(0, 80), lastMessageAt: new Date() },
    })

    // نوتیفیکیشن برای طرف مقابل
    const otherId = conv.buyerId === user.id ? conv.sellerId : conv.buyerId
    await db.notification.create({
      data: { userId: otherId, title: 'پیام جدید', body: content.trim().slice(0, 60), type: 'MESSAGE' },
    }).catch(() => {})

    return Response.json({ message })
  } catch (e) {
    console.error('Messages POST error:', e)
    return Response.json({ error: 'خطا در ارسال پیام' }, { status: 500 })
  }
}
