'use client'

import { useEffect, useState } from 'react'
import { BadgeCheck, Star, CalendarClock, Stethoscope } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PageHeader, PageShell, LoadingView, EmptyState, useRequireAuth } from '@/components/bazargah/shared'
import { useStore } from '@/lib/store'
import { api, faNum, faPrice } from '@/lib/api'
import { toast } from '@/hooks/use-toast'

interface Vet {
  id: string; name: string; specialty: string; bio: string; province: string; city: string
  rating: number; reviewCount: number; pricePerSession: number; isVerified: boolean
  services: string; availableSlots: string; commissionRate: number
}

export function VetsView() {
  const checked = useRequireAuth()
  const [vets, setVets] = useState<Vet[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Vet | null>(null)

  useEffect(() => {
    api('/api/vets').then(res => setVets(res.vets)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (!checked) return <PageShell image="/images/vet.jpg" />

  return (
    <PageShell image="/images/vet.jpg">
      <PageHeader title="دامپزشکان" subtitle="متخصصان تأییدشده بازارگاه" />
      <div className="max-w-3xl mx-auto px-4 pb-28">
        {loading ? <LoadingView /> : vets.length === 0 ? (
          <EmptyState icon="🩺" title="دامپزشکی یافت نشد" />
        ) : (
          <div className="space-y-3 mt-4">
            {vets.map((v) => (
              <div key={v.id} className="glass-card rounded-3xl p-4 animate-fade-up">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-green-700 text-white flex items-center justify-center text-2xl shrink-0">
                    <Stethoscope className="w-8 h-8" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold flex items-center gap-1.5">
                      {v.name}
                      {v.isVerified && <BadgeCheck className="w-4 h-4 text-blue-500" />}
                    </div>
                    <div className="text-[12px] text-gray-500 mt-0.5">{v.specialty} • {v.city}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="flex items-center gap-0.5 text-[12px] text-amber-600">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        {faNum(v.rating)} ({faNum(v.reviewCount)})
                      </span>
                      <span className="text-[12px] font-bold text-green-700">{faPrice(v.pricePerSession)}</span>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => setSelected(v)} className="rounded-xl bg-green-700 hover:bg-green-800 shrink-0">
                    رزرو
                  </Button>
                </div>
                <p className="text-[12px] text-gray-500 mt-3 leading-relaxed line-clamp-2">{v.bio}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <BookingDialog vet={selected} onClose={() => setSelected(null)} />
    </PageShell>
  )
}

function BookingDialog({ vet, onClose }: { vet: Vet | null; onClose: () => void }) {
  const navigate = useStore(s => s.navigate)
  const [slots, setSlots] = useState<string[]>([])
  const [slot, setSlot] = useState('')
  const [sessionType, setSessionType] = useState('CLINIC')
  const [submitting, setSubmitting] = useState(false)
  const [bookings, setBookings] = useState<Record<string, unknown>[]>([])

  useEffect(() => {
    if (!vet) return
    setSlots(JSON.parse(vet.availableSlots || '[]'))
    setSlot('')
    setSessionType('CLINIC')
    api('/api/vets/book').then(res => setBookings(res.bookings)).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vet?.id])

  async function book() {
    if (!vet || !slot) return
    setSubmitting(true)
    try {
      const res = await api('/api/vets/book', {
        method: 'POST',
        body: JSON.stringify({ vetId: vet.id, slot, sessionType }),
      })
      toast({
        title: 'نوبت رزرو شد ✅',
        description: `${vet.name} ساعت ${slot} — مبلغ ${res.booking.price.toLocaleString('fa-IR')} تومان از کیف پول کسر شد`,
      })
      onClose()
      navigate('profile')
    } catch (e) {
      toast({ title: (e as Error).message, variant: 'destructive' })
    }
    setSubmitting(false)
  }

  return (
    <Dialog open={!!vet} onOpenChange={() => onClose()}>
      <DialogContent className="rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-right">رزرو نوبت — {vet?.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {[
              { v: 'CLINIC', label: '🏥 کلینیک' },
              { v: 'CALL', label: '📞 تلفنی' },
              { v: 'VIDEO', label: '🎥 ویدیویی' },
            ].map((t) => (
              <button
                key={t.v}
                onClick={() => setSessionType(t.v)}
                className={`rounded-2xl py-2.5 text-[13px] font-medium transition-all ${sessionType === t.v ? 'bg-green-700 text-white shadow-md' : 'bg-green-50 text-green-900'}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-2 flex items-center gap-1.5">
              <CalendarClock className="w-3.5 h-3.5" /> زمان‌های آزاد
            </label>
            <div className="flex flex-wrap gap-2">
              {slots.map((s) => (
                <button
                  key={s}
                  onClick={() => setSlot(s)}
                  className={`px-4 py-2 rounded-xl text-[13px] font-bold transition-all ${slot === s ? 'bg-green-700 text-white' : 'bg-green-50 text-green-900 hover:bg-green-100'}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center bg-green-50 rounded-2xl p-3">
            <span className="text-sm">هزینه نوبت:</span>
            <span className="font-extrabold text-green-700">{faPrice(vet?.pricePerSession)}</span>
          </div>
          <p className="text-[11px] text-gray-400">پرداخت از کیف پول — معماری تماس صوتی و تصویری در نسخه‌های آینده فعال می‌شود</p>

          <Button onClick={book} disabled={!slot || submitting} className="w-full h-12 rounded-2xl bg-green-700 hover:bg-green-800 font-bold">
            {submitting ? 'در حال رزرو...' : 'تأیید و پرداخت از کیف پول'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
