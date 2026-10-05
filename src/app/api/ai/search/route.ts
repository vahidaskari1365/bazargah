import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { aiChat } from '@/lib/ai'

/**
 * جستجوی هوشمند — تبدیل عبارت طبیعی به فیلترها
 * مثال: «سگ ژرمن تهران زیر ۳۰ میلیون» → { q: 'ژرمن', city: 'تهران', maxPrice: 30000000, categorySlug: 'pets' }
 */
export async function POST(req: Request) {
  try {
    const { query } = await req.json()
    if (!query || query.trim().length < 3) {
      return Response.json({ error: 'عبارت جستجو کوتاه است' }, { status: 400 })
    }

    const categories = await db.category.findMany({ select: { slug: true, name: true } })

    const { content } = await aiChat([
      {
        role: 'system',
        content: `تو موتور تبدیل جستجوی طبیعی «بازارگاه» هستی. عبارت فارسی کاربر را به فیلترهای JSON تبدیل کن.

فقط و فقط JSON خالص برگردان (بدون هیچ متن اضافه):
{
  "q": "کلمه کلیدی جستجو در عنوان/توضیح یا رشته خالی",
  "categorySlug": "یکی از این‌ها یا خالی: ${categories.map(c => c.slug).join('، ')}",
  "city": "نام شهر یا خالی",
  "minPrice": "عدد تومان یا خالی",
  "maxPrice": "عدد تومان یا خالی",
  "attributes": {"breed": "نژاد یا خالی", "gender": "نر|ماده|خالی", "ageMax": "حداکثر سن ماه یا خالی", "weightMin": "حداقل وزن یا خالی"}
}

نکات: «میلیون» یعنی 1000000 تومان. «زیر X» یعنی maxPrice=X. «بالای X» یعنی minPrice=X. نام جانور را به دسته درست نگاشت کن (سگ/گربه→pets، مرغ→poultry، گاو→live-animal، گوسفند/بز→sheep-goat، اسب→horse، یونجه/خوراک→feed). فقط JSON برگردان.`,
      },
      { role: 'user', content: query },
    ], 300)

    // استخراج JSON از پاسخ
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return Response.json({ filters: { q: query } })
    }
    const filters = JSON.parse(jsonMatch[0])

    // نرمال‌سازی
    const clean = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? null : v)
    const result = {
      q: clean(filters.q) || query,
      categorySlug: clean(filters.categorySlug),
      city: clean(filters.city),
      minPrice: clean(filters.minPrice) ? parseInt(filters.minPrice) : null,
      maxPrice: clean(filters.maxPrice) ? parseInt(filters.maxPrice) : null,
      attributes: filters.attributes || {},
    }

    return Response.json({ filters: result })
  } catch (e) {
    console.error('AI search error:', e)
    return Response.json({ filters: { q: '' } })
  }
}
