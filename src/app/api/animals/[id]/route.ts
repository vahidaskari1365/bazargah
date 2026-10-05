import { db } from '@/lib/db'
import { getUserFromRequest, unauthorized } from '@/lib/auth'

/** پرونده کامل حیوان */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(req)
  if (!user) return unauthorized()
  try {
    const { id } = await params
    const animal = await db.animal.findFirst({
      where: { OR: [{ id }, { publicId: id }] },
      include: {
        healthRecords: { orderBy: { date: 'desc' } },
        vaccinations: { orderBy: { date: 'desc' } },
        medications: { orderBy: { startDate: 'desc' } },
        tests: { orderBy: { date: 'desc' } },
        dailyLogs: { orderBy: { date: 'desc' }, take: 30 },
        nutritionPlans: { orderBy: { createdAt: 'desc' }, take: 5 },
        expenses: { orderBy: { date: 'desc' }, take: 20 },
      },
    })
    if (!animal) return Response.json({ error: 'حیوان یافت نشد' }, { status: 404 })
    return Response.json({ animal })
  } catch (e) {
    console.error('Animal GET error:', e)
    return Response.json({ error: 'خطای سرور' }, { status: 500 })
  }
}

/** ویرایش حیوان */
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(req)
  if (!user) return unauthorized()
  try {
    const { id } = await params
    const body = await req.json()
    const animal = await db.animal.findUnique({ where: { id } })
    if (!animal || animal.userId !== user.id) {
      return Response.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
    }
    const data: Record<string, string | number | boolean | null> = {}
    const fields = ['name', 'breed', 'gender', 'birthDate', 'color', 'purpose', 'environment', 'notes']
    fields.forEach(f => { if (body[f] !== undefined) data[f] = body[f] })
    if (body.weight !== undefined) data.weight = parseFloat(body.weight) || null
    if (body.isPublic !== undefined) data.isPublic = body.isPublic
    const updated = await db.animal.update({ where: { id }, data })
    return Response.json({ animal: updated })
  } catch (e) {
    return Response.json({ error: 'خطا در ویرایش' }, { status: 500 })
  }
}

/** حذف حیوان */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(req)
  if (!user) return unauthorized()
  try {
    const { id } = await params
    const animal = await db.animal.findUnique({ where: { id } })
    if (!animal || animal.userId !== user.id) {
      return Response.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
    }
    await db.animal.delete({ where: { id } })
    return Response.json({ success: true })
  } catch (e) {
    return Response.json({ error: 'خطا در حذف' }, { status: 500 })
  }
}
