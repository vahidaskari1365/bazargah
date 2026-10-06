'use client'

import { useEffect, useRef, useState } from 'react'
import { Search, Filter, Heart, MapPin, ArrowUpDown, X, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AdCard, EmptyState, LoadingView, PageHeader, PageShell } from '@/components/bazargah/shared'
import { useStore } from '@/lib/store'
import { api, faNum, CITIES } from '@/lib/api'
import { toast } from '@/hooks/use-toast'

interface Category { id: string; slug: string; name: string; icon: string }
interface Ad {
  id: string; slug: string; title: string; price: number; city: string; images: string
  attributes: string; views: number; isFeatured: boolean; category?: { name: string }
}

const CAT_ICONS: Record<string, string> = {
  'live-animal': '🐄', 'feed': '🌾', 'poultry': '🐔', 'equipment': '🚜',
  'vet': '🩺', 'stores': '🏪', 'sheep-goat': '🐑', 'pets': '🐕', 'horse': '🐎', 'calf': '🐮',
}

const MAX_PRICE = 900000000

/** صفحه جستجوی مستقل — جستجوی زنده با debounce + فیلتر دسته/شهر + مرتب‌سازی + جستجوی هوشمند AI */
export function SearchView() {
  const navigate = useStore(s => s.navigate)
  const [categories, setCategories] = useState<Category[]>([])
  const [ads, setAds] = useState<Ad[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [category, setCategory] = useState('')
  const [city, setCity] = useState('')
  const [minPrice, setMinPrice] = useState(0)
  const [maxPrice, setMaxPrice] = useState(MAX_PRICE)
  const [sort, setSort] = useState('NEWEST')
  const [smartSearching, setSmartSearching] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    api('/api/categories').then(res => setCategories(res.categories)).catch(() => {})
    // فوکوس خودکار نوار جستجو در دسکتاپ (در موبایل کیبورد ناگهانی آزاردهنده است)
    if (window.innerWidth >= 1024) inputRef.current?.focus()
  }, [])

  /** جستجوی زنده با debounce ۴۰۰ms — هر تغییر فیلتر یک fetch */
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      loadAds()
    }, 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, category, city, sort, minPrice, maxPrice])

  async function loadAds() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (q.trim()) params.set('q', q.trim())
      if (category) params.set('category', category)
      if (city) params.set('city', city)
      if (minPrice > 0) params.set('minPrice', String(minPrice))
      if (maxPrice < MAX_PRICE) params.set('maxPrice', String(maxPrice))
      if (sort !== 'NEWEST') params.set('sort', sort)
      const res = await api(`/api/ads?${params}`)
      setAds(res.ads)
      setTotal(res.total)
    } catch {
      toast({ title: 'خطا در جستجو', variant: 'destructive' })
    }
    setLoading(false)
  }

  /** جستجوی هوشمند AI — «سگ ژرمن تهران زیر ۳۰ میلیون» */
  async function smartSearch() {
    if (!q.trim()) {
      inputRef.current?.focus()
      return
    }
    setSmartSearching(true)
    try {
      const res = await api('/api/ai/search', { method: 'POST', body: JSON.stringify({ query: q }) })
      const f = res.filters || {}
      const cat = f.categorySlug ? categories.find(c => c.slug === f.categorySlug) : null
      const nextQ = f.q || ''
      const nextCity = f.city || ''
      const nextCat = cat?.id || ''
      const nextMin = f.minPrice ? Number(f.minPrice) : 0
      const nextMax = f.maxPrice ? Number(f.maxPrice) : MAX_PRICE
      setQ(nextQ)
      setCity(nextCity)
      setCategory(nextCat)
      setMinPrice(nextMin)
      setMaxPrice(nextMax)
      // effect فوق با تغییر state خودش fetch می‌کند
    } catch {
      toast({ title: 'جستجوی هوشمند موقتاً در دسترس نیست', variant: 'destructive' })
    }
    setSmartSearching(false)
  }

  const activeFilters = (category ? 1 : 0) + (city ? 1 : 0) + (minPrice > 0 ? 1 : 0) + (maxPrice < MAX_PRICE ? 1 : 0)

  return (
    <PageShell image="/images/farm.jpg">
      <PageHeader title="جستجوی آگهی‌ها" subtitle="جستجو در همه آگهی‌های بازارگاه" />

      <div className="max-w-3xl lg:max-w-6xl mx-auto px-4 lg:px-8 pb-28 lg:pb-12 -mt-2">
        {/* نوار جستجو */}
        <div className="flex gap-2 items-center bg-white dark:bg-gray-900 rounded-full p-1.5 shadow-lg ring-1 ring-green-100 dark:ring-gray-800">
          <div className="flex-1 flex items-center gap-2 px-3">
            <Search className="w-4 h-4 text-green-700 shrink-0" />
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && smartSearch()}
              placeholder="جستجو: گاو هلشتاین، گوساله پرواری، یونجه..."
              className="flex-1 bg-transparent text-sm text-gray-800 dark:text-gray-100 placeholder:text-gray-400 outline-none py-2"
              aria-label="جستجوی آگهی"
            />
            {q && (
              <button onClick={() => setQ('')} aria-label="پاک کردن جستجو" className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <Button
            size="sm"
            onClick={smartSearch}
            disabled={smartSearching}
            className="rounded-full h-9 px-4 bg-green-700 hover:bg-green-800 text-[13px] font-bold shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {smartSearching ? '...' : 'هوشمند'}
          </Button>
        </div>

        {/* فیلترها */}
        <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar items-center">
          <Select value={category || 'all'} onValueChange={(v) => setCategory(v === 'all' ? '' : v)}>
            <SelectTrigger className="rounded-full bg-white/80 dark:bg-gray-900/70 h-9 w-auto text-[13px] shrink-0 gap-1.5">
              <Filter className="w-3.5 h-3.5" />
              <SelectValue placeholder="همه دسته‌ها" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">همه دسته‌ها</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>{CAT_ICONS[c.slug] || '📋'} {c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={city || 'all'} onValueChange={(v) => setCity(v === 'all' ? '' : v)}>
            <SelectTrigger className="rounded-full bg-white/80 dark:bg-gray-900/70 h-9 w-auto text-[13px] shrink-0 gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              <SelectValue placeholder="همه شهرها" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">همه شهرها</SelectItem>
              {Object.values(CITIES).flat().map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="rounded-full bg-white/80 dark:bg-gray-900/70 h-9 w-auto text-[13px] shrink-0 gap-1.5">
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

          {activeFilters > 0 && (
            <button
              onClick={() => { setCategory(''); setCity(''); setMinPrice(0); setMaxPrice(MAX_PRICE) }}
              className="flex items-center gap-1 rounded-full h-9 px-3 text-[12px] font-medium text-red-600 bg-red-50 dark:bg-red-900/20 shrink-0"
            >
              <X className="w-3.5 h-3.5" />
              حذف فیلترها
            </button>
          )}
        </div>

        {/* چیپ‌های قیمت فعال (از جستجوی هوشمند) */}
        {(minPrice > 0 || maxPrice < MAX_PRICE) && (
          <div className="flex gap-2 mt-2 flex-wrap">
            {minPrice > 0 && (
              <span className="flex items-center gap-1.5 bg-green-50 dark:bg-green-900/30 text-green-900 dark:text-green-100 rounded-full pl-2 pr-3 py-1.5 text-[12px] font-medium">
                حداقل قیمت: {faNum(minPrice.toLocaleString('en-US'))} تومان
                <button onClick={() => setMinPrice(0)} aria-label="حذف حداقل قیمت" className="text-red-500 hover:text-red-700">
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}
            {maxPrice < MAX_PRICE && (
              <span className="flex items-center gap-1.5 bg-green-50 dark:bg-green-900/30 text-green-900 dark:text-green-100 rounded-full pl-2 pr-3 py-1.5 text-[12px] font-medium">
                حداکثر قیمت: {faNum(maxPrice.toLocaleString('en-US'))} تومان
                <button onClick={() => setMaxPrice(MAX_PRICE)} aria-label="حذف حداکثر قیمت" className="text-red-500 hover:text-red-700">
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}
          </div>
        )}

        {/* شمار نتایج */}
        {!loading && (
          <div className="text-[12px] text-gray-500 mt-3 px-1">
            {q.trim() ? `نتیجه جستجوی «${q.trim()}»: ` : ''}
            {faNum(String(total))} آگهی یافت شد
          </div>
        )}

        {/* نتایج */}
        <div className="mt-2">
          {loading ? (
            <LoadingView text="در حال جستجو..." />
          ) : ads.length === 0 ? (
            <EmptyState
              icon="🔍"
              title="آگهی‌ای یافت نشد"
              description={q ? `برای «${q}» نتیجه‌ای نبود — عبارت کوتاه‌تری امتحان کنید` : 'فیلترها را تغییر دهید یا جستجوی جدیدی امتحان کنید'}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-1">
              {ads.map((ad) => (
                <AdCard key={ad.id} ad={ad} onOpen={() => navigate('ad-detail', { id: ad.id })} />
              ))}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  )
}
