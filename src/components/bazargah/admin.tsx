'use client'

import { useEffect, useState } from 'react'
import { Users, Megaphone, Brain, ShieldCheck, Check, X, Star, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageHeader, PageShell, LoadingView, StatCard } from '@/components/bazargah/shared'
import { useStore } from '@/lib/store'
import { api, faNum, faPrice } from '@/lib/api'
import { toast } from '@/hooks/use-toast'

export function AdminView() {
  const user = useStore(s => s.user)
  const [stats, setStats] = useState<Record<string, number> | null>(null)
  const [aiByType, setAiByType] = useState<{ type: string; count: number; tokens: number }[]>([])
  const [users, setUsers] = useState<Record<string, unknown>[]>([])
  const [ads, setAds] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const run = async () => {
      try {
        const [s, u, a] = await Promise.all([
          api('/api/admin/stats'),
          api('/api/admin/users'),
          api('/api/admin/ads'),
        ])
        setStats(s.stats)
        setAiByType(s.aiByType || [])
        setUsers(u.users)
        setAds(a.ads)
      } catch (e) {
        toast({ title: (e as Error).message, variant: 'destructive' })
      }
      setLoading(false)
    }
    run()
  }, [])

  async function adAction(adId: string, action: string) {
    try {
      await api('/api/admin/ads', { method: 'PUT', body: JSON.stringify({ adId, action }) })
      toast({ title: 'انجام شد' })
      load()
    } catch (e) {
      toast({ title: (e as Error).message, variant: 'destructive' })
    }
  }

  if (!user?.roleList?.includes('ADMIN')) {
    return (
      <PageShell image="/images/farm.jpg">
        <PageHeader title="پنل مدیریت" />
        <div className="text-center py-20 text-sm text-gray-500">دسترسی ادمین لازم است</div>
      </PageShell>
    )
  }

  if (loading) return <PageShell image="/images/farm.jpg"><LoadingView /></PageShell>

  return (
    <PageShell image="/images/farm.jpg">
      <PageHeader title="پنل مدیریت بازارگاه" subtitle="داشبورد کامل ادمین" />

      <div className="max-w-4xl lg:max-w-6xl mx-auto px-4 lg:px-8 pb-28 lg:pb-12">
        <Tabs defaultValue="stats" className="mt-4">
          <TabsList className="w-full grid grid-cols-4 h-11">
            <TabsTrigger value="stats" className="text-[12px] gap-1"><Eye className="w-3.5 h-3.5" /> آمار</TabsTrigger>
            <TabsTrigger value="ads" className="text-[12px] gap-1"><Megaphone className="w-3.5 h-3.5" /> آگهی‌ها</TabsTrigger>
            <TabsTrigger value="users" className="text-[12px] gap-1"><Users className="w-3.5 h-3.5" /> کاربران</TabsTrigger>
            <TabsTrigger value="ai" className="text-[12px] gap-1"><Brain className="w-3.5 h-3.5" /> مصرف AI</TabsTrigger>
          </TabsList>

          {/* آمار */}
          <TabsContent value="stats" className="mt-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard icon="👥" label="کل کاربران" value={stats?.totalUsers || 0} sub={`${faNum(stats?.newUsers || 0)} جدید این هفته`} />
              <StatCard icon="📢" label="کل آگهی‌ها" value={stats?.totalAds || 0} sub={`${faNum(stats?.activeAds || 0)} فعال`} color="bg-amber-100 text-amber-700" />
              <StatCard icon="📦" label="سفارش‌ها" value={stats?.totalOrders || 0} color="bg-blue-50 text-blue-700" />
              <StatCard icon="💰" label="درآمد پرداخت‌ها" value={faNum((stats?.totalRevenue || 0).toLocaleString('en-US'))} color="bg-emerald-100 text-emerald-700" />
              <StatCard icon="🧠" label="درخواست AI" value={stats?.aiUsageCount || 0} />
              <StatCard icon="🔤" label="توکن مصرفی AI" value={faNum((stats?.aiTokens || 0).toLocaleString('en-US'))} />
              <StatCard icon="🚩" label="گزارش تخلف" value={stats?.pendingReports || 0} color="bg-red-50 text-red-600" />
              <StatCard icon="✅" label="وضعیت سیستم" value="سالم" color="bg-green-100 text-green-700" />
            </div>

            {aiByType.length > 0 && (
              <div className="glass-card rounded-3xl p-5 mt-4">
                <h3 className="font-bold mb-3">مصرف AI هفته اخیر</h3>
                {aiByType.map((t) => (
                  <div key={t.type} className="flex justify-between items-center py-2 border-b border-green-100/50 last:border-0">
                    <span className="text-[13px] font-bold">{t.type === 'VET' ? '🩺 AI دامپزشک' : t.type === 'NUTRITION' ? '🌾 تغذیه هوشمند' : '🔍 جستجوی هوشمند'}</span>
                    <span className="text-[12px] text-gray-500">{faNum(t.count)} درخواست • {faNum(t.tokens.toLocaleString('en-US'))} توکن</span>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* آگهی‌ها */}
          <TabsContent value="ads" className="mt-4">
            <div className="space-y-2">
              {ads.slice(0, 20).map((ad) => (
                <div key={String(ad.id)} className="glass-card rounded-2xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-[13px] truncate">{String(ad.title)}</div>
                      <div className="text-[11px] text-gray-500 mt-0.5">
                        {(ad.category as Record<string, string>)?.name} • {(ad.user as Record<string, string>)?.firstName} {String(ad.status)}
                      </div>
                    </div>
                    {ad.isFeatured && <Star className="w-4 h-4 fill-amber-400 text-amber-400" />}
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => adAction(String(ad.id), 'feature')} className="h-8 rounded-xl text-[11px] bg-amber-50 border-amber-200 text-amber-700">ویژه</Button>
                      <Button size="sm" variant="outline" onClick={() => adAction(String(ad.id), 'approve')} className="h-8 rounded-xl text-[11px] bg-green-50 border-green-200 text-green-700">تأیید</Button>
                      <Button size="sm" variant="outline" onClick={() => adAction(String(ad.id), 'suspend')} className="h-8 rounded-xl text-[11px] bg-red-50 border-red-200 text-red-600">معلق</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* کاربران */}
          <TabsContent value="users" className="mt-4">
            <div className="space-y-2">
              {users.map((u) => (
                <div key={String(u.id)} className="glass-card rounded-2xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-700 text-white flex items-center justify-center font-bold">
                    {String(u.firstName || '؟')[0]}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-[13px]">{String(u.firstName)} {String(u.lastName)} {String(u.phone)}</div>
                    <div className="text-[11px] text-gray-500">
                      {faNum((u._count as Record<string, number>)?.ads || 0)} آگهی • {faNum((u._count as Record<string, number>)?.animals || 0)} حیوان • {String(u.planKey)}
                    </div>
                  </div>
                  {(JSON.parse(String(u.roles)) as string[]).includes('ADMIN') && <ShieldCheck className="w-4 h-4 text-blue-500" />}
                </div>
              ))}
            </div>
          </TabsContent>

          {/* AI */}
          <TabsContent value="ai" className="mt-4">
            <div className="glass-card rounded-3xl p-5">
              <h3 className="font-bold mb-2">کنترل هزینه AI</h3>
              <p className="text-[12px] text-gray-500 mb-4 leading-relaxed">
                همه درخواست‌های هوش مصنوعی ثبت و کنترل می‌شوند. کاربران رایگان محدودیت پیام روزانه دارند و مصرف هر کاربر در این بخش قابل پایش است.
              </p>
              <div className="grid grid-cols-3 gap-3">
                <StatCard icon="🔢" label="کل درخواست‌ها" value={stats?.aiUsageCount || 0} />
                <StatCard icon="🔤" label="کل توکن‌ها" value={faNum((stats?.aiTokens || 0).toLocaleString('en-US'))} />
                <StatCard icon="💵" label="برآورد هزینه" value="— تومان" />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageShell>
  )
}
