import { db } from '@/lib/db'
import { getUserFromRequest, unauthorized } from '@/lib/auth'

/** لیست حیوانات کاربر */
export async function GET(req: Request) {
  const user = await getUserFromRequest(req)
  if (!user) return unauthorized()
  const animals = await db.animal.findMany({
    where: { userId: user.id },
    include: {
      vaccinations: { orderBy: { date: 'desc' }, take: 3 },
      healthRecords: { orderBy: { date: 'desc' }, take: 3 },
      dailyLogs: { orderBy: { date: 'desc' }, take: 3 },
    },
    orderBy: { createdAt: 'desc' },
  })
  return Response.json({ animals })
}

/** ثبت حیوان جدید با Animal ID یکتا */
export async function POST(req: Request) {
  const user = await getUserFromRequest(req)
  if (!user) return unauthorized()
  try {
    const body = await req.json()
    if (!body.name || !body.species) {
      return Response.json({ error: 'نام و گونه الزامی است' }, { status: 400 })
    }
    const publicId = 'BAZ-' + body.species.slice(0, 2).toUpperCase() + '-' + Math.random().toString(36).slice(2, 8).toUpperCase()
    const animal = await db.animal.create({
      data: {
        publicId,
        name: body.name,
        species: body.species,
        breed: body.breed || null,
        gender: body.gender || 'UNKNOWN',
        birthDate: body.birthDate || null,
        weight: body.weight ? parseFloat(body.weight) : null,
        color: body.color || null,
        purpose: body.purpose || null,
        environment: body.environment || null,
        images: JSON.stringify(body.images || []),
        notes: body.notes || null,
        isPublic: body.isPublic || false,
        userId: user.id,
      },
    })
    return Response.json({ animal })
  } catch (e) {
    console.error('Animal create error:', e)
    return Response.json({ error: 'خطا در ثبت حیوان' }, { status: 500 })
  }
}
