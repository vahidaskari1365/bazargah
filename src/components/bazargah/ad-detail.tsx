'use client'

import { useEffect, useState } from 'react'
import { Heart, Share2, Flag, Phone, MessageCircle, MapPin, Eye, BadgeCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader, PageShell, LoadingView, AdCard } from '@/components/bazargah/shared'
import { useStore } from '@/lib/store'
import { api, faPrice, faNum, faDate } from '@/lib/api'
import { toast } from '@/hooks/use-toast'

export function AdDetailView({ id }: { id: string }) {
  const { token, navigate, user } = useStore()
  const [ad, setAd] = useState<Record<string, unknown> | null>(null)
  const [similar, setSimilar] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [images, setImages] = useState<string[]>([])
  const [activeImg, setActiveImg] = useState(0)
  const [fav, setFav] = useState(false)
  const [attrs, setAttrs] = useState<Record<string, unknown>>({})

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function load() {
    setLoading(true)
    try {
      const res = await api(`/api/ads/${id}`)
      setAd(res.ad)
      setSimilar(res.similar || [])
      setImages(JSON.parse((res.ad as Record<string, string>).images || '[]'))
      setAttrs(JSON.parse((res.ad as Record<string, string>).attributes || '{}'))
      if (token) {
        const favRes = await api('/api/favorites')
        setFav(favRes.adIds?.includes(id) || false)
      }
    } catch (e) {
      toast({ title: 'آگهی یافت نشد', variant: 'destructive' })
    }
    setLoading(false)
  }

  async function toggleFav() {
    if (!token) { navigate('auth'); return }
    const res = await api('/api/favorites', { method: 'POST', body: JSON.stringify({ adId: id }) })
    setFav(res.favorited)
    toast({ title: res.favorited ? 'به علاقه‌مندی‌ها اضافه شد' : 'حذف شد' })
  }

  async function startChat() {
    if (!token) { navigate('auth'); return }
    if (user?.id === (ad as Record<string, { id: string }>).userId) {
      toast({ title: 'این آگهی متعلق به خودتان است' })
      return
    }
    try {
      const res = await api('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ sellerId: (ad as Record<string, unknown>).userId, adId: id }),
      })
      navigate('chat-detail', { id: res.conversation.id })
    } catch (e) {
      toast({ title: (e as Error).message, variant: 'destructive' })
    }
  }

  function share() {
    const url = `${window.location.origin}/?ad=${id}`
    if (navigator.share) {
      navigator.share({ title: String(ad?.title), url }).catch(() => {})
    } else {
      navigator.clipboard.writeText(url)
      toast({ title: 'لینک آگهی کپی شد' })
    }
  }

  if (loading) return <PageShell><LoadingView /></PageShell>
  if (!ad) return <PageShell><div className="pt-20 text-center">آگهی یافت نشد</div></PageShell>

  const seller = ad.user as Record<string, string> | undefined
  const category = ad.category as Record<string, string> | undefined

  return (
    <PageShell image="/images/farm.jpg">
      <PageHeader title={String(ad.title)} subtitle={category?.name} />

      <div className="max-w-3xl mx-auto px-4 pb-28">
        {/* گالری */}
        <div className="glass-card rounded-3xl overflow-hidden mt-4 animate-fade-up">
          <div className="relative h-64 sm:h-80 bg-green-100">
            {images[activeImg] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={images[activeImg]} alt={String(ad.title)} className="w-full h-full object-cover" />
            )}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setActiveImg(i => (i + 1) % images.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 text-white flex items-center justify-center"
                  aria-label="تصویر بعدی"
                >‹</button>
                <button
                  onClick={() => setActiveImg(i => (i - 1 + images.length) % images.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 text-white flex items-center justify-center"
                  aria-label="تصویر قبلی"
                >›</button>
              </>
            )}
            {images.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`w-2 h-2 rounded-full transition-colors ${i === activeImg ? 'bg-white' : 'bg-white/50'}`}
                    aria-label={`تصویر ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* اطلاعات اصلی */}
        <div className="glass-card rounded-3xl p-5 mt-4 animate-fade-up">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-extrabold text-green-950 dark:text-green-100">{String(ad.title)}</h2>
              <div className="flex items-center gap-3 mt-2 text-[13px] text-gray-500">
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4 text-green-600" />{String(ad.city)}، {String(ad.province)}</span>
                <span className="flex items-center gap-1"><Eye className="w-4 h-4" />{faNum(Number(ad.views))} بازدید</span>
              </div>
            </div>
            <div className="text-left">
              <div className="text-xl font-extrabold text-green-700 dark:text-green-400">{faPrice(Number(ad.price))}</div>
              {(ad as Record<string, boolean>).negotiable && <span className="text-[11px] text-amber-600">قابل مذاکره</span>}
            </div>
          </div>

          {/* ویژگی‌ها */}
          {Object.keys(attrs).length > 0 && (
            <>
              <div className="divider-line my-4" />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(attrs)
                  .filter(([k]) => k !== 'تعداد عکس')
                  .map(([k, v]) => (
                    <div key={k} className="bg-green-50 dark:bg-green-900/30 rounded-xl px-3 py-2">
                      <div className="text-[11px] text-gray-500">{k}</div>
                      <div className="text-[13px] font-bold text-green-900 dark:text-green-100">{String(v)}</div>
                    </div>
                  ))}
              </div>
            </>
          )}

          <div className="divider-line my-4" />
          <h3 className="font-bold text-sm mb-2 text-green-950 dark:text-green-100">توضیحات</h3>
          <p className="text-[14px] text-gray-600 dark:text-gray-300 leading-7 whitespace-pre-wrap">{String(ad.description)}</p>

          {/* اکشن‌ها */}
          <div className="grid grid-cols-4 gap-2 mt-5">
            <Button onClick={startChat} className="col-span-2 h-11 rounded-2xl bg-green-700 hover:bg-green-800 gap-2 font-bold">
              <MessageCircle className="w-4 h-4" />
              چت با فروشنده
            </Button>
            <Button
              variant="outline"
              className="h-11 rounded-2xl gap-1.5 bg-white/80"
              onClick={() => toast({ title: `تماس: ${seller?.phone || 'پس از ورود نمایش داده می‌شود'}` })}
            >
              <Phone className="w-4 h-4" />
              تماس
            </Button>
            <Button variant="outline" className="h-11 rounded-2xl bg-white/80 gap-1.5" onClick={share}>
              <Share2 className="w-4 h-4" />
              اشتراک
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <Button variant="outline" className="h-10 rounded-2xl bg-white/80 gap-1.5 text-[13px]" onClick={toggleFav}>
              <Heart className={`w-4 h-4 ${fav ? 'fill-red-500 text-red-500' : ''}`} />
              {fav ? 'ذخیره شد' : 'علاقه‌مندی'}
            </Button>
            <Button
              variant="outline"
              className="h-10 rounded-2xl bg-white/80 gap-1.5 text-[13px]"
              onClick={() => toast({ title: 'گزارش شما ثبت شد', description: 'کارشناسان ما بررسی می‌کنند' })}
            >
              <Flag className="w-4 h-4" />
              گزارش تخلف
            </Button>
          </div>
        </div>

        {/* فروشنده */}
        {seller && (
          <div className="glass-card rounded-3xl p-5 mt-4 flex items-center gap-4 animate-fade-up">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-green-700 text-white flex items-center justify-center text-xl font-bold">
              {(seller.firstName || '؟')[0]}
            </div>
            <div className="flex-1">
              <div className="font-bold flex items-center gap-1.5">
                {seller.firstName} {seller.lastName}
                {seller.isVerified && <BadgeCheck className="w-4 h-4 text-blue-500" />}
              </div>
              <div className="text-[12px] text-gray-500 mt-0.5">عضویت از {faDate(seller.createdAt as string)}</div>
            </div>
            <Button variant="outline" size="sm" className="rounded-xl bg-white/80" onClick={() => toast({ title: 'پروفایل فروشنده' })}>
              مشاهده
            </Button>
          </div>
        )}

        {/* مشابه‌ها */}
        {similar.length > 0 && (
          <div className="mt-6">
            <h3 className="font-bold text-green-950 dark:text-green-100 mb-3 px-1">آگهی‌های مشابه</h3>
            <div className="space-y-3">
              {similar.slice(0, 2).map((s) => (
                <AdCard key={String(s.id)} ad={s as never} onOpen={() => navigate('ad-detail', { id: String(s.id) })} />
              ))}
            </div>
          </div>
        )}
      </div>
    </PageShell>
  )
}
