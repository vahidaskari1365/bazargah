'use client'

import { useEffect, useState } from 'react'
import { Check, ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageHeader, PageShell, useRequireAuth } from '@/components/bazargah/shared'
import { useStore } from '@/lib/store'
import { api, PROVINCES } from '@/lib/api'
import { toast } from '@/hooks/use-toast'

interface Category { id: string; slug: string; name: string; type: string; attributes: string }

export function CreateAdView() {
  const navigate = useStore(s => s.navigate)
  const user = useStore(s => s.user)
  const checked = useRequireAuth()
  const [step, setStep] = useState(1)
  const [categories, setCategories] = useState<Category[]>([])
  const [form, setForm] = useState({
    categoryId: '', title: '', description: '', price: '',
    province: user?.province || 'تهران', city: user?.city || 'تهران',
    negotiable: false,
    breed: '', age: '', weight: '', gender: '',
  })
  const [image, setImage] = useState('/images/cow.jpg')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    api('/api/categories').then(res => setCategories(res.categories)).catch(() => {})
  }, [])

  const cat = categories.find(c => c.id === form.categoryId)

  async function submit() {
    if (!form.title || !form.price || !form.categoryId) {
      toast({ title: 'عنوان، دسته و قیمت الزامی است', variant: 'destructive' })
      return
    }
    setSubmitting(true)
    try {
      const attrs: Record<string, string> = {}
      if (form.breed) attrs.breed = form.breed
      if (form.age) attrs.age = form.age
      if (form.weight) attrs.weight = form.weight
      if (form.gender) attrs.gender = form.gender
      const res = await api('/api/ads', {
        method: 'POST',
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          price: form.price.replace(/[^\d]/g, ''),
          categoryId: form.categoryId,
          province: form.province,
          city: form.city,
          negotiable: form.negotiable,
          images: [image],
          attributes: attrs,
        }),
      })
      toast({ title: 'آگهی منتشر شد! 🎉', description: 'پس از تأیید کارشناسان نمایش داده می‌شود' })
      navigate('ad-detail', { id: res.ad.id })
    } catch (e) {
      toast({ title: (e as Error).message, variant: 'destructive' })
    }
    setSubmitting(false)
  }

  if (!checked) return <PageShell image="/images/farm.jpg" />

  const steps = ['دسته', 'اطلاعات', 'عکس', 'انتشار']

  return (
    <PageShell image="/images/farm.jpg">
      <PageHeader title="ثبت آگهی جدید" subtitle={`مرحله ${step} از 4`} />

      <div className="max-w-lg mx-auto px-4 pb-28">
        {/* Stepper */}
        <div className="flex items-center gap-1 mt-4 mb-6">
          {steps.map((s, i) => (
            <div key={s} className="flex-1 flex items-center gap-1">
              <div className={`flex-1 flex items-center gap-1.5 ${i < step ? 'text-green-700' : i === step - 1 ? 'text-green-700 font-bold' : 'text-gray-400'}`}>
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i + 1 < step ? 'bg-green-700 text-white' : i + 1 === step ? 'bg-green-200 text-green-800' : 'bg-gray-100 text-gray-400'}`}>
                  {i + 1 < step ? <Check className="w-4 h-4" /> : i + 1}
                </span>
                <span className="text-[11px] hidden sm:inline">{s}</span>
              </div>
              {i < steps.length - 1 && <div className={`h-0.5 flex-1 rounded ${i + 1 < step ? 'bg-green-600' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        {/* مرحله 1: دسته */}
        {step === 1 && (
          <div className="glass-card rounded-3xl p-5 animate-fade-up">
            <h3 className="font-bold mb-3">دسته‌بندی آگهی را انتخاب کنید</h3>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setForm(f => ({ ...f, categoryId: c.id }))}
                  className={`p-4 rounded-2xl text-right transition-all border-2 ${form.categoryId === c.id ? 'border-green-600 bg-green-50 dark:bg-green-900/40' : 'border-transparent bg-white/70 dark:bg-gray-900/50'}`}
                >
                  <div className="font-bold text-sm">{c.name}</div>
                </button>
              ))}
            </div>
            <Button
              disabled={!form.categoryId}
              onClick={() => setStep(2)}
              className="w-full h-12 rounded-2xl bg-green-700 hover:bg-green-800 mt-5 font-bold"
            >
              مرحله بعد
            </Button>
          </div>
        )}

        {/* مرحله 2: اطلاعات */}
        {step === 2 && (
          <div className="glass-card rounded-3xl p-5 space-y-4 animate-fade-up">
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">عنوان آگهی *</label>
              <Input value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} placeholder="مثال: گاو شیری هلشتاین با تولید ۳۵ لیتر" className="h-11 rounded-2xl" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">قیمت (تومان) *</label>
                <Input
                  dir="ltr"
                  value={form.price}
                  onChange={(e) => setForm(f => ({ ...f, price: e.target.value.replace(/[^\d]/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',') }))}
                  placeholder="38,000,000"
                  className="h-11 rounded-2xl text-left"
                  inputMode="numeric"
                />
              </div>
              <div className="flex items-end gap-2 pb-1">
                <Switch checked={form.negotiable} onCheckedChange={(v) => setForm(f => ({ ...f, negotiable: v }))} id="negotiable" />
                <label htmlFor="negotiable" className="text-sm">قابل مذاکره</label>
              </div>
            </div>

            {/* ویژگی‌های دام */}
            {['live-animal', 'sheep-goat', 'calf', 'poultry', 'horse', 'pets'].includes(cat?.slug || '') && (
              <>
                <div className="divider-line" />
                <p className="text-xs font-bold text-green-800">مشخصات دام</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1.5 block">نژاد</label>
                    <Input value={form.breed} onChange={(e) => setForm(f => ({ ...f, breed: e.target.value }))} placeholder="هلشتاین" className="h-11 rounded-2xl" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1.5 block">سن (ماه)</label>
                    <Input dir="ltr" value={form.age} onChange={(e) => setForm(f => ({ ...f, age: e.target.value.replace(/[^\d]/g, '') }))} className="h-11 rounded-2xl text-left" inputMode="numeric" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1.5 block">وزن (کیلو)</label>
                    <Input dir="ltr" value={form.weight} onChange={(e) => setForm(f => ({ ...f, weight: e.target.value.replace(/[^\d]/g, '') }))} className="h-11 rounded-2xl text-left" inputMode="numeric" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1.5 block">جنسیت</label>
                    <Select value={form.gender} onValueChange={(v) => setForm(f => ({ ...f, gender: v }))}>
                      <SelectTrigger className="h-11 rounded-2xl"><SelectValue placeholder="انتخاب" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ماده">ماده</SelectItem>
                        <SelectItem value="نر">نر</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}

            <div className="divider-line" />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">استان</label>
                <Select value={form.province} onValueChange={(v) => setForm(f => ({ ...f, province: v }))}>
                  <SelectTrigger className="h-11 rounded-2xl"><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-60">
                    {PROVINCES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">شهر</label>
                <Input value={form.city} onChange={(e) => setForm(f => ({ ...f, city: e.target.value }))} className="h-11 rounded-2xl" />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">توضیحات</label>
              <Textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} placeholder="توضیحات کامل آگهی، وضعیت سلامت، سابقه و..." rows={4} className="rounded-2xl" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)} className="h-12 rounded-2xl">بازگشت</Button>
              <Button onClick={() => setStep(3)} className="flex-1 h-12 rounded-2xl bg-green-700 hover:bg-green-800 font-bold">مرحله بعد</Button>
            </div>
          </div>
        )}

        {/* مرحله 3: عکس */}
        {step === 3 && (
          <div className="glass-card rounded-3xl p-5 animate-fade-up">
            <h3 className="font-bold mb-2">تصویر آگهی</h3>
            <p className="text-xs text-gray-500 mb-4">در نسخه وب از تصاویر آماده سیستم استفاده می‌شود (در اپ اندروید: دوربین و گالری)</p>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {['/images/cow.jpg', '/images/sheep.jpg', '/images/chicken.jpg', '/images/goat.jpg', '/images/calf.jpg', '/images/horse.jpg', '/images/dog.jpg', '/images/feed.jpg', '/images/farm.jpg'].map((img) => (
                <button
                  key={img}
                  onClick={() => setImage(img)}
                  className={`rounded-2xl overflow-hidden border-2 transition-all ${image === img ? 'border-green-600 scale-[1.02]' : 'border-transparent'}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt="تصویر آگهی" className="w-full h-20 object-cover" />
                </button>
              ))}
            </div>
            {/* پیش‌نمایش */}
            <div className="rounded-3xl overflow-hidden h-48 mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image} alt="پیش‌نمایش" className="w-full h-full object-cover" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)} className="h-12 rounded-2xl">بازگشت</Button>
              <Button onClick={() => setStep(4)} className="flex-1 h-12 rounded-2xl bg-green-700 hover:bg-green-800 font-bold">مرحله بعد</Button>
            </div>
          </div>
        )}

        {/* مرحله 4: انتشار */}
        {step === 4 && (
          <div className="glass-card rounded-3xl p-5 animate-fade-up">
            <h3 className="font-bold mb-4">پیش‌نمایش نهایی</h3>
            <div className="rounded-3xl overflow-hidden glass-card mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image} alt={form.title} className="w-full h-40 object-cover" />
              <div className="p-4">
                <div className="font-bold">{form.title}</div>
                <div className="text-green-700 font-extrabold mt-1">{form.price || 0} تومان</div>
                <div className="text-xs text-gray-500 mt-1">{form.city}، {form.province}</div>
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-[12px] text-amber-800 leading-relaxed mb-4">
              ⏱ مدت استاندارد نمایش: ۳۰ روز • امکان تمدید و نردبان از بخش «آگهی‌های من» • آگهی پس از تأیید کارشناس منتشر می‌شود
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(3)} className="h-12 rounded-2xl">بازگشت</Button>
              <Button onClick={submit} disabled={submitting} className="flex-1 h-12 rounded-2xl bg-green-700 hover:bg-green-800 font-bold">
                {submitting ? 'در حال انتشار...' : 'انتشار آگهی'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  )
}
