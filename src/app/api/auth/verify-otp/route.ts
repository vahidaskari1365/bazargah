import { db } from '@/lib/db'
import { createToken } from '@/lib/auth'

/** تأیید کد OTP و ورود/ثبت‌نام */
export async function POST(req: Request) {
  try {
    const { phone, code } = await req.json()
    if (!phone || !code) {
      return Response.json({ error: 'شماره و کد الزامی است' }, { status: 400 })
    }

    const otp = await db.oTP.findFirst({
      where: { phone, code, used: false, expiresAt: { gte: new Date() } },
      orderBy: { createdAt: 'desc' },
    })
    if (!otp) {
      // جلوگیری از brute force: اگر آخرین کدِ فعال این شماره بیش از ۵ بار اشتباه وارد شده، بلاک
      const lastActive = await db.oTP.findFirst({
        where: { phone, used: false, expiresAt: { gte: new Date() } },
        orderBy: { createdAt: 'desc' },
      })
      if (lastActive && lastActive.attempts >= 5) {
        await db.oTP.update({ where: { id: lastActive.id }, data: { used: true } })
        return Response.json({ error: 'تلاش‌های بیش از حد — کد جدید درخواست کنید' }, { status: 429 })
      }
      if (lastActive) {
        await db.oTP.update({ where: { id: lastActive.id }, data: { attempts: { increment: 1 } } })
      }
      return Response.json({ error: 'کد نامعتبر یا منقضی شده است' }, { status: 400 })
    }
    await db.oTP.update({ where: { id: otp.id }, data: { used: true } })

    // ورود یا ساخت کاربر
    let user = await db.user.findUnique({ where: { phone } })
    const isNew = !user
    if (!user) {
      user = await db.user.create({
        data: {
          phone,
          roles: JSON.stringify(['BUYER']),
          referralCode: 'BAZ-' + Math.random().toString(36).slice(2, 8).toUpperCase(),
        },
      })
    }

    const token = createToken(user.id, user.phone)
    return Response.json({
      success: true,
      isNew,
      token,
      user: { ...user, roleList: JSON.parse(user.roles) },
    })
  } catch (e) {
    console.error('Verify error:', e)
    return Response.json({ error: 'خطای سرور' }, { status: 500 })
  }
}
