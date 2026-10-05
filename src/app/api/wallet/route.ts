import { db } from '@/lib/db'
import { getUserFromRequest, unauthorized } from '@/lib/auth'

/** کیف پول: تراکنش‌ها + شارژ (در دمو شارژ فوری شبیه‌سازی می‌شود) */
export async function GET(req: Request) {
  const user = await getUserFromRequest(req)
  if (!user) return unauthorized()
  const transactions = await db.walletTransaction.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
  return Response.json({ balance: user.walletBalance, transactions })
}

/** شارژ کیف پول — در نسخه دمو بلافاصله شارژ می‌شود (درگاه واقعی در پروداکشن) */
export async function POST(req: Request) {
  const user = await getUserFromRequest(req)
  if (!user) return unauthorized()
  try {
    const { amount } = await req.json()
    const amt = parseInt(amount)
    if (!amt || amt < 10000 || amt > 100000000) {
      return Response.json({ error: 'مبلغ باید بین 10,000 تا 100,000,000 تومان باشد' }, { status: 400 })
    }
    await db.user.update({ where: { id: user.id }, data: { walletBalance: { increment: amt } } })
    await db.walletTransaction.create({
      data: { userId: user.id, amount: amt, type: 'CHARGE', description: 'شارژ کیف پول (درگاه دمو)' },
    })
    const updated = await db.user.findUnique({ where: { id: user.id } })
    return Response.json({ success: true, balance: updated?.walletBalance })
  } catch (e) {
    return Response.json({ error: 'خطا در شارژ' }, { status: 500 })
  }
}
