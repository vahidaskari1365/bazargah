import { db } from '@/lib/db'
import { getUserFromRequest, unauthorized } from '@/lib/auth'

/**
 * مدیریت سوابق سلامت حیوان
 * POST body: { type: 'HEALTH'|'VACCINATION'|'MEDICATION'|'TEST'|'DAILY_LOG', data: {...} }
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(req)
  if (!user) return unauthorized()
  try {
    const { id } = await params
    const animal = await db.animal.findUnique({ where: { id } })
    if (!animal || animal.userId !== user.id) {
      return Response.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
    }

    const { type, data } = await req.json()
    const today = new Date().toISOString().slice(0, 10)

    switch (type) {
      case 'HEALTH': {
        const rec = await db.healthRecord.create({
          data: {
            animalId: id,
            type: data.type || 'NOTE',
            title: data.title,
            description: data.description || null,
            vetName: data.vetName || null,
            date: data.date || today,
          },
        })
        return Response.json({ record: rec })
      }
      case 'VACCINATION': {
        const rec = await db.vaccination.create({
          data: {
            animalId: id,
            vaccine: data.vaccine,
            date: data.date || today,
            nextDate: data.nextDate || null,
            vetName: data.vetName || null,
          },
        })
        // یادآوری واکسن بعدی
        if (data.nextDate) {
          await db.notification.create({
            data: { userId: user.id, title: 'یادآور واکسن ثبت شد', body: `دوز بعدی واکسن ${data.vaccine} برای ${animal.name} در تاریخ ${data.nextDate}`, type: 'REMINDER' },
          })
        }
        return Response.json({ record: rec })
      }
      case 'MEDICATION': {
        const rec = await db.medication.create({
          data: {
            animalId: id,
            name: data.name,
            dose: data.dose || null,
            startDate: data.startDate || today,
            endDate: data.endDate || null,
            notes: data.notes || null,
          },
        })
        return Response.json({ record: rec })
      }
      case 'TEST': {
        const rec = await db.test.create({
          data: { animalId: id, name: data.name, result: data.result || null, date: data.date || today },
        })
        return Response.json({ record: rec })
      }
      case 'DAILY_LOG': {
        const rec = await db.dailyLog.create({
          data: {
            animalId: id,
            date: data.date || today,
            weight: data.weight ? parseFloat(data.weight) : null,
            feedKg: data.feedKg ? parseFloat(data.feedKg) : null,
            waterL: data.waterL ? parseFloat(data.waterL) : null,
            production: data.production || null,
            activity: data.activity || null,
            symptoms: data.symptoms || null,
          },
        })
        // به‌روزرسانی وزن حیوان
        if (data.weight) {
          await db.animal.update({ where: { id }, data: { weight: parseFloat(data.weight) } })
        }
        return Response.json({ record: rec })
      }
      default:
        return Response.json({ error: 'نوع رکورد نامعتبر' }, { status: 400 })
    }
  } catch (e) {
    console.error('Animal record error:', e)
    return Response.json({ error: 'خطا در ثبت رکورد' }, { status: 500 })
  }
}
