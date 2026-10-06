'use client'

import { useEffect, useState, useCallback } from 'react'
import { LogOut, Wallet as WalletIcon, Crown, Bell, Heart, FileText, Sprout, Receipt, Sparkles, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PageHeader, PageShell, LoadingView, EmptyState, useRequireAuth, AdCard, StatCard } from '@/components/bazargah/shared'
import { useStore } from '@/lib/store'
import { api, faNum, faPrice, faDate, GOALS, ENVIRONMENTS, SPECIES_FA } from '@/lib/api'
import { toast } from '@/hooks/use-toast'

/** پروفایل کاربر — منوی کامل */
export function ProfileView() {
  const { user, logout, navigate, updateUser } = useStore()
  const [notifications, setNotifications] = useState(0)

  useEffect(() => {
    api('/api/notifications').then(res => setNotifications(res.unread)).catch(() => {})
  }, [])

  // بروزرسانی پروفایل از سرور (نقش‌ها، پلن و موجودی همیشه تازه باشد)
  useEffect(() => {
    api('/api/auth/me').then(res => updateUser(res.user)).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!user) {
    return (
      <PageShell image="/images/farm.jpg">
        <PageHeader title="پروفایل" />
        <EmptyState
          icon="👤"
          title="وارد حساب کاربری شوید"
          description="برای استفاده از همه امکانات بازارگاه وارد شوید یا ثبت‌نام کنید"
          action={<Button onClick={() => navigate('auth')} className="rounded-2xl bg-green-700 hover:bg-green-800 font-bold">ورود / ثبت‌نام</Button>}
        />
      </PageShell>
    )
  }

  const roles = user.roleList || []
  const roleFa: Record<string, string> = {
    BUYER: 'خریدار', ANIMAL_SELLER: 'فروشنده حیوانات', FOOD_SELLER: 'فروشنده خوراک و محصولات', VET: 'دامپزشک', ADMIN: 'مدیر سیستم',
  }
  const planFa: Record<string, string> = { FREE: 'رایگان', PRO: 'حرفه‌ای', SELLER: 'فروشنده', FARM: 'مزرعه' }

  const menu = [
    { icon: <WalletIcon className="w-5 h-5" />, label: 'کیف پول', value: faPrice(user.walletBalance), view: 'wallet' as const },
    { icon: <Crown className="w-5 h-5" />, label: 'اشتراک', value: planFa[user.planKey] || user.planKey, view: 'subscription' as const },
    { icon: <Bell className="w-5 h-5" />, label: 'اعلان‌ها', value: notifications > 0 ? `${faNum(notifications)} جدید` : '', view: 'notifications' as const, badge: notifications },
    { icon: <Heart className="w-5 h-5" />, label: 'علاقه‌مندی‌ها', value: '', view: 'favorites' as const },
    { icon: <FileText className="w-5 h-5" />, label: 'آگهی‌های من', value: '', view: 'my-ads' as const },
    { icon: <Sprout className="w-5 h-5" />, label: 'مدیریت گله', value: '', view: 'herds' as const },
    { icon: <Receipt className="w-5 h-5" />, label: 'هزینه و سودآوری', value: '', view: 'expenses' as const },
    { icon: <Sparkles className="w-5 h-5" />, label: 'تغذیه هوشمند', value: '', view: 'nutrition' as const },
  ]

  return (
    <PageShell image="/images/farm.jpg">
      <PageHeader title="پروفایل" />

      <div className="max-w-lg lg:max-w-3xl mx-auto px-4 pb-28 lg:pb-12">
        {/* کارت کاربر */}
        <div className="glass-card rounded-3xl p-5 mt-4 animate-fade-up">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-green-500 to-green-800 text-white flex items-center justify-center text-2xl font-extrabold">
              {user.firstName?.[0] || '👤'}
            </div>
            <div className="flex-1">
              <div className="font-extrabold text-lg">{user.firstName} {user.lastName}</div>
              <div dir="ltr" className="text-[12px] text-gray-400 text-right">{user.phone}</div>
              <div className="flex gap-1.5 mt-1.5 flex-wrap">
                {roles.map((r) => (
                  <span key={r} className="text-[10px] bg-green-100 text-green-700 rounded-full px-2.5 py-0.5">{roleFa[r] || r}</span>
                ))}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl">🏅</div>
              <div className="text-[11px] font-bold text-amber-600">{faNum(user.loyaltyPoints)}</div>
              <div className="text-[9px] text-gray-400">امتیاز وفاداری</div>
            </div>
          </div>
          {user.referralCode && (
            <button
              onClick={() => { navigator.clipboard.writeText(user.referralCode); toast({ title: 'کد معرف کپی شد' }) }}
              className="mt-4 w-full bg-green-50 dark:bg-green-900/30 rounded-2xl py-2.5 text-[12px] text-green-800 dark:text-green-200 hover:bg-green-100 transition-colors"
            >
              🎁 کد معرف شما: <b className="font-mono">{user.referralCode}</b> (برای کپی بزنید)
            </button>
          )}
        </div>

        {/* منو */}
        <div className="glass-card rounded-3xl p-2 mt-4 animate-fade-up overflow-hidden">
          {menu.map((m, i) => (
            <button
              key={m.label}
              onClick={() => (m.view === 'my-ads' ? navigate('my-ads') : navigate(m.view))}
              className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors ${i < menu.length - 1 ? 'border-b border-green-100/60 dark:border-gray-800' : ''}`}
            >
              <span className="text-green-700 dark:text-green-400">{m.icon}</span>
              <span className="flex-1 text-right text-[14px] font-medium">{m.label}</span>
              {m.value && <span className="text-[12px] text-gray-400">{m.value}</span>}
              <span className="text-gray-300">‹</span>
            </button>
          ))}
        </div>

        {/* ادمین */}
        {roles.includes('ADMIN') && (
          <Button onClick={() => navigate('admin')} className="w-full h-12 rounded-2xl bg-green-800 hover:bg-green-900 mt-4 font-bold gap-2">
            ⚙️ پنل مدیریت بازارگاه
          </Button>
        )}

        <Button onClick={logout} variant="outline" className="w-full h-12 rounded-2xl mt-4 text-red-600 border-red-200 hover:bg-red-50 gap-2 bg-white/80">
          <LogOut className="w-4 h-4" /> خروج از حساب
        </Button>
      </div>
    </PageShell>
  )
}

/** کیف پول */
export function WalletView() {
  const checked = useRequireAuth()
  const updateUser = useStore(s => s.updateUser)
  const [balance, setBalance] = useState(0)
  const [transactions, setTransactions] = useState<{ id: string; amount: number; type: string; description: string; createdAt: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [chargeOpen, setChargeOpen] = useState(false)
  const [amount, setAmount] = useState('')

  const load = useCallback(async () => {
    try {
      const res = await api('/api/wallet')
      setBalance(res.balance)
      setTransactions(res.transactions)
      updateUser({ walletBalance: res.balance })
    } catch { /* */ }
  }, [updateUser])

  useEffect(() => {
    if (!checked) return
    setLoading(true)
    load().finally(() => setLoading(false))
  }, [checked, load])

  async function charge() {
    try {
      const res = await api('/api/wallet', { method: 'POST', body: JSON.stringify({ amount: amount.replace(/[^\d]/g, '') }) })
      toast({ title: 'کیف پول شارژ شد ✅', description: `موجودی جدید: ${faNum(res.balance.toLocaleString('en-US'))} تومان` })
      setChargeOpen(false)
      setAmount('')
      await load()
    } catch (e) {
      toast({ title: (e as Error).message, variant: 'destructive' })
    }
  }

  if (!checked) return <PageShell image="/images/farm.jpg" />

  const typeFa: Record<string, string> = { CHARGE: 'شارژ', PAYMENT: 'پرداخت', REFUND: 'بازگشت', GIFT: 'هدیه', PAYOUT: 'برداشت' }

  return (
    <PageShell image="/images/farm.jpg">
      <PageHeader title="کیف پول" />
      <div className="max-w-lg lg:max-w-3xl mx-auto px-4 pb-28 lg:pb-12">
        <div className="hero-header rounded-3xl p-6 mt-4 text-white text-center animate-fade-up">
          <div className="relative z-10">
            <div className="text-[12px] text-green-200/80">موجودی فعلی</div>
            <div className="text-3xl font-extrabold mt-1.5">{faNum(balance.toLocaleString('en-US'))}</div>
            <div className="text-[12px] text-green-200/80 mt-1">تومان</div>
            <Button onClick={() => setChargeOpen(true)} className="mt-4 rounded-2xl bg-white text-green-800 hover:bg-green-50 font-bold gap-2 h-10">
              <Plus className="w-4 h-4" /> شارژ کیف پول
            </Button>
          </div>
        </div>

        <h3 className="font-bold mt-6 mb-3 px-1">تراکنش‌های اخیر</h3>
        {transactions.length === 0 ? (
          <EmptyState icon="💳" title="تراکنشی ثبت نشده" />
        ) : (
          <div className="space-y-2">
            {transactions.map((t) => (
              <div key={t.id} className="glass-card rounded-2xl p-3.5 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg ${t.amount > 0 ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-500'}`}>
                  {t.amount > 0 ? '＋' : '−'}
                </div>
                <div className="flex-1">
                  <div className="text-[13px] font-bold">{t.description || typeFa[t.type]}</div>
                  <div className="text-[10px] text-gray-400">{faDate(t.createdAt)}</div>
                </div>
                <div className={`font-extrabold text-[13px] ${t.amount > 0 ? 'text-green-700' : 'text-red-500'}`}>
                  {faNum(Math.abs(t.amount).toLocaleString('en-US'))} ت
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={chargeOpen} onOpenChange={setChargeOpen}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-right">شارژ کیف پول</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              dir="ltr"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ','))}
              placeholder="1,000,000"
              className="rounded-2xl h-12 text-left text-lg"
              inputMode="numeric"
            />
            <div className="flex gap-2">
              {[500000, 1000000, 5000000].map((a) => (
                <button key={a} onClick={() => setAmount(a.toLocaleString('en-US'))} className="flex-1 bg-green-50 hover:bg-green-100 rounded-xl py-2 text-[12px] font-bold text-green-800">
                  {faNum((a / 1000000).toString())} میلیون
                </button>
              ))}
            </div>
            <Button onClick={charge} disabled={!amount} className="w-full h-12 rounded-2xl bg-green-700 hover:bg-green-800 font-bold">
              پرداخت (درگاه دمو)
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}

/** اشتراک */
export function SubscriptionView() {
  const checked = useRequireAuth()
  const { user, updateUser } = useStore()
  const [plans, setPlans] = useState<{ id: string; key: string; name: string; price: number; dailyAiMessages: number; maxActiveAds: number; features: string; color: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState('')

  useEffect(() => {
    if (!checked) return
    api('/api/subscription').then(res => setPlans(res.plans)).catch(() => {}).finally(() => setLoading(false))
  }, [checked])

  async function subscribe(planKey: string) {
    setBusy(planKey)
    try {
      await api('/api/subscription', { method: 'POST', body: JSON.stringify({ planKey }) })
      const res = await api('/api/auth/me')
      updateUser(res.user)
      toast({ title: 'اشتراک فعال شد 🎉' })
    } catch (e) {
      toast({ title: (e as Error).message, variant: 'destructive' })
    }
    setBusy('')
  }

  if (!checked) return <PageShell image="/images/farm.jpg" />

  return (
    <PageShell image="/images/farm.jpg">
      <PageHeader title="اشتراک بازارگاه" subtitle={user?.planKey && user.planKey !== 'FREE' ? `پلن فعلی شما: ${user.planKey === 'PRO' ? 'حرفه‌ای' : user.planKey === 'BUSINESS' ? 'بیزینس' : user.planKey} — از ۱۵ آگهی و سهمیه بیشتر لذت ببرید` : "پلن فعلی: رایگان — ارتقا بدهید"} />
      <div className="max-w-3xl lg:max-w-5xl mx-auto px-4 lg:px-8 pb-28 lg:pb-12">
        <div className="grid sm:grid-cols-2 gap-3 mt-4">
          {plans.map((p) => {
            const features = JSON.parse(p.features || '[]') as string[]
            const current = user?.planKey === p.key
            return (
              <div key={p.key} className={`glass-card rounded-3xl p-5 animate-fade-up ${current ? 'ring-2 ring-green-600' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="font-extrabold text-lg" style={{ color: p.color }}>{p.name}</div>
                  {current && <span className="text-[10px] bg-green-600 text-white rounded-full px-2.5 py-1">پلن فعلی</span>}
                </div>
                <div className="mt-2">
                  <span className="text-2xl font-extrabold">{p.price === 0 ? 'رایگان' : faNum(p.price.toLocaleString('en-US'))}</span>
                  {p.price > 0 && <span className="text-[12px] text-gray-400"> تومان / ماه</span>}
                </div>
                <ul className="space-y-1.5 mt-3">
                  {features.map((f) => (
                    <li key={f} className="text-[12px] text-gray-600 dark:text-gray-300 flex items-center gap-1.5">
                      <span className="text-green-600">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => subscribe(p.key)}
                  disabled={current || busy === p.key}
                  className={`w-full h-11 rounded-2xl mt-4 font-bold ${current ? 'bg-green-100 text-green-700' : 'bg-green-700 hover:bg-green-800 text-white'}`}
                >
                  {current ? 'فعال است' : p.price === 0 ? 'انتقال به رایگان' : 'خرید از کیف پول'}
                </Button>
              </div>
            )
          })}
        </div>
      </div>
    </PageShell>
  )
}

/** اعلان‌ها */
export function NotificationsView() {
  const checked = useRequireAuth()
  const [notifications, setNotifications] = useState<{ id: string; title: string; body: string; type: string; isRead: boolean; createdAt: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!checked) return
    api('/api/notifications').then(res => setNotifications(res.notifications)).catch(() => {}).finally(() => setLoading(false))
    api('/api/notifications', { method: 'POST' }).catch(() => {})
  }, [checked])

  if (!checked) return <PageShell image="/images/farm.jpg" />

  const iconMap: Record<string, string> = { AD: '📢', MESSAGE: '💬', ORDER: '📦', BOOKING: '📅', REMINDER: '⏰', SUBSCRIPTION: '👑', SYSTEM: '🌿' }

  return (
    <PageShell image="/images/farm.jpg">
      <PageHeader title="اعلان‌ها" />
      <div className="max-w-lg lg:max-w-3xl mx-auto px-4 pb-28 lg:pb-12">
        {loading ? <LoadingView /> : notifications.length === 0 ? (
          <EmptyState icon="🔔" title="اعلانی ندارید" />
        ) : (
          <div className="space-y-2 mt-4">
            {notifications.map((n) => (
              <div key={n.id} className={`glass-card rounded-2xl p-4 flex gap-3 ${!n.isRead ? 'border-r-4 border-r-green-600' : ''} animate-fade-up`}>
                <span className="text-2xl">{iconMap[n.type] || '🌿'}</span>
                <div className="flex-1">
                  <div className="font-bold text-[13px]">{n.title}</div>
                  {n.body && <div className="text-[12px] text-gray-500 mt-0.5 leading-relaxed">{n.body}</div>}
                  <div className="text-[10px] text-gray-400 mt-1">{faDate(n.createdAt)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  )
}

/** علاقه‌مندی‌ها */
export function FavoritesView() {
  const checked = useRequireAuth()
  const navigate = useStore(s => s.navigate)
  const [favorites, setFavorites] = useState<{ id: string; adId: string; ad: Record<string, unknown> }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!checked) return
    api('/api/favorites').then(res => setFavorites(res.favorites)).catch(() => {}).finally(() => setLoading(false))
  }, [checked])

  if (!checked) return <PageShell image="/images/farm.jpg" />

  return (
    <PageShell image="/images/farm.jpg">
      <PageHeader title="علاقه‌مندی‌ها" />
      <div className="max-w-3xl lg:max-w-6xl mx-auto px-4 lg:px-8 pb-28 lg:pb-12">
        {loading ? <LoadingView /> : favorites.length === 0 ? (
          <EmptyState icon="❤️" title="لیست خالی است" description="آگهی‌های موردعلاقه را با زدن قلب ذخیره کنید" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
            {favorites.map((item) => (
              <AdCard
                key={item.id}
                ad={item.ad as never}
                favorited
                onOpen={() => navigate('ad-detail', { id: item.adId })}
                onFavChange={(fav) => {
                  if (!fav) setFavorites((prev) => prev.filter((x) => x.adId !== item.adId))
                }}
              />
            ))}
          </div>
        )}
      </div>
    </PageShell>
  )
}

/** آگهی‌های من */
export function MyAdsView() {
  const checked = useRequireAuth()
  const navigate = useStore(s => s.navigate)
  const user = useStore(s => s.user)
  const [ads, setAds] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!checked || !user) return
    api(`/api/ads?userId=${user.id}&status=ACTIVE`).then(res => setAds(res.ads)).catch(() => {}).finally(() => setLoading(false))
  }, [checked, user])

  if (!checked) return <PageShell image="/images/farm.jpg" />

  const statusFa: Record<string, string> = { ACTIVE: 'فعال', PENDING: 'در انتظار تأیید', REJECTED: 'رد‌شده', EXPIRED: 'منقضی', SUSPENDED: 'معلق' }

  return (
    <PageShell image="/images/farm.jpg">
      <PageHeader title="آگهی‌های من" />
      <div className="max-w-3xl lg:max-w-6xl mx-auto px-4 lg:px-8 pb-28 lg:pb-12">
        {loading ? <LoadingView /> : ads.length === 0 ? (
          <EmptyState icon="📋" title="آگهی‌ای ندارید" action={<Button onClick={() => navigate('create-ad')} className="rounded-2xl bg-green-700">ثبت آگهی</Button>} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
            {ads.map((ad) => (
              <AdCard key={String(ad.id)} ad={ad as never} onOpen={() => navigate('ad-detail', { id: String(ad.id) })} />
            ))}
          </div>
        )}
      </div>
    </PageShell>
  )
}
