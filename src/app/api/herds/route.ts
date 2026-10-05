import { db } from '@/lib/db'
import { getUserFromRequest, unauthorized } from '@/lib/auth'

/** گله‌ها */
export async function GET(req: Request) {
  const user = await getUserFromRequest(req)
  if (!user) return unauthorized()
  const herds = await db.herd.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  })
  return Response.json({ herds })
}

export async function POST(req: Request) {
  const user = await getUserFromRequest(req)
  if (!user) return unauthorized()
  try {
    const { name, species, notes } = await req.json()
    if (!name) return Response.json({ error: 'نام گله الزامی است' }, { status: 400 })
    const herd = await db.herd.create({
      data: { userId: user.id, name, species: species || null, notes: notes || null },
    })
    return Response.json({ herd })
  } catch (e) {
    return Response.json({ error: 'خطا در ایجاد گله' }, { status: 500 })
  }
}
