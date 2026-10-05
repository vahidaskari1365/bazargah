import { db } from '@/lib/db'

/**
 * Nutrition Engine API — محاسبات عددی جیره (خالص علمی، بدون AI)
 * ورودی: مشخصات حیوان + هدف + محیط
 * خروجی: نیازها + جیره + هزینه + انحراف
 */
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { species, ageMonths, weightKg, goal, environment, tempC, milkLiters, pregnancyMonths, gender } = body

    if (!species || !weightKg || !goal) {
      return Response.json({ error: 'گونه، وزن و هدف الزامی است' }, { status: 400 })
    }

    // دریافت بانک خوراک — فیلتر بر اساس گونه (خوراک سگ برای گاو استفاده نمی‌شود!)
    const foods = await db.food.findMany()
    const speciesCompatible = foods.filter(f => f.species === 'ALL' || f.species === species)
    const foodNutritions = speciesCompatible.map(f => ({
      id: f.id, name: f.name, category: f.category, dryMatter: f.dryMatter,
      protein: f.protein, energy: f.energy, fiber: f.fiber, fat: f.fat,
      calcium: f.calcium, phosphorus: f.phosphorus, pricePerKg: f.pricePerKg,
    }))

    // فیلتر خوراک‌های موجود (اختیاری)
    let usable = foodNutritions
    if (body.availableFoods && Array.isArray(body.availableFoods) && body.availableFoods.length > 0) {
      const filtered = foodNutritions.filter(f => body.availableFoods.includes(f.id))
      if (filtered.length >= 3) usable = filtered
    }

    const { runNutritionEngine } = await import('@/lib/nutrition-engine')
    const result = runNutritionEngine(
      {
        species, ageMonths: parseInt(ageMonths) || 12, gender: gender || 'FEMALE',
        weightKg: parseFloat(weightKg), goal, environment: environment || 'FARM',
        tempC: tempC !== undefined ? parseFloat(tempC) : undefined,
        milkLiters: milkLiters ? parseFloat(milkLiters) : undefined,
        pregnancyMonths: pregnancyMonths ? parseInt(pregnancyMonths) : undefined,
      },
      usable
    )

    return Response.json(result)
  } catch (e) {
    console.error('Nutrition calculate error:', e)
    return Response.json({ error: 'خطا در محاسبه جیره' }, { status: 500 })
  }
}
