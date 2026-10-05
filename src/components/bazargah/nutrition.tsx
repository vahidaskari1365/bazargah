'use client'

import { useEffect, useState } from 'react'
import { Calculator, Sparkles, Leaf, Wallet, Droplets } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageHeader, PageShell, LoadingView, useRequireAuth } from '@/components/bazargah/shared'
import { useStore } from '@/lib/store'
import { api, faNum, SPECIES_FA, GOALS, ENVIRONMENTS } from '@/lib/api'
import { toast } from '@/hooks/use-toast'

interface RationItem {
  foodId: string; name: string; kgPerDay: number; percentage: number
  proteinContribution: number; energyContribution: number; costPerDay: number
}
interface EngineOutput {
  animal: { speciesFa: string; weightKg: number; ageMonths: number; goalFa: string; environmentFa: string }
  requirements: { dryMatterKg: number; proteinPercent: number; proteinKg: number; energyMcal: number; fiberPercent: number; calciumG: number; phosphorusG: number; waterLiters: number }
  ration: RationItem[]
  totals: { dryMatterKg: number; proteinPercent: number; energyMcal: number; costPerDay: number; costPerMonth: number }
  balance: { proteinDiff: number; energyDiff: number; fiberDiff: number; status: string; warnings: string[] }
  version: string
}

export function NutritionView() {
  const checked = useRequireAuth()
  const user = useStore(s => s.user)
  const [animals, setAnimals] = useState<{ id: string; name: string; species: string; breed?: string; weight?: number; gender: string }[]>([])
  const [selectedAnimal, setSelectedAnimal] = useState('')
  const [form, setForm] = useState({
    species: 'COW', breed: '', ageMonths: '24', gender: 'FEMALE', weightKg: '500',
    goal: 'MAINTAIN', environment: 'FARM', tempC: '', milkLiters: '',
  })
  const [engine, setEngine] = useState<EngineOutput | null>(null)
  const [aiExplanation, setAiExplanation] = useState('')
  const [calculating, setCalculating] = useState(false)
  const [explaining, setExplaining] = useState(false)

  useEffect(() => {
    api('/api/animals').then(res => setAnimals(res.animals)).catch(() => {})
  }, [])

  function pickAnimal(id: string) {
    setSelectedAnimal(id)
    const a = animals.find(x => x.id === id)
    if (a) {
      setForm(f => ({
        ...f,
        species: a.species || f.species,
        breed: a.breed || '',
        weightKg: a.weight ? String(a.weight) : f.weightKg,
        gender: a.gender === 'MALE' ? 'MALE' : 'FEMALE',
      }))
    }
  }

  async function calculate() {
    const w = parseFloat(form.weightKg)
    if (!w || w <= 0) {
      toast({ title: 'وزن معتبر وارد کنید', variant: 'destructive' })
      return
    }
    setCalculating(true)
    setAiExplanation('')
    try {
      const res = await api('/api/nutrition/calculate', {
        method: 'POST',
        body: JSON.stringify({
          species: form.species,
          breed: form.breed,
          ageMonths: form.ageMonths,
          gender: form.gender,
          weightKg: w,
          goal: form.goal,
          environment: form.environment,
          tempC: form.tempC || undefined,
          milkLiters: form.milkLiters || undefined,
        }),
      })
      setEngine(res)
      toast({ title: 'جیره محاسبه شد ✅' })
    } catch (e) {
      toast({ title: (e as Error).message, variant: 'destructive' })
    }
    setCalculating(false)
  }

  async function explain() {
    if (!engine) return
    setExplaining(true)
    try {
      const res = await api('/api/ai/nutrition', {
        method: 'POST',
        body: JSON.stringify({ engineOutput: engine }),
      })
      setAiExplanation(res.explanation)
    } catch (e) {
      toast({ title: (e as Error).message, variant: 'destructive' })
    }
    setExplaining(false)
  }

  if (!checked) return <PageShell image="/images/feed.jpg" />

  return (
    <PageShell image="/images/feed.jpg">
      <PageHeader title="تغذیه هوشمند" subtitle="موتور علمی محاسبه جیره + توضیح AI" />

      <div className="max-w-3xl lg:max-w-4xl mx-auto px-4 lg:px-8 pb-28 lg:pb-12">
        {/* فرم ورودی */}
        <div className="glass-card rounded-3xl p-5 mt-4 animate-fade-up">
          <div className="flex items-center gap-2 mb-4">
            <Calculator className="w-5 h-5 text-green-700" />
            <h2 className="font-bold text-green-950 dark:text-green-100">مشخصات حیوان</h2>
          </div>

          {animals.length > 0 && (
            <div className="mb-4">
              <label className="text-xs text-gray-500 mb-1.5 block">انتخاب از حیوانات من</label>
              <Select value={selectedAnimal} onValueChange={pickAnimal}>
                <SelectTrigger className="h-11 rounded-2xl"><SelectValue placeholder="انتخاب حیوان (اختیاری)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">ورود دستی</SelectItem>
                  {animals.map(a => <SelectItem key={a.id} value={a.id}>{a.name} — {SPECIES_FA[a.species]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">گونه *</label>
              <Select value={form.species} onValueChange={(v) => setForm(f => ({ ...f, species: v }))}>
                <SelectTrigger className="h-11 rounded-2xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(SPECIES_FA).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">وزن (کیلو) *</label>
              <Input dir="ltr" value={form.weightKg} onChange={(e) => setForm(f => ({ ...f, weightKg: e.target.value.replace(/[^\d.]/g, '') }))} className="h-11 rounded-2xl text-left" inputMode="decimal" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">سن (ماه)</label>
              <Input dir="ltr" value={form.ageMonths} onChange={(e) => setForm(f => ({ ...f, ageMonths: e.target.value.replace(/[^\d]/g, '') }))} className="h-11 rounded-2xl text-left" inputMode="numeric" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">هدف تغذیه *</label>
              <Select value={form.goal} onValueChange={(v) => setForm(f => ({ ...f, goal: v }))}>
                <SelectTrigger className="h-11 rounded-2xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {GOALS.map(g => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">محیط نگهداری</label>
              <Select value={form.environment} onValueChange={(v) => setForm(f => ({ ...f, environment: v }))}>
                <SelectTrigger className="h-11 rounded-2xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ENVIRONMENTS.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">دما (°C) — اختیاری</label>
              <Input dir="ltr" value={form.tempC} onChange={(e) => setForm(f => ({ ...f, tempC: e.target.value.replace(/[^\d.-]/g, '') }))} className="h-11 rounded-2xl text-left" inputMode="decimal" placeholder="25" />
            </div>
            {form.goal === 'MILK' && (
              <div className="col-span-2 sm:col-span-1">
                <label className="text-xs text-gray-500 mb-1.5 block">شیر روزانه (لیتر)</label>
                <Input dir="ltr" value={form.milkLiters} onChange={(e) => setForm(f => ({ ...f, milkLiters: e.target.value.replace(/[^\d.]/g, '') }))} className="h-11 rounded-2xl text-left" inputMode="decimal" placeholder="30" />
              </div>
            )}
          </div>

          <Button onClick={calculate} disabled={calculating} className="w-full h-12 rounded-2xl bg-green-700 hover:bg-green-800 mt-5 font-bold">
            {calculating ? 'در حال محاسبه...' : 'محاسبه جیره علمی 🧮'}
          </Button>
        </div>

        {/* نتیجه */}
        {calculating && <LoadingView text="موتور تغذیه در حال محاسبه..." />}

        {engine && !calculating && (
          <>
            {/* نیازها */}
            <div className="glass-card rounded-3xl p-5 mt-4 animate-fade-up">
              <h3 className="font-bold mb-3 flex items-center gap-2">
                🎯 نیازهای روزانه — {engine.animal.speciesFa} {engine.animal.weightKg} کیلویی ({engine.animal.goalFa})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: 'ماده خشک', value: `${faNum(engine.requirements.dryMatterKg)} کیلو`, icon: <Leaf className="w-4 h-4" /> },
                  { label: 'پروتئین', value: `${faNum(engine.requirements.proteinPercent)}٪`, icon: '🥩' },
                  { label: 'انرژی', value: `${faNum(engine.requirements.energyMcal)} مگاکالری`, icon: '⚡' },
                  { label: 'آب', value: `${faNum(engine.requirements.waterLiters)} لیتر`, icon: <Droplets className="w-4 h-4" /> },
                  { label: 'کلسیم', value: `${faNum(engine.requirements.calciumG)} گرم`, icon: '🦴' },
                  { label: 'فسفر', value: `${faNum(engine.requirements.phosphorusG)} گرم`, icon: '🧪' },
                  { label: 'فیبر', value: `${faNum(engine.requirements.fiberPercent)}٪`, icon: '🌾' },
                  { label: 'هزینه روز', value: `${faNum(engine.totals.costPerDay.toLocaleString('en-US'))} ت`, icon: <Wallet className="w-4 h-4" /> },
                ].map((r) => (
                  <div key={r.label} className="bg-green-50 dark:bg-green-900/30 rounded-2xl p-3 text-center">
                    <div className="text-green-600 flex justify-center mb-1">{r.icon}</div>
                    <div className="font-extrabold text-[15px] text-green-900 dark:text-green-100">{r.value}</div>
                    <div className="text-[10px] text-gray-500 mt-0.5">{r.label}</div>
                  </div>
                ))}
              </div>
              <div className={`mt-3 rounded-2xl p-3 text-center text-[13px] font-bold ${engine.balance.status === 'BALANCED' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                {engine.balance.status === 'BALANCED' ? '✅ جیره متعادل است' : '⚠️ جیره نیاز به اصلاح دارد'} — انحراف پروتئین: {faNum(engine.balance.proteinDiff)}٪ | انرژی: {faNum(engine.balance.energyDiff)}٪
              </div>
            </div>

            {/* جیره */}
            <div className="glass-card rounded-3xl p-5 mt-4 animate-fade-up">
              <h3 className="font-bold mb-3">🌾 جیره پیشنهادی (موتور علمی {engine.version})</h3>
              <div className="space-y-2">
                {engine.ration.map((r) => (
                  <div key={r.foodId} className="flex items-center gap-3 bg-white/70 dark:bg-gray-900/50 rounded-2xl p-3">
                    <div className="flex-1">
                      <div className="font-bold text-[14px]">{r.name}</div>
                      <div className="text-[11px] text-gray-500">پروتئین: {faNum(r.proteinContribution)} کیلو | انرژی: {faNum(r.energyContribution)} مگاکالری</div>
                    </div>
                    <div className="text-center px-3">
                      <div className="font-extrabold text-green-700">{faNum(r.kgPerDay)} کیلو</div>
                      <div className="text-[10px] text-gray-400">{faNum(r.percentage)}٪ جیره</div>
                    </div>
                  </div>
                ))}
              </div>
              {engine.balance.warnings.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {engine.balance.warnings.map((w, i) => (
                    <div key={i} className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-3 py-2 text-[12px]">
                      ⚠️ {w}
                    </div>
                  ))}
                </div>
              )}
              <div className="divider-line my-4" />
              <div className="flex justify-between text-sm">
                <span className="font-bold">هزینه ماهانه:</span>
                <span className="font-extrabold text-green-700">{faNum(engine.totals.costPerMonth.toLocaleString('en-US'))} تومان</span>
              </div>
            </div>

            {/* توضیح AI */}
            <div className="glass-card rounded-3xl p-5 mt-4 animate-fade-up">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-green-600" />
                  توضیح هوش مصنوعی
                </h3>
                {!aiExplanation && (
                  <Button size="sm" onClick={explain} disabled={explaining} className="rounded-xl bg-green-700 hover:bg-green-800 text-[12px]">
                    {explaining ? '...' : 'توضیح بده ✨'}
                  </Button>
                )}
              </div>
              {explaining ? (
                <div className="flex gap-2 items-center py-6 justify-center">
                  <span className="typing-dot w-2 h-2 rounded-full bg-green-600 inline-block" />
                  <span className="typing-dot w-2 h-2 rounded-full bg-green-600 inline-block" />
                  <span className="typing-dot w-2 h-2 rounded-full bg-green-600 inline-block" />
                  <span className="text-sm text-gray-500 mr-2">AI در حال تحلیل جیره...</span>
                </div>
              ) : aiExplanation ? (
                <div className="text-[14px] leading-8 text-gray-700 dark:text-gray-200 whitespace-pre-wrap">{aiExplanation}</div>
              ) : (
                <p className="text-[13px] text-gray-500 leading-relaxed">
                  محاسبات عددی انجام شد. برای دریافت تحلیل کامل، نکات اجرایی و توصیه‌های اصلاحی به زبان ساده، دکمه «توضیح بده» را بزنید.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </PageShell>
  )
}
