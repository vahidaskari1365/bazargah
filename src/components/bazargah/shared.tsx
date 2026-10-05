'use client'

import { ReactNode, useEffect, useState } from 'react'
import { ChevronRight, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useStore } from '@/lib/store'
import { api, faPrice, faNum } from '@/lib/api'
import { toast } from '@/hooks/use-toast'

/** هوک بررسی لاگین — اگر لاگین نبود به صفحه ورود هدایت می‌کند */
export function useRequireAuth() {
  const { token, navigate } = useStore()
  const [checked, setChecked] = useState(false)
  useEffect(() => {
    if (!token) {
      toast({ title: 'برای دسترسی به این بخش وارد حساب شوید' })
      navigate('auth')
    } else {
      setChecked(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])
  return checked
}

/** هدر صفحه با گرادیان سبز و پس‌زمینه تصویری */
export function PageHeader({
  title,
  subtitle,
  image,
  right,
  transparent,
}: {
  title?: string
  subtitle?: string
  image?: string
  right?: ReactNode
  transparent?: boolean
}) {
  return (
    <header
      className={`${transparent ? '' : 'hero-header'} sticky top-0 z-40 text-white`}
      style={image ? ({ '--bg-image': `url(${image})` } as React.CSSProperties) : undefined}
    >
      <div className="relative z-10 flex items-center gap-3 px-4 pt-[max(0.9rem,env(safe-area-inset-top))] pb-3">
        <button
          onClick={() => useStore.getState().back()}
          aria-label="بازگشت"
          className="shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          {title && <h1 className="text-lg font-bold truncate">{title}</h1>}
          {subtitle && <p className="text-xs text-green-100/80 truncate">{subtitle}</p>}
        </div>
        {right}
      </div>
    </header>
  )
}

/** شل کامل صفحه با پس‌زمینه تصویری */
export function PageShell({
  children,
  image = '/images/farm.jpg',
  className = '',
}: {
  children: ReactNode
  image?: string
  className?: string
}) {
  return (
    <div
      className={`page-bg ${className}`}
      style={{ '--bg-image': `url(${image})` } as React.CSSProperties}
    >
      {children}
    </div>
  )
}

/** کارت آگهی — مطابق طرح ضمیمه‌شده کاربر */
export function AdCard({
  ad,
  favorited,
  onOpen,
}: {
  ad: {
    id: string
    slug: string
    title: string
    price: number
    city: string
    images: string
    attributes: string
    views: number
    isFeatured?: boolean
    category?: { name: string }
  }
  favorited?: boolean
  onOpen: () => void
}) {
  const { token, navigate } = useStore()
  const [fav, setFav] = useState(!!favorited)
  const [busy, setBusy] = useState(false)
  const images = JSON.parse(ad.images || '[]') as string[]
  const attrs = (() => {
    try {
      return JSON.parse(ad.attributes || '{}')
    } catch {
      return {}
    }
  })()

  const toggleFav = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!token) {
      toast({ title: 'برای ذخیره در علاقه‌مندی‌ها وارد شوید' })
      navigate('auth')
      return
    }
    if (busy) return
    setBusy(true)
    try {
      const res = await api('/api/favorites', {
        method: 'POST',
        body: JSON.stringify({ adId: ad.id }),
      })
      setFav(res.favorited)
      toast({ title: res.favorited ? 'به علاقه‌مندی‌ها اضافه شد ❤️' : 'از علاقه‌مندی‌ها حذف شد' })
    } catch {
      toast({ title: 'خطا در ذخیره علاقه‌مندی', variant: 'destructive' })
    }
    setBusy(false)
  }

  const attrLine = [
    attrs.gender,
    attrs.age ? `${faNum(attrs.age)} ماهه` : null,
    attrs.weight ? `وزن تقریبی ${faNum(attrs.weight)} کیلو` : null,
  ].filter(Boolean).join(' • ')

  return (
    <div
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onOpen()}
      className="glass-card rounded-3xl p-4 flex gap-4 items-stretch cursor-pointer hover:shadow-xl transition-all animate-fade-up"
    >
      {/* متن */}
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-[15px] leading-snug text-green-950 dark:text-green-50 truncate">
            {ad.title}
          </h3>
          <button
            onClick={toggleFav}
            aria-label={fav ? 'حذف از علاقه‌مندی' : 'افزودن به علاقه‌مندی'}
            className="shrink-0 p-1"
          >
            <Heart className={`w-5 h-5 transition-colors ${fav ? 'fill-red-500 text-red-500' : 'text-green-700/60'}`} />
          </button>
        </div>
        {attrLine && <p className="text-[13px] text-gray-500 mt-1 truncate">{attrLine}</p>}
        <div className="flex items-center gap-1 text-[13px] text-gray-500 mt-1.5">
          <span className="text-green-700">📍</span>
          <span>{ad.city}</span>
          {ad.views > 0 && <span className="mr-2 text-gray-400">{faNum(ad.views)} بازدید</span>}
        </div>
        <div className="font-extrabold text-green-700 dark:text-green-400 mt-2 text-[15px]">
          {faPrice(ad.price)}
        </div>
        <Button
          className="mt-auto h-9 rounded-2xl bg-green-100 hover:bg-green-200 text-green-800 dark:bg-green-900/50 dark:text-green-200 dark:hover:bg-green-900 font-medium text-[13px] w-full mt-3"
          onClick={(e) => {
            e.stopPropagation()
            onOpen()
          }}
        >
          مشاهده جزئیات
        </Button>
      </div>

      {/* تصویر */}
      <div className="relative w-32 sm:w-40 shrink-0 rounded-2xl overflow-hidden bg-green-100">
        {images[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={images[0]} alt={ad.title} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">🐄</div>
        )}
        {images.length > 1 && (
          <span className="absolute bottom-2 right-2 bg-black/60 text-white text-[11px] px-2 py-0.5 rounded-full backdrop-blur-sm">
            📷 {faNum(images.length)} عکس
          </span>
        )}
        {ad.isFeatured && (
          <span className="absolute top-2 right-2 bg-amber-400 text-amber-950 text-[11px] font-bold px-2 py-0.5 rounded-full">
            ویژه
          </span>
        )}
      </div>
    </div>
  )
}

/** حالت خالی */
export function EmptyState({ icon, title, description, action }: { icon: string; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="text-6xl mb-4 opacity-70">{icon}</div>
      <h3 className="font-bold text-lg text-green-900 dark:text-green-100">{title}</h3>
      {description && <p className="text-sm text-gray-500 mt-2 max-w-xs leading-relaxed">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

/** کارت آماری */
export function StatCard({ icon, label, value, sub, color = 'bg-green-100 text-green-800' }: { icon: string; label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="glass-card rounded-2xl p-4 flex flex-col gap-1">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg ${color}`}>{icon}</div>
      <div className="text-lg font-extrabold text-green-950 dark:text-green-100 mt-1">{typeof value === 'number' ? faNum(value.toLocaleString('en-US')) : value}</div>
      <div className="text-xs text-gray-500">{label}</div>
      {sub && <div className="text-[11px] text-green-600 mt-0.5">{sub}</div>}
    </div>
  )
}

/** نمایش بارگذاری */
export function LoadingView({ text = 'در حال بارگذاری...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <div className="w-10 h-10 border-[3px] border-green-200 border-t-green-700 rounded-full animate-spin" />
      <p className="text-sm text-gray-500">{text}</p>
    </div>
  )
}
