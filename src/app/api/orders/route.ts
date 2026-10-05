import { db } from '@/lib/db'
import { getUserFromRequest, unauthorized } from '@/lib/auth'

/** ثبت سفارش از سبد خرید — پرداخت از کیف پول */
export async function GET(req: Request) {
  const user = await getUserFromRequest(req)
  if (!user) return unauthorized()
  const orders = await db.order.findMany({
    where: { userId: user.id },
    include: { orderItems: { include: { product: { select: { name: true, image: true } } } } },
    orderBy: { createdAt: 'desc' },
  })
  return Response.json({ orders })
}

export async function POST(req: Request) {
  const user = await getUserFromRequest(req)
  if (!user) return unauthorized()
  try {
    const { address, phone } = await req.json()
    const cartItems = await db.cartItem.findMany({
      where: { userId: user.id },
      include: { product: true },
    })
    if (cartItems.length === 0) {
      return Response.json({ error: 'سبد خرید خالی است' }, { status: 400 })
    }

    const total = cartItems.reduce((s, i) => s + i.product.price * i.qty, 0)
    if (user.walletBalance < total) {
      return Response.json({ error: `موجودی کیف پول کافی نیست. نیاز: ${total.toLocaleString('fa-IR')} تومان` }, { status: 400 })
    }

    const orderNo = 'ORD-' + Date.now().toString(36).toUpperCase()
    const order = await db.order.create({
      data: {
        orderNo,
        userId: user.id,
        items: JSON.stringify(cartItems.map(i => ({ name: i.product.name, qty: i.qty, price: i.product.price }))),
        total,
        address: address || user.city || '',
        phone: phone || user.phone,
        status: 'PAID',
      },
    })

    // آیتم‌های سفارش
    for (const item of cartItems) {
      await db.orderItem.create({
        data: { orderId: order.id, productId: item.productId, qty: item.qty, price: item.product.price },
      })
      // کاهش موجودی
      await db.product.update({ where: { id: item.productId }, data: { stock: { decrement: item.qty } } })
    }

    // پرداخت از کیف پول
    await db.user.update({ where: { id: user.id }, data: { walletBalance: { decrement: total }, loyaltyPoints: { increment: Math.round(total / 10000) } } })
    await db.walletTransaction.create({
      data: { userId: user.id, amount: -total, type: 'PAYMENT', description: `پرداخت سفارش ${orderNo}` },
    })

    // خالی کردن سبد
    await db.cartItem.deleteMany({ where: { userId: user.id } })

    await db.notification.create({
      data: { userId: user.id, title: 'سفارش ثبت شد', body: `سفارش ${orderNo} با موفقیت پرداخت شد`, type: 'ORDER' },
    })

    return Response.json({ order, walletBalance: user.walletBalance - total })
  } catch (e) {
    console.error('Order POST error:', e)
    return Response.json({ error: 'خطا در ثبت سفارش' }, { status: 500 })
  }
}
