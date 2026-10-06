import { db } from '@/lib/db'
import { getUserFromRequest, unauthorized } from '@/lib/auth'

/** پاسخ خودکار فروشنده در حالت آزمایشی — هماهنگ با لایه دمو تا فرآیند «چت با فروشنده» همیشه زنده بماند.
 *  ⚠️ هنگام راه‌اندازی واقعی (فروشندگان واقعی آنلاین) باید غیرفعال شود. */
const SELLER_AUTO_REPLIES: [RegExp, string][] = [
  [/سلام|درود|وقت/, 'سلام 👋 وقت بخیر، در خدمتم.'],
  [/قیمت|تخفیف|آخر|چند/, 'قیمت همونیه که تو آگهی گذاشتم، ولی برای خرید حضوری یکم تخفیف میدم 🙂'],
  [/موجود|هست|آماده/, 'بله موجوده، هر وقت تشریف بیارید آماده‌ست.'],
  [/دیدار|حضوری|ملاقات|آدرس/, 'هر روز از ساعت ۸ صبح تا ۸ شب در مزرعه هستم، آدرس توی آگهیه. 🐄'],
  [/وزن|نژاد|سن|سند|شناسنامه/, 'جزئیات کامل توی آگهی هست؛ سند و شناسنامه هم کامل داره ✅'],
]

function sellerAutoReply(text: string): string {
  const t = text || ''
  for (const [re, reply] of SELLER_AUTO_REPLIES) {
    if (re.test(t)) return reply
  }
  return 'چشم، هماهنگ می‌کنم و خبر میدم 🙏'
}

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

    // پاسخ خودکار فروشنده (حالت آزمایشی): خریدار پیام داد → پاسخ فروشنده با تأخیر کوتاه ثبت می‌شود
    // createdAt حدود ۲.۵ ثانیه در آینده تا با polling ۳ ثانیه‌ای طبیعی نمایش داده شود
    let autoReply = null
    if (conv.buyerId === user.id) {
      try {
        autoReply = await db.message.create({
          data: {
            conversationId: id,
            senderId: conv.sellerId,
            content: sellerAutoReply(content.trim()),
            createdAt: new Date(Date.now() + 2500),
          },
        })
        await db.notification.create({
          data: { userId: conv.buyerId, title: 'پاسخ فروشنده', body: autoReply.content.slice(0, 60), type: 'MESSAGE' },
        }).catch(() => {})
      } catch { /* پاسخ خودکار حیاتی نیست */ }
    }

    return Response.json({ message, autoReply })
  } catch (e) {
    console.error('Messages POST error:', e)
    return Response.json({ error: 'خطا در ارسال پیام' }, { status: 500 })
  }
}
