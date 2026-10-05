import { db } from '@/lib/db'
import { getUserFromRequest, unauthorized } from '@/lib/auth'

/** رزرو نوبت دامپزشک */
export async function POST(req: Request) {
  const user = await getUserFromRequest(req)
  if (!user) return unauthorized()
  try {
    const { vetId, slot, sessionType } = await req.json()
    if (!vetId || !slot) {
      return Response.json({ error: 'دامپزشک و زمان انتخاب شوند' }, { status: 400 })
    }
    const vet = await db.vet.findUnique({ where: { id: vetId } })
    if (!vet) return Response.json({ error: 'دامپزشک یافت نشد' }, { status: 404 })

    const price = vet.pricePerSession
    const commission = Math.round(price * (vet.commissionRate / 100))

    // کسر از کیف پول
    if (user.walletBalance < price) {
      return Response.json({ error: `موجودی کیف پول کافی نیست (موجودی: ${(user.walletBalance).toLocaleString('fa-IR')} تومان)` }, { status: 400 })
    }
    await db.user.update({ where: { id: user.id }, data: { walletBalance: { decrement: price } } })
    await db.walletTransaction.create({
      data: { userId: user.id, amount: -price, type: 'PAYMENT', description: `رزرو نوبت ${vet.name}` },
    })

    const booking = await db.booking.create({
      data: { vetId, userId: user.id, slot, sessionType: sessionType || 'CHAT', status: 'CONFIRMED', price, commission },
      include: { vet: true },
    })

    await db.notification.create({
      data: { userId: user.id, title: 'رزرو تأیید شد', body: `نوبت شما با ${vet.name} در ساعت ${slot} ثبت شد`, type: 'BOOKING' },
    })

    return Response.json({ booking, walletBalance: user.walletBalance - price })
  } catch (e) {
    console.error('Booking error:', e)
    return Response.json({ error: 'خطا در رزرو' }, { status: 500 })
  }
}

/** لیست رزروهای کاربر */
export async function GET(req: Request) {
  const user = await getUserFromRequest(req)
  if (!user) return unauthorized()
  const bookings = await db.booking.findMany({
    where: { userId: user.id },
    include: { vet: true },
    orderBy: { createdAt: 'desc' },
  })
  return Response.json({ bookings })
}
