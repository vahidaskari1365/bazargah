'use client'

import { useEffect, useState } from 'react'
import { Plus, Sprout, TrendingDown, PieChart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageHeader, PageShell, LoadingView, EmptyState, useRequireAuth, StatCard } from '@/components/bazargah/shared'
import { useStore } from '@/lib/store'
import { api, faNum, faPrice, SPECIES_FA } from '@/lib/api'
import { toast } from '@/hooks/use-toast'

interface Herd { id: string; name: string; species?: string; notes?: string; animals: { id: string; name: string }[] }

export function HerdsView() {
  const checked = useRequireAuth()
  const [herds, setHerds] = useState<Herd[]>([])
  const [animals, setAnimals] = useState<{ id: string; name: string; species: string; herdId?: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [name, setName] = useState('')

  useEffect(() => {
    if (!checked) return
    Promise.all([api('/api/herds'), api('/api/animals')])
      .then(([h, a]) => { setHerds(h.herds); setAnimals(a.animals) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [checked])

  async function add() {
    if (!name) return
    try {
      await api('/api/herds', { method: 'POST', body: JSON.stringify({ name }) })
      toast({ title: 'گله ایجاد شد 🐄' })
      setAddOpen(false)
      setName('')
      const h = await api('/api/herds')
      setHerds(h.herds)
    } catch (e) {
      toast({ title: (e as Error).message, variant: 'destructive' })
    }
  }

  if (!checked) return <PageShell image="/images/cow.jpg" />

  return (
    <PageShell image="/images/cow.jpg">
      <PageHeader title="مدیریت گله" subtitle="گروه‌بندی و مدیریت دام‌ها" />
      <div className="max-w-3xl mx-auto px-4 pb-28">
        <Button onClick={() => setAddOpen(true)} className="w-full h-12 rounded-2xl bg-green-700 hover:bg-green-800 mt-4 font-bold gap-2">
          <Plus className="w-5 h-5" /> ایجاد گله جدید
        </Button>

        {loading ? <LoadingView /> : herds.length === 0 ? (
          <EmptyState icon="🐄" title="گله‌ای ندارید" description="برای مدیریت جمعی دام‌ها گله بسازید" />
        ) : (
          <div className="grid sm:grid-cols-2 gap-3 mt-4">
            {herds.map((h) => {
              const herdAnimals = animals.filter(a => a.species === h.species)
              return (
                <div key={h.id} className="glass-card rounded-3xl p-5 animate-fade-up">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center">
                      <Sprout className="w-6 h-6 text-green-700" />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold">{h.name}</div>
                      <div className="text-[12px] text-gray-500">{h.species ? SPECIES_FA[h.species] : 'مختلط'} • {faNum(herdAnimals.length)} حیوان مرتبط</div>
                    </div>
                  </div>
                  {h.notes && <p className="text-[12px] text-gray-500 mt-3">{h.notes}</p>}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="rounded-3xl">
          <DialogHeader><DialogTitle className="text-right">گله جدید</DialogTitle></DialogHeader>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="نام گله — مثال: گله گاو شیری ۱" className="rounded-2xl h-11" />
          <Button onClick={add} className="w-full h-11 rounded-2xl bg-green-700 hover:bg-green-800 font-bold">ایجاد گله</Button>
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}

interface Expense {
  id: string; type: string; amount: number; note?: string; date: string; animal?: { name: string } | null
}

export function ExpensesView() {
  const checked = useRequireAuth()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [byType, setByType] = useState<{ type: string; label: string; amount: number; percent: number }[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState({ type: 'FEED', amount: '', note: '' })

  useEffect(() => {
    if (!checked) return
    const run = async () => {
      try {
        const res = await api('/api/expenses')
        setExpenses(res.expenses)
        setByType(res.byType)
        setTotal(res.total)
      } catch { /* */ }
      setLoading(false)
    }
    run()
  }, [checked])

  async function add() {
    try {
      await api('/api/expenses', { method: 'POST', body: JSON.stringify(form) })
      toast({ title: 'هزینه ثبت شد' })
      setAddOpen(false)
      setForm({ type: 'FEED', amount: '', note: '' })
      load()
    } catch (e) {
      toast({ title: (e as Error).message, variant: 'destructive' })
    }
  }

  if (!checked) return <PageShell image="/images/cow.jpg" />

  const typeIcons: Record<string, string> = { FEED: '🌾', MEDICINE: '💊', VET: '🩺', TRANSPORT: '🚚', LABOR: '👷', OTHER: '📌' }

  return (
    <PageShell image="/images/cow.jpg">
      <PageHeader title="هزینه و سودآوری" subtitle="تحلیل هزینه‌های دامداری" />
      <div className="max-w-3xl mx-auto px-4 pb-28">
        <div className="grid grid-cols-2 gap-3 mt-4">
          <StatCard icon="💸" label="کل هزینه‌ها" value={faNum(total.toLocaleString('en-US')) + ' ت'} />
          <StatCard icon="📊" label="تعداد تراکنش" value={expenses.length} />
        </div>

        {/* نمودار دایره‌ای ساده */}
        {byType.length > 0 && (
          <div className="glass-card rounded-3xl p-5 mt-4 animate-fade-up">
            <h3 className="font-bold mb-4 flex items-center gap-2"><PieChart className="w-4 h-4 text-green-700" /> تفکیک هزینه‌ها</h3>
            <div className="space-y-2.5">
              {byType.map((t) => (
                <div key={t.type}>
                  <div className="flex justify-between text-[12px] mb-1">
                    <span>{typeIcons[t.type]} {t.label}</span>
                    <span className="font-bold">{faNum(t.percent)}٪ — {faNum(t.amount.toLocaleString('en-US'))} ت</span>
                  </div>
                  <div className="h-2.5 bg-green-50 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-l from-green-600 to-green-400 rounded-full transition-all" style={{ width: `${t.percent}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Button onClick={() => setAddOpen(true)} className="w-full h-12 rounded-2xl bg-green-700 hover:bg-green-800 mt-4 font-bold gap-2">
          <Plus className="w-5 h-5" /> ثبت هزینه جدید
        </Button>

        <div className="space-y-2 mt-4">
          {expenses.slice(0, 15).map((e) => (
            <div key={e.id} className="glass-card rounded-2xl p-3.5 flex items-center gap-3">
              <span className="text-xl">{typeIcons[e.type]}</span>
              <div className="flex-1">
                <div className="text-[13px] font-bold">{e.note || e.type}</div>
                <div className="text-[10px] text-gray-400">{e.date} {e.animal ? `• ${e.animal.name}` : ''}</div>
              </div>
              <div className="font-extrabold text-[13px] text-red-500">−{faNum(e.amount.toLocaleString('en-US'))} ت</div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="rounded-3xl">
          <DialogHeader><DialogTitle className="text-right">ثبت هزینه</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Select value={form.type} onValueChange={(v) => setForm(f => ({ ...f, type: v }))}>
              <SelectTrigger className="rounded-2xl h-11"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="FEED">🌾 خوراک</SelectItem>
                <SelectItem value="MEDICINE">💊 دارو</SelectItem>
                <SelectItem value="VET">🩺 دامپزشک</SelectItem>
                <SelectItem value="TRANSPORT">🚚 حمل‌ونقل</SelectItem>
                <SelectItem value="LABOR">👷 نیروی انسانی</SelectItem>
                <SelectItem value="OTHER">📌 سایر</SelectItem>
              </SelectContent>
            </Select>
            <Input
              dir="ltr"
              value={form.amount}
              onChange={(e) => setForm(f => ({ ...f, amount: e.target.value.replace(/[^\d]/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',') }))}
              placeholder="مبلغ (تومان)"
              className="rounded-2xl h-11 text-left"
              inputMode="numeric"
            />
            <Input value={form.note} onChange={(e) => setForm(f => ({ ...f, note: e.target.value }))} placeholder="توضیح" className="rounded-2xl h-11" />
            <Button onClick={add} disabled={!form.amount} className="w-full h-11 rounded-2xl bg-green-700 hover:bg-green-800 font-bold">ثبت</Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}
