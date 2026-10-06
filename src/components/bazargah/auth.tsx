'use client'

import { useEffect, useState } from 'react'
import { Phone, ShieldCheck, ChevronLeft, Timer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from '@/components/ui/input-otp'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageShell } from '@/components/bazargah/shared'
import { useStore } from '@/lib/store'
import { api, faNum } from '@/lib/api'
import { PROVINCES, CITIES } from '@/lib/api'
import { toast } from '@/hooks/use-toast'

export function AuthView() {
  const { setAuth, back, resetTo, updateUser } = useStore()
  const [step, setStep] = useState<'PHONE' | 'OTP' | 'PROFILE'>('PHONE')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState({ firstName: '', lastName: '', province: '', city: '' })
  const [pendingUser, setPendingUser] = useState<Record<string, unknown> | null>(null)
  const [demoCode, setDemoCode] = useState('')
  const [resendIn, setResendIn] = useState(0)
  const [expiresIn, setExpiresIn] = useState(0)

  /** شمارنده ثانیه‌ای برای resend و انقضا — سبک و همیشه فعال */
  useEffect(() => {
    const t = setInterval(() => {
      setResendIn(v => (v > 0 ? v - 1 : 0))
      setExpiresIn(v => (v > 0 ? v - 1 : 0))
    }, 1000)
    return () => clearInterval(t)
  }, [])

  const mm = Math.floor(expiresIn / 60)
  const ss = String(expiresIn % 60).padStart(2, '0')
  const codeExpired = expiresIn === 0 && step === 'OTP'

  async function requestOTP() {
    if (!/^09\d{9}$/.test(phone)) {
      toast({ title: 'شماره موبایل معتبر نیست (مثال: 09123456789)', variant: 'destructive' })
      return
    }
    setLoading(true)
    try {
      const res = await api('/api/auth/request-otp', {
        method: 'POST',
        body: JSON.stringify({ phone }),
      })
      setStep('OTP')
      setCode('')
      setDemoCode(res.demoCode || '')
      setResendIn(60)
      setExpiresIn(120)
      toast({
        title: 'کد تأیید ارسال شد',
        description: res.demoCode ? `کد دمو: ${res.demoCode}` : undefined,
      })
    } catch (e) {
      toast({ title: (e as Error).message, variant: 'destructive' })
    }
    setLoading(false)
  }

  async function verifyOTP() {
    if (code.length !== 5) {
      toast({ title: 'کد ۵ رقمی را وارد کنید', variant: 'destructive' })
      return
    }
    setLoading(true)
    try {
      const res = await api('/api/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ phone, code }),
      })
      setAuth(res.token, res.user)
      if (res.isNew || !res.user.firstName) {
        setPendingUser(res.user)
        setStep('PROFILE')
      } else {
        toast({ title: 'خوش آمدید! 🌿' })
        resetTo('home')
      }
    } catch (e) {
      toast({ title: (e as Error).message, variant: 'destructive' })
    }
    setLoading(false)
  }

  async function completeProfile() {
    if (!profile.firstName || !profile.province || !profile.city) {
      toast({ title: 'نام، استان و شهر الزامی است', variant: 'destructive' })
      return
    }
    setLoading(true)
    try {
      const res = await api('/api/auth/me', {
        method: 'PUT',
        body: JSON.stringify(profile),
      })
      updateUser(res.user)
      toast({ title: 'حساب شما کامل شد! 🎉' })
      resetTo('home')
    } catch (e) {
      toast({ title: (e as Error).message, variant: 'destructive' })
    }
    setLoading(false)
  }

  return (
    <PageShell image="/images/farm.jpg" className="flex flex-col">
      <div className="flex-1 flex flex-col justify-center max-w-md w-full mx-auto px-6 pb-24">
        {/* لوگو */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-b from-green-600 to-green-800 flex items-center justify-center text-4xl shadow-xl mb-4">
            🌿
          </div>
          <h1 className="text-2xl font-extrabold text-green-950 dark:text-green-100">بازارگاه</h1>
          <p className="text-sm text-gray-500 mt-1.5">
            {step === 'PHONE' && 'ورود یا ثبت‌نام با شماره موبایل'}
            {step === 'OTP' && 'کد ۵ رقمی پیامک‌شده را وارد کنید'}
            {step === 'PROFILE' && 'پروفایل خود را تکمیل کنید'}
          </p>
        </div>

        {step === 'PHONE' && (
          <div className="glass-card rounded-3xl p-6 space-y-4 animate-fade-up">
            <div className="relative">
              <Phone className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-green-600" />
              <Input
                dir="ltr"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, '').slice(0, 11))}
                placeholder="09xxxxxxxxx"
                className="pr-11 h-12 rounded-2xl text-left text-lg tracking-wider bg-white/90"
                inputMode="numeric"
                aria-label="شماره موبایل"
              />
            </div>
            <Button
              onClick={requestOTP}
              disabled={loading}
              className="w-full h-12 rounded-2xl bg-green-700 hover:bg-green-800 text-base font-bold"
            >
              {loading ? 'در حال ارسال...' : 'دریافت کد تأیید'}
            </Button>
            <p className="text-[11px] text-gray-400 text-center leading-relaxed">
              با ورود، قوانین و حریم خصوصی بازارگاه را می‌پذیرید
            </p>
          </div>
        )}

        {step === 'OTP' && (
          <div className="glass-card rounded-3xl p-6 space-y-5 animate-fade-up">
            {/* کد آزمایشی — تا وقتی SMS واقعی وصل نشده، همیشه در صفحه دیده شود (نه فقط toast) */}
            {demoCode && (
              <div className={`rounded-2xl p-3 text-center border ${codeExpired ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' : 'bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-800'}`}>
                {codeExpired ? (
                  <div className="text-[13px] font-bold text-red-700 dark:text-red-300">کد منقضی شد — دوباره ارسال کنید</div>
                ) : (
                  <>
                    <div className="text-[11px] text-gray-500 mb-1">کد آزمایشی (پیامک واقعی فعال نیست):</div>
                    <div dir="ltr" className="text-2xl font-extrabold tracking-[0.35em] text-green-800 dark:text-green-300">{faNum(demoCode)}</div>
                  </>
                )}
              </div>
            )}
            <div dir="ltr" className="flex justify-center">
              <InputOTP maxLength={5} value={code} onChange={setCode} disabled={codeExpired}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            {expiresIn > 0 && (
              <div className="flex items-center justify-center gap-1.5 text-[12px] text-gray-500">
                <Timer className="w-3.5 h-3.5" />
                اعتبار کد: {faNum(String(mm))}:{faNum(ss)}
              </div>
            )}
            <Button
              onClick={verifyOTP}
              disabled={loading || codeExpired}
              className="w-full h-12 rounded-2xl bg-green-700 hover:bg-green-800 text-base font-bold"
            >
              {loading ? 'در حال بررسی...' : 'تأیید و ورود'}
            </Button>
            <div className="flex items-center justify-between text-sm">
              <button
                onClick={async () => {
                  if (resendIn > 0) return
                  setCode('')
                  await requestOTP()
                }}
                disabled={resendIn > 0 || loading}
                className={`font-medium ${resendIn > 0 ? 'text-gray-400' : 'text-green-700 hover:text-green-800'}`}
              >
                {resendIn > 0 ? `ارسال مجدد تا ${faNum(String(resendIn))} ثانیه` : 'ارسال مجدد کد'}
              </button>
              <button
                onClick={() => { setStep('PHONE'); setCode(''); setDemoCode(''); setExpiresIn(0); setResendIn(0) }}
                className="text-green-700 hover:text-green-800 flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                تغییر شماره
              </button>
            </div>
          </div>
        )}

        {step === 'PROFILE' && (
          <div className="glass-card rounded-3xl p-6 space-y-4 animate-fade-up">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">نام *</label>
                <Input value={profile.firstName} onChange={(e) => setProfile(p => ({ ...p, firstName: e.target.value }))} className="h-11 rounded-2xl" placeholder="نام" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">نام خانوادگی</label>
                <Input value={profile.lastName} onChange={(e) => setProfile(p => ({ ...p, lastName: e.target.value }))} className="h-11 rounded-2xl" placeholder="نام خانوادگی" />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">استان *</label>
              <Select value={profile.province} onValueChange={(v) => setProfile(p => ({ ...p, province: v, city: '' }))}>
                <SelectTrigger className="h-11 rounded-2xl"><SelectValue placeholder="انتخاب استان" /></SelectTrigger>
                <SelectContent className="max-h-64">
                  {PROVINCES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">شهر *</label>
              <Select value={profile.city} onValueChange={(v) => setProfile(p => ({ ...p, city: v }))}>
                <SelectTrigger className="h-11 rounded-2xl"><SelectValue placeholder="انتخاب شهر" /></SelectTrigger>
                <SelectContent className="max-h-64">
                  {(CITIES[profile.province] || [profile.province || '—']).map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={completeProfile}
              disabled={loading}
              className="w-full h-12 rounded-2xl bg-green-700 hover:bg-green-800 text-base font-bold"
            >
              {loading ? '...' : 'تکمیل ثبت‌نام'}
            </Button>
          </div>
        )}

        <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-gray-400">
          <ShieldCheck className="w-3.5 h-3.5" />
          اطلاعات شما محرمانه و امن است
        </div>
      </div>
    </PageShell>
  )
}
