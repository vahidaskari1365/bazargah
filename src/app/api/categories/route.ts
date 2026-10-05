import { db } from '@/lib/db'

/** لیست دسته‌بندی‌ها */
export async function GET() {
  const categories = await db.category.findMany({
    orderBy: { order: 'asc' },
  })
  return Response.json({ categories })
}
