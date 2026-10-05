'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, QrCode, Syringe, Pill, FlaskConical, Activity, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageHeader, PageShell, LoadingView, EmptyState, useRequireAuth, StatCard } from '@/components/bazargah/shared'
import { useStore } from '@/lib/store'
import { api, faNum, faDate, SPECIES_FA, SPECIES_ICONS } from '@/lib/api'
import { toast } from '@/hooks/use-toast'

interface Animal {
  id: string; publicId: string; name: string; species: string; breed?: string
  gender: string; birthDate?: string; weight?: number; purpose?: string
  environment?: string; images: string; notes?: string
  vaccinations: { id: string; vaccine: string; date: string; nextDate?: string }[]
  healthRecords: { id: string; type: string; title: string; description?: string; date: string }[]
  medications: { id: string; name: string; dose?: string; startDate: string }[]
  tests: { id: string; name: string; result?: string; date: string }[]
  dailyLogs: { id: string; date: string; weight?: number; feedKg?: number; production?: string; symptoms?: string }[]
}

const HEALTH_TYPES: Record<string, string> = { NOTE: 'یادداشت', ILLNESS: 'بیماری', TREATMENT: 'درمان', SURGERY: 'جراحی', INJURY: 'آسیب' }

export function AnimalsView() {
  const checked = useRequireAuth()
  const navigate = useStore(s => s.navigate)
  const [animals, setAnimals] = useState<Animal[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState({ name: '', species: 'COW', breed: '', gender: 'FEMALE', weight: '', purpose: '', notes: '' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      try {
        const res = await api('/api/animals')
        setAnimals(res.animals)
      } catch { /* */ }
      setLoading(false)
    }
    run()
  }, [])

  async function load() {
    setLoading(true)
    try {
      const res = await api('/api/animals')
      setAnimals(res.animals)
    } catch { /* */ }
    setLoading(false)
  }

  async function addAnimal() {
    if (!form.name) { toast({ title: 'نام حیوان الزامی است', variant: 'destructive' }); return }
    setSubmitting(true)
    try {
      await api('/api/animals', { method: 'POST', body: JSON.stringify(form) })
      toast({ title: 'حیوان ثبت شد و Animal ID اختصاصی گرفت 🐾' })
      setAddOpen(false)
      setForm({ name: '', species: 'COW', breed: '', gender: 'FEMALE', weight: '', purpose: '', notes: '' })
      load()
    } catch (e) {
      toast({ title: (e as Error).message, variant: 'destructive' })
    }
    setSubmitting(false)
  }

  if (!checked) return <PageShell image="/images/cow.jpg" />

  return (
    <PageShell image="/images/cow.jpg">
      <PageHeader title="حیوانات من" subtitle="پرونده دیجیتال سلامت هر حیوان" />

      <div className="max-w-3xl lg:max-w-6xl mx-auto px-4 lg:px-8 pb-28 lg:pb-12">
        {loading ? <LoadingView /> : animals.length === 0 ? (
          <EmptyState
            icon="🐾"
            title="هنوز حیوانی ثبت نکرده‌اید"
            description="برای هر حیوان پرونده دیجیتال شامل واکسن، دارو، آزمایش و وزن بسازید و Animal ID + QR اختصاصی بگیرید"
            action={
              <Button onClick={() => setAddOpen(true)} className="rounded-2xl bg-green-700 hover:bg-green-800 font-bold">
                <Plus className="w-4 h-4" /> ثبت اولین حیوان
              </Button>
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              <StatCard icon="🐾" label="کل حیوانات" value={animals.length} />
              <StatCard icon="💉" label="واکسن ثبت‌شده" value={animals.reduce((s, a) => s + a.vaccinations.length, 0)} />
              <StatCard icon="🩺" label="رویداد سلامت" value={animals.reduce((s, a) => s + a.healthRecords.length, 0)} />
              <StatCard icon="⚖️" label="میانگین وزن" value={animals.filter(a => a.weight).length ? Math.round(animals.reduce((s, a) => s + (a.weight || 0), 0) / animals.filter(a => a.weight).length) : '—'} />
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
              {animals.map((a) => (
                <div
                  key={a.id}
                  onClick={() => navigate('animal-detail', { id: a.id })}
                  className="glass-card rounded-3xl p-4 flex items-center gap-4 cursor-pointer hover:shadow-xl transition-all animate-fade-up"
                >
                  <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center text-3xl shrink-0">
                    {SPECIES_ICONS[a.species] || '🐾'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold">{a.name}</div>
                    <div className="text-[12px] text-gray-500 mt-0.5">
                      {SPECIES_FA[a.species] || a.species} {a.breed ? `• ${a.breed}` : ''} {a.weight ? `• ${faNum(a.weight)} کیلو` : ''}
                    </div>
                    <div className="flex gap-1.5 mt-1.5">
                      {a.vaccinations.length > 0 && <span className="text-[10px] bg-green-100 text-green-700 rounded-full px-2 py-0.5">💉 {faNum(a.vaccinations.length)} واکسن</span>}
                      {a.healthRecords.length > 0 && <span className="text-[10px] bg-blue-50 text-blue-700 rounded-full px-2 py-0.5">🩺 {faNum(a.healthRecords.length)} رکورد</span>}
                    </div>
                  </div>
                  <QrCode className="w-5 h-5 text-gray-300" />
                </div>
              ))}
            </div>

            <Button onClick={() => setAddOpen(true)} className="w-full h-12 rounded-2xl bg-green-700 hover:bg-green-800 mt-4 font-bold gap-2">
              <Plus className="w-5 h-5" /> ثبت حیوان جدید
            </Button>
          </>
        )}
      </div>

      {/* مودال افزودن */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="rounded-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-right">ثبت حیوان جدید</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">نام *</label>
                <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} className="rounded-2xl" placeholder="مثال: لیلا" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">گونه *</label>
                <Select value={form.species} onValueChange={(v) => setForm(f => ({ ...f, species: v }))}>
                  <SelectTrigger className="rounded-2xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(SPECIES_FA).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">نژاد</label>
                <Input value={form.breed} onChange={(e) => setForm(f => ({ ...f, breed: e.target.value }))} className="rounded-2xl" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">وزن (کیلو)</label>
                <Input dir="ltr" value={form.weight} onChange={(e) => setForm(f => ({ ...f, weight: e.target.value.replace(/[^\d.]/g, '') }))} className="rounded-2xl text-left" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">جنسیت</label>
                <Select value={form.gender} onValueChange={(v) => setForm(f => ({ ...f, gender: v }))}>
                  <SelectTrigger className="rounded-2xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FEMALE">ماده</SelectItem>
                    <SelectItem value="MALE">نر</SelectItem>
                    <SelectItem value="UNKNOWN">نامشخص</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">هدف پرورش</label>
                <Select value={form.purpose} onValueChange={(v) => setForm(f => ({ ...f, purpose: v }))}>
                  <SelectTrigger className="rounded-2xl"><SelectValue placeholder="انتخاب" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DAIRY">شیری</SelectItem>
                    <SelectItem value="MEAT">گوشتی</SelectItem>
                    <SelectItem value="PET">خانگی</SelectItem>
                    <SelectItem value="LAYING">تخم‌گذاری</SelectItem>
                    <SelectItem value="WOOL">پشمی</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">یادداشت</label>
              <Textarea value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="rounded-2xl" />
            </div>
            <Button onClick={addAnimal} disabled={submitting} className="w-full h-11 rounded-2xl bg-green-700 hover:bg-green-800 font-bold">
              {submitting ? '...' : 'ثبت حیوان'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}

/** جزئیات حیوان + رکوردهای سلامت */
export function AnimalDetailView({ id }: { id: string }) {
  const checked = useRequireAuth()
  const [animal, setAnimal] = useState<Animal | null>(null)
  const [loading, setLoading] = useState(true)
  const [recType, setRecType] = useState<'VACCINATION' | 'MEDICATION' | 'TEST' | 'HEALTH' | 'DAILY_LOG'>('VACCINATION')
  const [recOpen, setRecOpen] = useState(false)
  const [recData, setRecData] = useState<Record<string, string>>({})

  const load = useCallback(async () => {
    try {
      const res = await api(`/api/animals/${id}`)
      setAnimal(res.animal)
    } catch { /* */ }
  }, [id])

  useEffect(() => {
    setLoading(true)
    load().finally(() => setLoading(false))
  }, [load])

  async function addRecord() {
    try {
      await api(`/api/animals/${id}/records`, {
        method: 'POST',
        body: JSON.stringify({ type: recType, data: recData }),
      })
      toast({ title: 'رکورد ثبت شد ✅' })
      setRecOpen(false)
      setRecData({})
      await load()
    } catch (e) {
      toast({ title: (e as Error).message, variant: 'destructive' })
    }
  }

  if (!checked) return <PageShell image="/images/cow.jpg" />
  if (loading) return <PageShell image="/images/cow.jpg"><LoadingView /></PageShell>
  if (!animal) return <PageShell image="/images/cow.jpg"><div className="pt-20 text-center">یافت نشد</div></PageShell>

  const recForms: Record<string, React.ReactNode> = {
    VACCINATION: (
      <>
        <Input placeholder="نام واکسن *" value={recData.vaccine || ''} onChange={(e) => setRecData(d => ({ ...d, vaccine: e.target.value }))} className="rounded-2xl" />
        <div className="grid grid-cols-2 gap-2">
          <Input placeholder="تاریخ (2026-01-15)" value={recData.date || ''} onChange={(e) => setRecData(d => ({ ...d, date: e.target.value }))} className="rounded-2xl" />
          <Input placeholder="دوز بعدی (اختیاری)" value={recData.nextDate || ''} onChange={(e) => setRecData(d => ({ ...d, nextDate: e.target.value }))} className="rounded-2xl" />
        </div>
      </>
    ),
    MEDICATION: (
      <>
        <Input placeholder="نام دارو *" value={recData.name || ''} onChange={(e) => setRecData(d => ({ ...d, name: e.target.value }))} className="rounded-2xl" />
        <div className="grid grid-cols-2 gap-2">
          <Input placeholder="دوز" value={recData.dose || ''} onChange={(e) => setRecData(d => ({ ...d, dose: e.target.value }))} className="rounded-2xl" />
          <Input placeholder="تاریخ شروع" value={recData.startDate || ''} onChange={(e) => setRecData(d => ({ ...d, startDate: e.target.value }))} className="rounded-2xl" />
        </div>
      </>
    ),
    TEST: (
      <>
        <Input placeholder="نام آزمایش *" value={recData.name || ''} onChange={(e) => setRecData(d => ({ ...d, name: e.target.value }))} className="rounded-2xl" />
        <Input placeholder="نتیجه" value={recData.result || ''} onChange={(e) => setRecData(d => ({ ...d, result: e.target.value }))} className="rounded-2xl" />
      </>
    ),
    HEALTH: (
      <>
        <Input placeholder="عنوان *" value={recData.title || ''} onChange={(e) => setRecData(d => ({ ...d, title: e.target.value }))} className="rounded-2xl" />
        <Textarea placeholder="توضیحات" value={recData.description || ''} onChange={(e) => setRecData(d => ({ ...d, description: e.target.value }))} rows={2} className="rounded-2xl" />
      </>
    ),
    DAILY_LOG: (
      <div className="grid grid-cols-2 gap-2">
        <Input placeholder="وزن (کیلو)" value={recData.weight || ''} onChange={(e) => setRecData(d => ({ ...d, weight: e.target.value }))} className="rounded-2xl" />
        <Input placeholder="خوراک (کیلو)" value={recData.feedKg || ''} onChange={(e) => setRecData(d => ({ ...d, feedKg: e.target.value }))} className="rounded-2xl" />
        <Input placeholder="تولید (لیتر/عدد)" value={recData.production || ''} onChange={(e) => setRecData(d => ({ ...d, production: e.target.value }))} className="rounded-2xl" />
        <Input placeholder="علائم (اختیاری)" value={recData.symptoms || ''} onChange={(e) => setRecData(d => ({ ...d, symptoms: e.target.value }))} className="rounded-2xl" />
      </div>
    ),
  }

  const recLabels: Record<string, string> = {
    VACCINATION: '💉 واکسیناسیون', MEDICATION: '💊 دارو', TEST: '🔬 آزمایش', HEALTH: '🩺 رکورد سلامت', DAILY_LOG: '📝 ثبت روزانه',
  }

  return (
    <PageShell image="/images/cow.jpg">
      <PageHeader title={animal.name} subtitle={`${SPECIES_FA[animal.species]} • Animal ID: ${animal.publicId}`} />

      <div className="max-w-3xl lg:max-w-5xl mx-auto px-4 lg:px-8 pb-28 lg:pb-12">
        {/* کارت شناسنامه */}
        <div className="glass-card rounded-3xl p-5 mt-4 animate-fade-up">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-3xl bg-green-100 flex items-center justify-center text-4xl">
              {SPECIES_ICONS[animal.species] || '🐾'}
            </div>
            <div className="flex-1 grid grid-cols-2 gap-2 text-[13px]">
              <div><span className="text-gray-400">نژاد:</span> <b>{animal.breed || '—'}</b></div>
              <div><span className="text-gray-400">جنسیت:</span> <b>{animal.gender === 'FEMALE' ? 'ماده' : animal.gender === 'MALE' ? 'نر' : '—'}</b></div>
              <div><span className="text-gray-400">وزن:</span> <b>{animal.weight ? `${faNum(animal.weight)} کیلو` : '—'}</b></div>
              <div><span className="text-gray-400">تولد:</span> <b>{animal.birthDate || '—'}</b></div>
            </div>
          </div>
          <div className="mt-4 bg-green-50 dark:bg-green-900/30 rounded-2xl p-3 flex items-center gap-3">
            <QrCode className="w-12 h-12 text-green-700" />
            <div className="text-[12px] text-gray-600 dark:text-gray-300 leading-relaxed">
              <b>Animal ID:</b> <span className="font-mono">{animal.publicId}</span><br />
              شناسه یکتای حیوان — سطح دسترسی اطلاعات تحت کنترل مالک است
            </div>
          </div>
        </div>

        {/* رکوردها */}
        <div className="glass-card rounded-3xl p-5 mt-4 animate-fade-up">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold">پرونده سلامت</h3>
            <Dialog open={recOpen} onOpenChange={setRecOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="rounded-xl bg-green-700 hover:bg-green-800 gap-1">
                  <Plus className="w-4 h-4" /> افزودن
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-3xl">
                <DialogHeader>
                  <DialogTitle className="text-right">افزودن رکورد</DialogTitle>
                </DialogHeader>
                <Tabs value={recType} onValueChange={(v) => setRecType(v as typeof recType)}>
                  <TabsList className="grid grid-cols-5 w-full">
                    <TabsTrigger value="VACCINATION" className="text-[10px] px-1">واکسن</TabsTrigger>
                    <TabsTrigger value="MEDICATION" className="text-[10px] px-1">دارو</TabsTrigger>
                    <TabsTrigger value="TEST" className="text-[10px] px-1">آزمایش</TabsTrigger>
                    <TabsTrigger value="HEALTH" className="text-[10px] px-1">سلامت</TabsTrigger>
                    <TabsTrigger value="DAILY_LOG" className="text-[10px] px-1">روزانه</TabsTrigger>
                  </TabsList>
                </Tabs>
                <div className="space-y-2 py-2">{recForms[recType]}</div>
                <Button onClick={addRecord} className="w-full h-11 rounded-2xl bg-green-700 hover:bg-green-800 font-bold">
                  ثبت {recLabels[recType]}
                </Button>
              </DialogContent>
            </Dialog>
          </div>

          <Tabs defaultValue="vaccinations">
            <TabsList className="w-full grid grid-cols-4">
              <TabsTrigger value="vaccinations" className="text-[11px] gap-1"><Syringe className="w-3.5 h-3.5" /> واکسن ({faNum(animal.vaccinations.length)})</TabsTrigger>
              <TabsTrigger value="medications" className="text-[11px] gap-1"><Pill className="w-3.5 h-3.5" /> دارو ({faNum(animal.medications.length)})</TabsTrigger>
              <TabsTrigger value="tests" className="text-[11px] gap-1"><FlaskConical className="w-3.5 h-3.5" /> آزمایش ({faNum(animal.tests.length)})</TabsTrigger>
              <TabsTrigger value="logs" className="text-[11px] gap-1"><Activity className="w-3.5 h-3.5" /> روزانه</TabsTrigger>
            </TabsList>

            <TabsContent value="vaccinations" className="space-y-2 mt-3 max-h-72 overflow-y-auto">
              {animal.vaccinations.length === 0 ? <p className="text-sm text-gray-400 text-center py-6">واکنسی ثبت نشده</p> :
                animal.vaccinations.map((v) => (
                  <div key={v.id} className="bg-white/70 dark:bg-gray-900/50 rounded-2xl p-3 flex items-center gap-3">
                    <Syringe className="w-5 h-5 text-green-600 shrink-0" />
                    <div className="flex-1">
                      <div className="font-bold text-[13px]">{v.vaccine}</div>
                      <div className="text-[11px] text-gray-500">تاریخ: {v.date} {v.nextDate ? `• دوز بعدی: ${v.nextDate}` : ''}</div>
                    </div>
                  </div>
                ))}
            </TabsContent>
            <TabsContent value="medications" className="space-y-2 mt-3 max-h-72 overflow-y-auto">
              {animal.medications.length === 0 ? <p className="text-sm text-gray-400 text-center py-6">دارویی ثبت نشده</p> :
                animal.medications.map((m) => (
                  <div key={m.id} className="bg-white/70 dark:bg-gray-900/50 rounded-2xl p-3 flex items-center gap-3">
                    <Pill className="w-5 h-5 text-blue-600 shrink-0" />
                    <div className="flex-1">
                      <div className="font-bold text-[13px]">{m.name} {m.dose ? `— ${m.dose}` : ''}</div>
                      <div className="text-[11px] text-gray-500">از {m.startDate}</div>
                    </div>
                  </div>
                ))}
            </TabsContent>
            <TabsContent value="tests" className="space-y-2 mt-3 max-h-72 overflow-y-auto">
              {animal.tests.length === 0 ? <p className="text-sm text-gray-400 text-center py-6">آزمایشی ثبت نشده</p> :
                animal.tests.map((t) => (
                  <div key={t.id} className="bg-white/70 dark:bg-gray-900/50 rounded-2xl p-3 flex items-center gap-3">
                    <FlaskConical className="w-5 h-5 text-purple-600 shrink-0" />
                    <div className="flex-1">
                      <div className="font-bold text-[13px]">{t.name}</div>
                      <div className="text-[11px] text-gray-500">{t.result ? `نتیجه: ${t.result}` : ''} • {t.date}</div>
                    </div>
                  </div>
                ))}
            </TabsContent>
            <TabsContent value="logs" className="space-y-2 mt-3 max-h-72 overflow-y-auto">
              {animal.dailyLogs.length === 0 ? <p className="text-sm text-gray-400 text-center py-6">ثبت روزانه‌ای وجود ندارد</p> :
                animal.dailyLogs.map((l) => (
                  <div key={l.id} className="bg-white/70 dark:bg-gray-900/50 rounded-2xl p-3">
                    <div className="flex justify-between text-[12px]">
                      <span className="font-bold">{l.date}</span>
                      <div className="flex gap-3 text-gray-500">
                        {l.weight && <span>⚖️ {faNum(l.weight)} ک</span>}
                        {l.feedKg && <span>🌾 {faNum(l.feedKg)} ک</span>}
                        {l.production && <span>🥛 {l.production}</span>}
                      </div>
                    </div>
                    {l.symptoms && <div className="text-[11px] text-amber-700 mt-1">⚠️ {l.symptoms}</div>}
                  </div>
                ))}
            </TabsContent>
          </Tabs>
        </div>

        {/* رکوردهای سلامت متنی */}
        {animal.healthRecords.length > 0 && (
          <div className="glass-card rounded-3xl p-5 mt-4">
            <h3 className="font-bold mb-3">تاریخچه سلامت</h3>
            <div className="space-y-2">
              {animal.healthRecords.map((r) => (
                <div key={r.id} className="bg-white/70 dark:bg-gray-900/50 rounded-2xl p-3">
                  <div className="flex justify-between">
                    <span className="font-bold text-[13px]">{r.title}</span>
                    <span className="text-[10px] bg-green-100 text-green-700 rounded-full px-2 py-0.5">{HEALTH_TYPES[r.type]}</span>
                  </div>
                  {r.description && <p className="text-[12px] text-gray-500 mt-1">{r.description}</p>}
                  <div className="text-[10px] text-gray-400 mt-1">{r.date}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </PageShell>
  )
}
