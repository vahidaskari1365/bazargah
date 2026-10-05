import { db } from '@/lib/db'
import { getUserFromRequest, unauthorized, parseRoles } from '@/lib/auth'

/** آمار داشبورد ادمین */
export async function GET(req: Request) {
  const user = await getUserFromRequest(req)
  if (!user) return unauthorized()
  const roles = parseRoles(user.roles)
  if (!roles.includes('ADMIN')) {
    return Response.json({ error: 'دسترسی ادمین لازم است' }, { status: 403 })
  }

  const [totalUsers, totalAds, activeAds, totalOrders, totalRevenue, aiUsageCount, aiTokens, pendingReports] = await Promise.all([
    db.user.count(),
    db.ad.count(),
    db.ad.count({ where: { status: 'ACTIVE' } }),
    db.order.count(),
    db.walletTransaction.aggregate({ where: { type: 'PAYMENT' }, _sum: { amount: true } }),
    db.aIUsage.count(),
    db.aIUsage.aggregate({ _sum: { tokens: true } }),
    db.report.count({ where: { status: 'PENDING' } }),
  ])

  // AI usage بر اساس روز (7 روز اخیر)
  const weekAgo = new Date(Date.now() - 7 * 864e5)
  const aiByType = await db.aIUsage.groupBy({
    by: ['type'],
    where: { createdAt: { gte: weekAgo } },
    _count: true,
    _sum: { tokens: true },
  })

  // کاربران جدید 7 روز اخیر
  const newUsers = await db.user.count({ where: { createdAt: { gte: weekAgo } } })

  return Response.json({
    stats: {
      totalUsers, newUsers, totalAds, activeAds, totalOrders,
      totalRevenue: Math.abs(totalRevenue._sum.amount || 0),
      aiUsageCount, aiTokens: aiTokens._sum.tokens || 0, pendingReports,
    },
    aiByType: aiByType.map(t => ({ type: t.type, count: t._count, tokens: t._sum.tokens || 0 })),
  })
}
