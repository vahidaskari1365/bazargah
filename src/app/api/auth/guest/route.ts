import { db } from '@/lib/db'
import { createToken } from '@/lib/auth'

/** حساب مهمان اشتراکی — امکان استفاده از همه امکانات بدون ثبت‌نام (فعلاً) */
export const GUEST_PHONE = '09000000000'

export async function POST() {
  try {
    let user = await db.user.findUnique({ where: { phone: GUEST_PHONE } })
    if (!user) {
      user = await db.user.create({
        data: {
          phone: GUEST_PHONE,
          firstName: 'مهمان',
          lastName: 'بازارگاه',
          roles: JSON.stringify(['BUYER']),
          isVerified: true,
          walletBalance: 500_000_000, // اعتبار آزمایشی برای تست خرید اشتراک
          referralCode: 'GUEST-DEMO',
        },
      })
    }

    const token = createToken(user.id, user.phone)
    return Response.json({
      success: true,
      token,
      user: { ...user, roleList: JSON.parse(user.roles) },
    })
  } catch (e) {
    console.error('Guest login error:', e)
    return Response.json({ error: 'خطای سرور' }, { status: 500 })
  }
}
