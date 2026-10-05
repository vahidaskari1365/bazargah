import { db } from '@/lib/db'
import { getUserFromRequest, unauthorized } from '@/lib/auth'

/** هزینه‌ها + تحلیل سود و زیان */
export async function GET(req: Request) {
  const user = await getUserFromRequest(req)
  if (!user) return unauthorized()
  const expenses = await db.expense.findMany({
    where: { userId: user.id },
    include: { animal: { select: { name: true } } },
    orderBy: { date: 'desc' },
    take: 100,
  })
  // تحلیل بر اساس نوع
  const byType: Record<string, number> = {}
  let total = 0
  expenses.forEach(e => {
    byType[e.type] = (byType[e.type] || 0) + e.amount
    total += e.amount
  })
  const byTypeFa: Record<string, string> = {
    FEED: 'خوراک', MEDICINE: 'دارو', VET: 'دامپزشک', TRANSPORT: 'حمل‌ونقل', LABOR: 'نیروی انسانی', OTHER: 'سایر',
  }
  return Response.json({
    expenses, total,
    byType: Object.entries(byType).map(([type, amount]) => ({
      type, label: byTypeFa[type] || type, amount,
      percent: total > 0 ? Math.round((amount / total) * 100) : 0,
    })),
  })
}

export async function POST(req: Request) {
  const user = await getUserFromRequest(req)
  if (!user) return unauthorized()
  try {
    const { type, amount, note, date, animalId } = await req.json()
    const amt = parseInt(String(amount).replace(/[^\d]/g, ''), 10)
    if (!amt || amt <= 0) return Response.json({ error: 'مبلغ نامعتبر' }, { status: 400 })
    const expense = await db.expense.create({
      data: {
        userId: user.id,
        type: type || 'FEED',
        amount: amt,
        note: note || null,
        date: date || new Date().toISOString().slice(0, 10),
        animalId: animalId || null,
      },
    })
    return Response.json({ expense })
  } catch (e) {
    return Response.json({ error: 'خطا در ثبت هزینه' }, { status: 500 })
  }
}
