'use client'

import { useEffect, useState } from 'react'
import { ShoppingCart, Plus, Minus, Store as StoreIcon, Package, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageHeader, PageShell, LoadingView, EmptyState, useRequireAuth, StatCard } from '@/components/bazargah/shared'
import { useStore } from '@/lib/store'
import { api, faNum, faPrice } from '@/lib/api'
import { toast } from '@/hooks/use-toast'

interface Store {
  id: string; name: string; slug: string; description: string; city: string; province: string
  rating: number; phone?: string; products: Product[]
}
interface Product {
  id: string; name: string; price: number; oldPrice?: number; image?: string; category: string; stock: number; description: string
}

export function StoresView() {
  const navigate = useStore(s => s.navigate)
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api('/api/stores').then(res => setStores(res.stores)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  return (
    <PageShell image="/images/feed.jpg">
      <PageHeader title="فروشگاه‌ها" subtitle="خوراک، تجهیزات و لوازم حیوانات" />
      <div className="max-w-3xl mx-auto px-4 pb-28">
        <Button onClick={() => navigate('cart')} variant="outline" className="w-full h-11 rounded-2xl bg-white/80 mt-4 gap-2 font-bold">
          <ShoppingCart className="w-4 h-4" /> مشاهده سبد خرید و ثبت سفارش
        </Button>
        {loading ? <LoadingView /> : (
          <div className="space-y-4 mt-4">
            {stores.map((s) => (
              <div key={s.id} className="glass-card rounded-3xl p-5 animate-fade-up">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-green-700 text-white flex items-center justify-center">
                    <StoreIcon className="w-7 h-7" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold">{s.name}</div>
                    <div className="text-[12px] text-gray-500">{s.city} • ⭐ {faNum(s.rating)}</div>
                  </div>
                  <div className="text-[11px] text-green-700 bg-green-50 rounded-full px-2.5 py-1">{faNum(s.products.length)} محصول</div>
                </div>
                <p className="text-[12px] text-gray-500 mt-2">{s.description}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4">
                  {s.products.map((p) => (
                    <div key={p.id} className="bg-white/80 dark:bg-gray-900/60 rounded-2xl overflow-hidden border border-green-100/50">
                      <div className="h-24 bg-green-50">
                        {p.image && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.image} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                        )}
                      </div>
                      <div className="p-2.5">
                        <div className="font-bold text-[12px] leading-snug line-clamp-2 h-9">{p.name}</div>
                        <div className="font-extrabold text-[13px] text-green-700 mt-1.5">{faPrice(p.price)}</div>
                        <AddToCart productId={p.id} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  )
}

function AddToCart({ productId }: { productId: string }) {
  const [busy, setBusy] = useState(false)
  async function add() {
    setBusy(true)
    try {
      await api('/api/cart', { method: 'POST', body: JSON.stringify({ productId, qty: 1 }) })
      toast({ title: 'به سبد خرید اضافه شد 🛒' })
    } catch (e) {
      toast({ title: (e as Error).message, variant: 'destructive' })
    }
    setBusy(false)
  }
  return (
    <Button size="sm" onClick={add} disabled={busy} className="w-full h-8 mt-2 rounded-xl bg-green-700 hover:bg-green-800 text-[11px] gap-1">
      <Plus className="w-3.5 h-3.5" /> افزودن
    </Button>
  )
}

export function CartView() {
  const checked = useRequireAuth()
  const navigate = useStore(s => s.navigate)
  const [items, setItems] = useState<{ id: string; qty: number; product: Product & { store: { name: string } } }[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!checked) return
    const run = async () => {
      try {
        const res = await api('/api/cart')
        setItems(res.items)
        setTotal(res.total)
      } catch { /* */ }
      setLoading(false)
    }
    run()
  }, [checked])

  async function reload() {
    try {
      const res = await api('/api/cart')
      setItems(res.items)
      setTotal(res.total)
    } catch { /* */ }
  }

  async function remove(itemId: string) {
    await api(`/api/cart?itemId=${itemId}`, { method: 'DELETE' })
    reload()
  }

  async function checkout() {
    setSubmitting(true)
    try {
      const res = await api('/api/orders', {
        method: 'POST',
        body: JSON.stringify({ address, phone }),
      })
      toast({ title: `سفارش ${res.order.orderNo} ثبت شد ✅`, description: 'پرداخت از کیف پول انجام شد' })
      navigate('orders')
    } catch (e) {
      toast({ title: (e as Error).message, variant: 'destructive' })
    }
    setSubmitting(false)
  }

  if (!checked) return <PageShell image="/images/feed.jpg" />

  return (
    <PageShell image="/images/feed.jpg">
      <PageHeader title="سبد خرید" subtitle={`${items.length} قلم کالا`} />
      <div className="max-w-lg mx-auto px-4 pb-28">
        {loading ? <LoadingView /> : items.length === 0 ? (
          <EmptyState icon="🛒" title="سبد خرید خالی است" description="از فروشگاه‌ها کالا اضافه کنید" action={<Button onClick={() => navigate('stores')} className="rounded-2xl bg-green-700">فروشگاه‌ها</Button>} />
        ) : (
          <>
            <div className="space-y-2 mt-4">
              {items.map((i) => (
                <div key={i.id} className="glass-card rounded-3xl p-4 flex items-center gap-3">
                  {i.product.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={i.product.image} alt={i.product.name} className="w-14 h-14 rounded-2xl object-cover" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[13px] line-clamp-1">{i.product.name}</div>
                    <div className="text-[11px] text-gray-400">{i.product.store?.name}</div>
                    <div className="font-extrabold text-[13px] text-green-700 mt-0.5">
                      {faPrice(i.product.price * i.qty)} <span className="text-[10px] text-gray-400 font-normal">({faNum(i.qty)} عدد)</span>
                    </div>
                  </div>
                  <button onClick={() => remove(i.id)} aria-label="حذف" className="p-2 text-red-400 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="glass-card rounded-3xl p-5 mt-4 space-y-3">
              <h3 className="font-bold text-sm">اطلاعات ارسال</h3>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="آدرس تحویل" className="rounded-2xl h-11" />
              <Input dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="شماره تماس" className="rounded-2xl h-11 text-left" />
              <div className="flex justify-between items-center bg-green-50 dark:bg-green-900/30 rounded-2xl p-3">
                <span>جمع کل:</span>
                <span className="font-extrabold text-green-700 text-lg">{faPrice(total)}</span>
              </div>
              <Button onClick={checkout} disabled={submitting} className="w-full h-12 rounded-2xl bg-green-700 hover:bg-green-800 font-bold">
                {submitting ? '...' : 'پرداخت و ثبت سفارش (از کیف پول)'}
              </Button>
            </div>
          </>
        )}
      </div>
    </PageShell>
  )
}

export function OrdersView() {
  const checked = useRequireAuth()
  const [orders, setOrders] = useState<{ id: string; orderNo: string; total: number; status: string; items: string; createdAt: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!checked) return
    api('/api/orders').then(res => setOrders(res.orders)).catch(() => {}).finally(() => setLoading(false))
  }, [checked])

  const statusFa: Record<string, string> = {
    PENDING: 'در انتظار', PAID: 'پرداخت‌شده', SHIPPING: 'در ارسال', DELIVERED: 'تحویل‌شده', CANCELLED: 'لغو‌شده',
  }

  if (!checked) return <PageShell image="/images/feed.jpg" />

  return (
    <PageShell image="/images/feed.jpg">
      <PageHeader title="سفارش‌های من" />
      <div className="max-w-lg mx-auto px-4 pb-28">
        {loading ? <LoadingView /> : orders.length === 0 ? (
          <EmptyState icon="📦" title="سفارشی ثبت نشده" />
        ) : (
          <div className="space-y-3 mt-4">
            {orders.map((o) => {
              const items = JSON.parse(o.items || '[]') as { name: string; qty: number }[]
              return (
                <div key={o.id} className="glass-card rounded-3xl p-4 animate-fade-up">
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-[13px]">{o.orderNo}</span>
                    <span className="text-[11px] bg-green-100 text-green-700 rounded-full px-2.5 py-1">{statusFa[o.status] || o.status}</span>
                  </div>
                  <div className="text-[12px] text-gray-500 mt-2">
                    {items.map(i => `${i.name} ×${i.qty}`).join(' • ')}
                  </div>
                  <div className="flex justify-between mt-2 text-sm">
                    <span className="text-gray-400">جمع:</span>
                    <span className="font-extrabold text-green-700">{faPrice(o.total)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </PageShell>
  )
}
