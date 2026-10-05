import { db } from '@/lib/db'
import { getUserFromRequest, unauthorized } from '@/lib/auth'
import { aiChat, ChatMessage } from '@/lib/ai'

/**
 * AI دامپزشک — چت هوشمند واقعی با z-ai SDK
 * - کاربر رایگان: 10 پیام در روز
 * - کاربر اشتراکی: مطابق پلن
 * - ثبت کامل Usage برای کنترل هزینه
 * - ایمنی: تشخیص قطعی ممنوع، ارجاع به دامپزشک واقعی
 */

const VET_SYSTEM_PROMPT = `تو «دستیار دامپزشکی بازارگاه» هستی؛ یک دستیار هوشمند کمک‌آموزشی در حوزه سلامت دام، طیور و حیوانات خانگی.

قوانین بسیار مهم:
1. هرگز تشخیص قطعی پزشکی نده. همیشه بگو پاسخ تو «حدسی آموزشی» است و جایگزین معاینه دامپزشک نیست.
2. در موارد خطرناک (خونریزی شدید، تنگی نفس، تشنج، بی‌اشتهایی بیش از 24 ساعت، اسهال خونی، سقط، نفخ شدید نشخوارکنندگان، گزیدگی مار و...) فوراً به دامپزشک واقعی ارجاع بده و توصیه کن از دکمه «رزرو دامپزشک» در بازارگاه استفاده کند.
3. پاسخ‌ها را به زبان فارسی روان، ساختاریافته و کاربردی بده. از لیست و بولت استفاده کن.
4. اگر اطلاعات کافی نیست، سؤالات دقیق بپرس: گونه حیوان، نژاد، سن، وزن، علائم، مدت علائم، خوراک و شرایط نگهداری.
5. برای داروها فقط دانش عمومی بده و تأکید کن دوز دقیق را دامپزشک باید تعیین کند.
6. طول پاسخ مناسب باشد: کوتاه و مفید، حداکثر 300 کلمه.
7. در انتها اگر مرتبط بود، یک جمله درباره خدمات مرتبط بازارگاه (دامپزشک، خوراک) بنویس.`

export async function POST(req: Request) {
  const user = await getUserFromRequest(req)
  if (!user) return unauthorized()

  try {
    const { messages } = await req.json() as { messages: ChatMessage[] }
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: 'پیام ارسال نشده است' }, { status: 400 })
    }

    // --- محدودیت پیام روزانه بر اساس پلن ---
    const plan = await db.subscriptionPlan.findUnique({ where: { key: user.planKey } })
    const dailyLimit = plan?.dailyAiMessages ?? 10

    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    const usageToday = await db.aIUsage.count({
      where: { userId: user.id, type: 'VET', createdAt: { gte: startOfDay } },
    })

    if (usageToday >= dailyLimit) {
      return Response.json({
        error: `سهمیه پیام هوش مصنوعی امروز (${dailyLimit} پیام) تمام شد`,
        limitReached: true,
        planName: plan?.name,
        upgradeHint: user.planKey === 'FREE' ? 'با ارتقای اشتراک، سهمیه پیام‌ها چند برابر می‌شود' : null,
      }, { status: 429 })
    }

    // --- Anti-spam: طول پیام ---
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')
    if (!lastUserMsg || lastUserMsg.content.trim().length < 2) {
      return Response.json({ error: 'متن پیام کوتاه است' }, { status: 400 })
    }
    if (lastUserMsg.content.length > 3000) {
      return Response.json({ error: 'متن پیام بیش از حد طولانی است (حداکثر 3000 نویسه)' }, { status: 400 })
    }

    // --- فراخوانی هوش مصنوعی واقعی ---
    const aiMessages: ChatMessage[] = [
      { role: 'system', content: VET_SYSTEM_PROMPT },
      // حداکثر 8 پیام آخر برای مدیریت توکن
      ...messages.slice(-8),
    ]

    const { content, tokens } = await aiChat(aiMessages, 900)

    // --- ثبت Usage ---
    await db.aIUsage.create({
      data: { userId: user.id, type: 'VET', tokens, cost: tokens * 0.00002 },
    })

    return Response.json({
      reply: content,
      usage: { used: usageToday + 1, limit: dailyLimit, remaining: Math.max(dailyLimit - usageToday - 1, 0) },
    })
  } catch (e) {
    console.error('AI Vet error:', e)
    return Response.json({ error: 'خطا در پردازش هوش مصنوعی. لطفاً دوباره تلاش کنید.' }, { status: 500 })
  }
}
