import { db } from '@/lib/db'

/**
 * درخواست کد تأیید (OTP)
 * در نسخه دمو کد در پاسخ برگردانده می‌شود؛ در پروداکشن باید از SMS Gateway استفاده شود.
 */
export async function POST(req: Request) {
  try {
    const { phone } = await req.json()
    if (!phone || !/^09\d{9}$/.test(phone)) {
      return Response.json({ error: 'شماره موبایل نامعتبر است (مثال: 09123456789)' }, { status: 400 })
    }

    // Rate limit: حداکثر 3 کد در 10 دقیقه
    const recent = await db.oTP.count({
      where: { phone, createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) } },
    })
    if (recent >= 3) {
      return Response.json({ error: 'تعداد درخواست زیاد است، کمی بعد تلاش کنید' }, { status: 429 })
    }

    // کد 5 رقمی (مطابق الگوی OTP ورودی)
    const code = String(Math.floor(10000 + Math.random() * 90000))
    await db.oTP.create({
      data: { phone, code, expiresAt: new Date(Date.now() + 2 * 60 * 1000) },
    })

    return Response.json({
      success: true,
      message: 'کد تأیید ارسال شد',
      demoCode: code, // در پروداکشن حذف شود
    })
  } catch (e) {
    console.error('OTP error:', e)
    return Response.json({ error: 'خطای سرور' }, { status: 500 })
  }
}
