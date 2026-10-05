import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { aiChat } from '@/lib/ai'

/**
 * توضیح هوشمند جیره — طبق معماری سند:
 * Nutrition Engine (محاسبه عددی) → AI (توضیح و تعامل) → پاسخ نهایی
 */
export async function POST(req: Request) {
  // شناسایی کاربر — اگر دیتابیس در دسترس نبود، بدون ثبت Usage ادامه می‌دهیم
  let user: Awaited<ReturnType<typeof getUserFromRequest>> = null
  try {
    user = await getUserFromRequest(req)
  } catch {
    user = null
  }

  try {
    const { engineOutput, question } = await req.json()
    if (!engineOutput) {
      return Response.json({ error: 'خروجی موتور تغذیه الزامی است' }, { status: 400 })
    }

    const engine = typeof engineOutput === 'string' ? JSON.parse(engineOutput) : engineOutput

    const systemPrompt = `تو مشاور تغذیه هوشمند «بازارگاه» هستی. محاسبات عددی توسط موتور علمی تغذیه (NRC-based) انجام شده و تو فقط باید خروجی را برای کاربر توضیح دهی.

قوانین:
1. هیچ عددی از خودت نساز — همه اعداد را از JSON موتور بردار.
2. به فارسی روان و ساده توضیح بده؛ برای دامدار روستایی هم قابل فهم باشد.
3. ساختار پیشنهادی پاسخ: خلاصه وضعیت حیوان → نیازهای روزانه → ترکیب جیره → هزینه → نکات مهم → هشدارها.
4. اگر جیره NEEDS_ADJUSTMENT است، بگو چه چیزی باید اصلاح شود.
5. تأکید کن برای جیره نهایی صنعتی، مشاور دامپزشک/متخصص تغذیه لازم است.
6. حداکثر 400 کلمه.

${question ? `سؤال خاص کاربر: «${question}» — به آن هم پاسخ بده.` : ''}

خروجی موتور تغذیه:
${JSON.stringify(engine, null, 1)}`

    const { content, tokens } = await aiChat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: 'لطفاً جیره محاسبه‌شده را کامل و قابل فهم توضیح بده.' },
    ], 1000)

    // ثبت Usage (در صورت در دسترس بودن دیتابیس)
    if (user) {
      await db.aIUsage.create({
        data: { userId: user.id, type: 'NUTRITION', tokens, cost: tokens * 0.00002 },
      }).catch(() => {})
    }

    return Response.json({ explanation: content })
  } catch (e) {
    console.error('AI Nutrition error:', e)
    return Response.json({ error: 'خطا در توضیح هوشمند' }, { status: 500 })
  }
}
