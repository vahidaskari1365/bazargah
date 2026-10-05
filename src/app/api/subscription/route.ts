import { db } from '@/lib/db'
import { getUserFromRequest, unauthorized } from '@/lib/auth'

/** پلن‌های اشتراک */
export async function GET(req: Request) {
  const plans = await db.subscriptionPlan.findMany({ orderBy: { price: 'asc' } })
  const user = await getUserFromRequest(req)
  return Response.json({ plans, currentPlan: user?.planKey || null })
}

/** خرید اشتراک از کیف پول */
export async function POST(req: Request) {
  const user = await getUserFromRequest(req)
  if (!user) return unauthorized()
  try {
    const { planKey } = await req.json()
    const plan = await db.subscriptionPlan.findUnique({ where: { key: planKey } })
    if (!plan) return Response.json({ error: 'پلن یافت نشد' }, { status: 404 })
    if (plan.price === 0) {
      // بازگشت به رایگان
      await db.user.update({ where: { id: user.id }, data: { planKey: 'FREE', planExpiresAt: null } })
      return Response.json({ success: true, planKey: 'FREE' })
    }

    if (user.walletBalance < plan.price) {
      return Response.json({ error: `موجودی کافی نیست. قیمت پلن: ${plan.price.toLocaleString('fa-IR')} تومان` }, { status: 400 })
    }

    const expiresAt = new Date(Date.now() + 30 * 864e5)
    await db.user.update({ where: { id: user.id }, data: { planKey, planExpiresAt: expiresAt } })
    await db.userSubscription.create({
      data: { userId: user.id, planKey, price: plan.price, expiresAt, status: 'ACTIVE' },
    })
    await db.walletTransaction.create({
      data: { userId: user.id, amount: -plan.price, type: 'PAYMENT', description: `خرید اشتراک ${plan.name}` },
    })
    await db.notification.create({
      data: { userId: user.id, title: 'اشتراک فعال شد', body: `اشتراک ${plan.name} تا 30 روز فعال است`, type: 'SUBSCRIPTION' },
    })

    return Response.json({ success: true, planKey, expiresAt, walletBalance: user.walletBalance - plan.price })
  } catch (e) {
    console.error('Subscribe error:', e)
    return Response.json({ error: 'خطا در خرید اشتراک' }, { status: 500 })
  }
}
