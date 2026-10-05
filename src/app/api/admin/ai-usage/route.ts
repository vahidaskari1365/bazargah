import { db } from '@/lib/db'
import { getUserFromRequest, unauthorized, parseRoles } from '@/lib/auth'

/** گزارش مصرف AI (ادمین) */
export async function GET(req: Request) {
  const admin = await getUserFromRequest(req)
  if (!admin) return unauthorized()
  if (!parseRoles(admin.roles).includes('ADMIN')) {
    return Response.json({ error: 'دسترسی ادمین لازم است' }, { status: 403 })
  }

  const dayAgo = new Date(Date.now() - 864e5)
  const [total, today, byUser] = await Promise.all([
    db.aIUsage.aggregate({ _count: true, _sum: { tokens: true, cost: true } }),
    db.aIUsage.aggregate({ where: { createdAt: { gte: dayAgo } }, _count: true, _sum: { tokens: true } }),
    db.aIUsage.groupBy({
      by: ['userId'],
      _count: true,
      _sum: { tokens: true },
      orderBy: { _count: { userId: 'desc' } },
      take: 10,
    }),
  ])

  const users = await db.user.findMany({
    where: { id: { in: byUser.map(u => u.userId) } },
    select: { id: true, firstName: true, lastName: true, phone: true, planKey: true },
  })

  return Response.json({
    total: { count: total._count, tokens: total._sum.tokens || 0, cost: total._sum.cost || 0 },
    today: { count: today._count, tokens: today._sum.tokens || 0 },
    topUsers: byUser.map(u => {
      const user = users.find(x => x.id === u.userId)
      return {
        user: user ? `${user.firstName || ''} ${user.lastName || ''} (${user.phone})` : u.userId,
        count: u._count,
        tokens: u._sum.tokens || 0,
      }
    }),
  })
}
