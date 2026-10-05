import { db } from '@/lib/db'
import { seedDatabase } from '@/lib/seed-data'

export async function POST() {
  try {
    const result = await seedDatabase()
    return Response.json(result)
  } catch (e) {
    console.error('Seed error:', e)
    return Response.json({ error: String(e) }, { status: 500 })
  }
}

export async function GET() {
  return POST()
}
