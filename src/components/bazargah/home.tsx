'use client'

import { useEffect, useState } from 'react'
import { Search, Filter, Heart, MapPin, ArrowUpDown, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { PageShell, AdCard, EmptyState, LoadingView } from '@/components/bazargah/shared'
import { useStore } from '@/lib/store'
import { api, faNum, safeParseImages, CITIES } from '@/lib/api'
import { toast } from '@/hooks/use-toast'

interface Category { id: string; slug: string; name: string; icon: string; image?: string }
interface Ad {
  id: string; slug: string; title: string; price: number; city: string; images: string
  attributes: string; views: number; isFeatured: boolean; category?: { name: string }
}

const CAT_ICONS: Record<string, string> = {
  'live-animal': '🐄', 'feed': '🌾', 'poultry': '🐔', 'equipment': '🚜',
  'vet': '🩺', 'stores': '🏪', 'sheep-goat': '🐑', 'pets': '🐕', 'horse': '🐎', 'calf': '🐮',
}

export function HomeView() {
  const { user, navigate, token } = useStore()
  const [categories, setCategories] = useState<Category[]>([])
  const [ads, setAds] = useState<Ad[]>([])
  const [featured, setFeatured] = useState<Ad[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [city, setCity] = useState('')
  const [category, setCategory] = useState('')
  const [minPrice, setMinPrice] = useState(0)
  const [maxPrice, setMaxPrice] = useState(900000000)
  const [sort, setSort] = useState('NEWEST')
  const [smartSearching, setSmartSearching] = useState(false)

  useEffect(() => {
    load()
    loadAds()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function load() {
    try {
      const cats = await api('/api/categories')
      setCategories(cats.categories)
    } catch { /* ignore */ }
  }

  /** بارگذاری آگهی‌ها با امکان override — بدون وابستگی به state تازه (رفع باگ رقابتی جستجوی هوشمند) */
  async function loadAds(o?: { category?: string; city?: string; minPrice?: number; maxPrice?: number; sort?: string; q?: string }) {
    const category_ = o?.category ?? category
    const city_ = o?.city ?? city
    const minPrice_ = o?.minPrice ?? minPrice
    const maxPrice_ = o?.maxPrice ?? maxPrice
    const sort_ = o?.sort ?? sort
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (o?.q) params.set('q', o.q)
      if (category_) params.set('category', category_)
      if (city_) params.set('city', city_)
      if (minPrice_ > 0) params.set('minPrice', String(minPrice_))
      if (maxPrice_ < 900000000) params.set('maxPrice', String(maxPrice_))
      if (sort_ !== 'NEWEST') params.set('sort', sort_)
      const res = await api(`/api/ads?${params}`)
      setAds(res.ads)
      setFeatured(res.ads.filter((a: Ad) => a.isFeatured).slice(0, 4))
    } catch {
      toast({ title: 'خطا در دریافت آگهی‌ها', variant: 'destructive' })
    }
    setLoading(false)
  }

  /** جستجوی هوشمند با AI — «سگ ژرمن تهران زیر ۳۰ میلیون» */
  async function smartSearch() {
    if (!query.trim()) return loadAds()
    setSmartSearching(true)
    try {
      const res = await api('/api/ai/search', {
        method: 'POST',
        body: JSON.stringify({ query }),
      })
      const f = res.filters || {}
      const cat = f.categorySlug ? categories.find(c => c.slug === f.categorySlug) : null
      const next = {
        q: f.q || '',
        city: f.city || '',
        category: cat?.id || '',
        minPrice: f.minPrice ? Number(f.minPrice) : 0,
        maxPrice: f.maxPrice ? Number(f.maxPrice) : 900000000,
        sort: 'NEWEST' as const,
      }
      setCity(next.city)
      setCategory(next.category)
      setMinPrice(next.minPrice)
      setMaxPrice(next.maxPrice)
      setSort('NEWEST')
      // فقط یک fetch — بدون مسابقه با effect (state فقط برای همگام‌سازی UI به‌روز می‌شود)
      await loadAds(next)
      toast({ title: 'فیلترهای هوشمند اعمال شد ✨' })
    } catch {
      toast({ title: 'جستجوی هوشمند موقتاً در دسترس نیست', variant: 'destructive' })
    }
    setSmartSearching(false)
  }

  const shortcuts = [
    { icon: '🐄', label: 'خرید حیوان', cat: 'live-animal' },
    { icon: '🌾', label: 'خرید خوراک', cat: 'feed' },
    { icon: '🩺', label: 'دامپزشک', view: 'vets' as const },
    { icon: '🤖', label: 'AI دامپزشک', view: 'ai-vet' as const },
    { icon: '🏪', label: 'فروشگاه‌ها', view: 'stores' as const },
    { icon: '🐾', label: 'حیوانات من', view: 'animals' as const },
    { icon: '🧠', label: 'تغذیه هوشمند', view: 'nutrition' as const },
    { icon: '💬', label: 'گفتگوها', view: 'chat' as const },
  ]

  return (
    <PageShell image="/images/farm.jpg">
      {/* هدر جستجو */}
      <div className="hero-header text-white px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-8 rounded-b-[2rem]">
        <div className="relative z-10 max-w-3xl lg:max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4 lg:hidden">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🌿</span>
              <div>
                <div className="font-extrabold text-lg leading-tight">بازارگاه</div>
                <div className="text-[11px] text-green-200/90">دنیای دام در دستان شما</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {user ? (
                <button onClick={() => navigate('profile')} className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center text-lg" aria-label="پروفایل">
                  {user.firstName?.[0] || '👤'}
                </button>
              ) : (
                <Button size="sm" onClick={() => navigate('auth')} className="rounded-full bg-white text-green-800 hover:bg-green-50 h-9 px-4 text-[13px] font-bold">
                  ورود
                </Button>
              )}
            </div>
          </div>

          {/* جستجوی هوشمند */}
          <div className="flex gap-2 items-center bg-white rounded-full p-1.5 shadow-lg">
            <div className="flex-1 flex items-center gap-2 px-3">
              <Search className="w-4 h-4 text-green-700 shrink-0" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && smartSearch()}
                placeholder="جستجوی هوشمند: گاو هلشتاین تهران زیر ۳۰۰ میلیون"
                className="flex-1 bg-transparent text-sm text-gray-800 placeholder:text-gray-400 outline-none"
                aria-label="جستجو"
              />
            </div>
            <Button
              size="sm"
              onClick={smartSearch}
              disabled={smartSearching}
              className="rounded-full h-9 px-4 bg-green-700 hover:bg-green-800 text-[13px] font-bold"
            >
              {smartSearching ? '...' : 'جستجو ✨'}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl lg:max-w-6xl mx-auto px-4 lg:px-8 -mt-4 pb-28 lg:pb-12">
        {/* میانبرها */}
        <div className="glass-card rounded-3xl p-3 mb-4 animate-fade-up">
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-1">
            {shortcuts.map((s) => (
              <button
                key={s.label}
                onClick={() => {
                  if (s.view) navigate(s.view)
                  else if (s.cat) {
                    const cat = categories.find(c => c.slug === s.cat)
                    setCategory(cat?.id || '')
                    loadAds({ category: cat?.id || '' })
                  }
                }}
                className="cat-chip flex flex-col items-center gap-1.5 py-3 rounded-2xl hover:bg-green-50"
              >
                <span className="text-2xl">{s.icon}</span>
                <span className="text-[11px] font-medium text-gray-700 dark:text-gray-200">{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* دسته‌بندی‌ها */}
        <div className="glass-card rounded-3xl p-4 mb-4 animate-fade-up">
          <h2 className="font-bold text-green-950 dark:text-green-100 mb-3 text-sm">دسته‌بندی‌ها</h2>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            <button
              onClick={() => { setCategory(''); loadAds({ category: '' }) }}
              className={`cat-chip shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-[13px] font-medium ${!category ? 'bg-green-800 text-white shadow-md' : 'bg-green-50 text-green-900 dark:bg-green-900/40 dark:text-green-100'}`}
            >
              همه
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => { setCategory(c.id); loadAds({ category: c.id }) }}
                className={`cat-chip shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-[13px] font-medium ${category === c.id ? 'bg-green-800 text-white shadow-md' : 'bg-green-50 text-green-900 dark:bg-green-900/40 dark:text-green-100'}`}
              >
                <span>{CAT_ICONS[c.slug] || '📋'}</span>
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* اسلایدر آگهی‌های ویژه */}
        {featured.length > 0 && (
          <div className="mb-4 animate-fade-up">
            <div className="flex items-center justify-between mb-2 px-1">
              <h2 className="font-bold text-green-950 dark:text-green-100 text-sm">⭐ آگهی‌های ویژه</h2>
            </div>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
              {featured.map((ad) => (
                <div
                  key={ad.id}
                  onClick={() => navigate('ad-detail', { id: ad.id })}
                  className="shrink-0 w-56 rounded-3xl overflow-hidden glass-card cursor-pointer hover:shadow-xl transition-shadow"
                >
                  <div className="relative h-32">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={safeParseImages(ad.images)[0] || '/images/cow.jpg'} alt={ad.title} className="w-full h-full object-cover" />
                    <span className="absolute top-2 right-2 bg-amber-400 text-amber-950 text-[10px] font-bold px-2 py-0.5 rounded-full">ویژه</span>
                  </div>
                  <div className="p-3">
                    <div className="font-bold text-[13px] text-green-950 dark:text-green-100 truncate">{ad.title}</div>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[12px] text-gray-500">{ad.city}</span>
                      <span className="font-extrabold text-[13px] text-green-700 dark:text-green-400">
                        {faNum(ad.price.toLocaleString('en-US'))}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* فیلترها */}
        <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="rounded-full bg-white/80 dark:bg-gray-900/70 h-9 text-[13px] gap-1.5 shrink-0">
                <Filter className="w-3.5 h-3.5" />
                فیلترها
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="max-h-[75vh] overflow-y-auto rounded-t-3xl">
              <SheetHeader>
                <SheetTitle className="text-right">فیلتر پیشرفته</SheetTitle>
              </SheetHeader>
              <div className="space-y-5 pb-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">شهر</label>
                  <Select value={city || 'all'} onValueChange={(v) => { const c = v === 'all' ? '' : v; setCity(c); loadAds({ city: c }) }}>
                    <SelectTrigger><SelectValue placeholder="همه شهرها" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">همه شهرها</SelectItem>
                      {Object.values(CITIES).flat().map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    حداکثر قیمت: {maxPrice >= 900000000 ? 'نامحدود' : `${faNum(maxPrice.toLocaleString('en-US'))} تومان`}
                  </label>
                  <Slider
                    value={[maxPrice]}
                    onValueChange={([v]) => setMaxPrice(v)}
                    max={900000000}
                    min={1000000}
                    step={1000000}
                  />
                </div>
                {minPrice > 0 && (
                  <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/30 rounded-xl px-3 py-2">
                    <span className="text-[13px] text-green-900 dark:text-green-100">حداقل قیمت: {faNum(minPrice.toLocaleString('en-US'))} تومان</span>
                    <button
                      onClick={() => { setMinPrice(0); loadAds({ minPrice: 0 }) }}
                      className="flex items-center gap-1 text-[12px] text-red-600 font-medium"
                    >
                      <X className="w-3.5 h-3.5" /> حذف
                    </button>
                  </div>
                )}
                <Button onClick={() => { loadAds(); }} className="w-full rounded-2xl bg-green-700 hover:bg-green-800">
                  اعمال فیلتر
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          <Select value={sort} onValueChange={(v) => { setSort(v); loadAds({ sort: v }) }}>
            <SelectTrigger className="rounded-full bg-white/80 dark:bg-gray-900/70 h-9 w-[130px] text-[13px] shrink-0">
              <ArrowUpDown className="w-3.5 h-3.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NEWEST">جدیدترین</SelectItem>
              <SelectItem value="CHEAPEST">ارزان‌ترین</SelectItem>
              <SelectItem value="EXPENSIVE">گران‌ترین</SelectItem>
              <SelectItem value="POPULAR">پربازدیدترین</SelectItem>
            </SelectContent>
          </Select>

          <button
            onClick={() => navigate('favorites')}
            className="flex items-center gap-1.5 rounded-full bg-white/80 dark:bg-gray-900/70 h-9 px-4 text-[13px] shrink-0 border border-input"
          >
            <Heart className="w-3.5 h-3.5" />
            علاقه‌مندی‌ها
          </button>
        </div>

        {/* لیست آگهی‌ها */}
        {loading ? (
          <LoadingView text="در حال دریافت آگهی‌ها..." />
        ) : ads.length === 0 ? (
          <EmptyState
            icon="🔍"
            title="آگهی‌ای یافت نشد"
            description="فیلترها را تغییر دهید یا جستجوی جدیدی امتحان کنید"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {ads.map((ad) => (
              <AdCard key={ad.id} ad={ad} onOpen={() => navigate('ad-detail', { id: ad.id })} />
            ))}
          </div>
        )}
      </div>
    </PageShell>
  )
}
