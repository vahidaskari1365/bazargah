import { db } from '@/lib/db'

/** لیست دامپزشکان */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const city = searchParams.get('city')
    const specialty = searchParams.get('specialty')
    const where: Record<string, string> = {}
    if (city) where.city = { contains: city } as never
    if (specialty) where.specialty = { contains: specialty } as never

    const vets = await db.vet.findMany({ where, orderBy: { rating: 'desc' } })
    return Response.json({ vets })
  } catch (e) {
    console.error('Vets error:', e)
    return Response.json({ error: 'خطا در دریافت دامپزشکان' }, { status: 500 })
  }
}
