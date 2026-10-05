'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Send, Bot, AlertTriangle, Sparkles, ShieldCheck, PhoneCall, RotateCcw, Signal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageShell, useRequireAuth } from '@/components/bazargah/shared'
import { MarkdownText, faTime, CopyBtn } from '@/components/bazargah/chat-ui'
import { useStore } from '@/lib/store'
import { api } from '@/lib/api'
import { toast } from '@/hooks/use-toast'

interface Msg {
  role: 'user' | 'assistant'
  content: string
  at: number
  fallback?: boolean
}

const SUGGESTIONS = [
  { icon: '🐄', text: 'گاو من دیروز بی‌اشتهاست و شیرش کم شده، چه کنم؟' },
  { icon: '🐑', text: 'گوسفندم اسهال خونی دارد، فوریت چیست؟' },
  { icon: '🐔', text: 'علائم کمبود کلسیم در مرغ تخم‌گذار چیست؟' },
  { icon: '💉', text: 'برنامه واکسیناسیون گوساله شیرخوار چگونه است؟' },
]

/** آواتار هوش مصنوعی با نشانگر آنلاین */
function AIAvatar({ size = 'w-9 h-9', icon = 'w-5 h-5' }: { size?: string; icon?: string }) {
  return (
    <div className="relative shrink-0">
      <div className={`${size} rounded-2xl bg-gradient-to-br from-green-500 via-emerald-600 to-green-800 flex items-center justify-center shadow-lg shadow-green-900/20 ring-2 ring-white/70 dark:ring-green-900/60`}>
        <Bot className={`${icon} text-white`} />
      </div>
      <span className="absolute -bottom-0.5 -left-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-white dark:border-gray-900 animate-pulse" />
    </div>
  )
}

export function AIVetView() {
  const checked = useRequireAuth()
  const navigate = useStore(s => s.navigate)
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [usage, setUsage] = useState<{ used: number; limit: number; remaining: number } | null>(null)
  const [limitReached, setLimitReached] = useState(false)
  const [lastError, setLastError] = useState<{ message: string; retry: string } | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const nearBottomRef = useRef(true)

  // اسکرول هوشمند: فقط وقتی کاربر نزدیک پایین است دنبال شود
  const onScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    nearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 140
  }, [])

  useEffect(() => {
    if (nearBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, sending])

  // ارتفاع خودکار textarea
  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }, [input])

  async function send(text?: string) {
    const content = (text ?? input).trim()
    if (!content || sending) return
    setInput('')
    setLastError(null)
    const stamped: Msg[] = [...messages, { role: 'user', content, at: Date.now() }]
    setMessages(stamped)
    setSending(true)
    nearBottomRef.current = true

    try {
      const res = await api('/api/ai/vet', {
        method: 'POST',
        body: JSON.stringify({ messages: stamped.map(({ role, content: c }) => ({ role, content: c })) }),
      })
      setMessages([...stamped, { role: 'assistant', content: res.reply, at: Date.now(), fallback: !!res.fallback }])
      setUsage(res.usage)
      setLimitReached(false)
    } catch (e) {
      const err = e as Error & { data?: { limitReached?: boolean } }
      if (err.data?.limitReached) {
        setLimitReached(true)
      } else {
        setLastError({ message: err.message || 'ارتباط با دستیار هوشمند برقرار نشد', retry: content })
        toast({ title: err.message, variant: 'destructive' })
      }
    }
    setSending(false)
    inputRef.current?.focus()
  }

  if (!checked) return <PageShell image="/images/vet.jpg" />

  const quotaPct = usage ? Math.min(Math.round((usage.used / Math.max(usage.limit, 1)) * 100), 100) : 0

  return (
    <PageShell image="/images/vet.jpg" className="flex flex-col h-dvh lg:h-[calc(100dvh-4rem)]">
      {/* ── هدر گفتگو با آواتار و وضعیت ── */}
      <header className="hero-header sticky top-0 lg:top-16 z-40 text-white" style={{ '--bg-image': 'url(/images/vet.jpg)' } as React.CSSProperties}>
        <div className="relative z-10 flex items-center gap-3 px-4 lg:px-8 pt-[max(0.9rem,env(safe-area-inset-top))] pb-3 max-w-7xl mx-auto">
          <button
            onClick={() => useStore.getState().back()}
            aria-label="بازگشت"
            className="shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 transition-colors"
          >
            <Send className="w-5 h-5 rotate-180 hidden" />
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
          </button>
          <AIAvatar />
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold flex items-center gap-1.5">
              دستیار هوشمند دامپزشکی
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-medium bg-white/15 rounded-full px-2 py-0.5">
                <Signal className="w-3 h-3 text-green-300" /> آنلاین ۲۴ ساعته
              </span>
            </h1>
            <p className="text-[11px] text-green-100/80 truncate">
              {usage ? `${usage.remaining} پیام رایگان باقی مانده برای امروز` : 'پاسخ آموزشی فوری برای دام، طیور و حیوانات خانگی'}
            </p>
          </div>
          <button
            onClick={() => navigate('vets')}
            className="text-[11px] bg-white/15 hover:bg-white/25 rounded-full px-3 py-2 whitespace-nowrap flex items-center gap-1.5 transition-colors"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            رزرو دامپزشک
          </button>
        </div>
        {/* نوار سهمیه پیام */}
        {usage && usage.limit < 100 && (
          <div className="relative z-10 px-4 lg:px-8 pb-2 max-w-7xl mx-auto">
            <div className="h-1 rounded-full bg-white/15 overflow-hidden max-w-3xl mx-auto">
              <div
                className="h-full rounded-full bg-gradient-to-l from-green-300 to-emerald-400 transition-all duration-500"
                style={{ width: `${quotaPct}%` }}
              />
            </div>
          </div>
        )}
      </header>

      {/* ── محتوای گفتگو ── */}
      <div ref={scrollRef} onScroll={onScroll} className="flex-1 overflow-y-auto max-w-3xl w-full mx-auto px-4 py-5 pb-36">
        {/* حالت خالی — هیرو */}
        {messages.length === 0 && !sending && (
          <div className="animate-fade-up">
            <div className="text-center pt-4 pb-2">
              <div className="w-24 h-24 mx-auto rounded-[2rem] bg-gradient-to-br from-green-500 via-emerald-600 to-green-800 flex items-center justify-center shadow-2xl shadow-green-900/30 mb-5 ring-4 ring-white/60 dark:ring-green-900/40">
                <Bot className="w-12 h-12 text-white" />
              </div>
              <h2 className="font-extrabold text-xl text-green-950 dark:text-green-100">سلام! من دستیار دامپزشکی بازارگاه هستم 🩺</h2>
              <p className="text-[13px] text-gray-500 mt-2.5 max-w-sm mx-auto leading-relaxed">
                علائم حیوانتان را توضیح دهید تا راهنمایی آموزشی فوری بگیرید.
                پاسخ من جایگزین معاینه دامپزشک نیست.
              </p>
            </div>

            {/* تخصص‌ها */}
            <div className="flex items-center justify-center gap-2 mt-5 flex-wrap">
              {['🐄 دام سنگین', '🐑 دام سبک', '🐔 طیور', '🐕 حیوانات خانگی'].map((s) => (
                <span key={s} className="glass-card rounded-full px-3.5 py-1.5 text-[12px] font-medium text-green-800 dark:text-green-200">
                  {s}
                </span>
              ))}
            </div>

            {/* نمونه سؤال‌ها */}
            <p className="text-center text-[11px] text-gray-400 mt-6 mb-2.5 flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-green-500" />
              برای شروع یکی را انتخاب کنید یا بنویسید
            </p>
            <div className="grid sm:grid-cols-2 gap-2.5 max-w-xl mx-auto">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.text}
                  onClick={() => send(s.text)}
                  className="glass-card rounded-2xl px-4 py-3.5 text-right text-[13px] leading-6 hover:bg-green-50 dark:hover:bg-green-900/30 hover:shadow-md transition-all group"
                >
                  <span className="text-xl block mb-1.5 group-hover:scale-110 transition-transform origin-right inline-block">{s.icon}</span>
                  <span className="text-gray-700 dark:text-gray-200">{s.text}</span>
                </button>
              ))}
            </div>

            {/* نشان اعتماد */}
            <div className="flex items-center justify-center gap-1.5 mt-7 text-[11px] text-gray-400">
              <ShieldCheck className="w-4 h-4 text-green-500" />
              پاسخ‌ها آموزشی است — موارد اورژانسی به دامپزشک واقعی ارجاع می‌شود
            </div>
          </div>
        )}

        {/* پیام‌ها */}
        {messages.map((m, i) => {
          const mine = m.role === 'user'
          return (
            <div key={i} className={`flex gap-2.5 mb-5 items-end ${mine ? 'justify-end' : 'justify-start'} animate-fade-up`}>
              {!mine && <AIAvatar />}
              <div className={`max-w-[82%] sm:max-w-[75%] ${mine ? 'items-end' : 'items-start'} flex flex-col`}>
                <div
                  className={
                    mine
                      ? 'bg-gradient-to-l from-green-700 to-green-600 text-white rounded-3xl rounded-bl-md px-4 py-3 text-[14px] leading-7 shadow-lg shadow-green-900/15'
                      : 'glass-card text-gray-800 dark:text-gray-100 rounded-3xl rounded-br-md px-4 py-3 text-[14px] shadow-sm'
                  }
                >
                  {mine ? (
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  ) : (
                    <MarkdownText text={m.content} />
                  )}
                </div>
                <div className={`flex items-center gap-2 mt-1.5 px-1.5 ${mine ? 'flex-row-reverse' : ''}`}>
                  <span className={`text-[10px] ${mine ? 'text-green-700/60' : 'text-gray-400'}`}>{faTime(m.at)}</span>
                  {m.fallback && (
                    <span className="text-[9px] bg-amber-100 text-amber-700 rounded-full px-2 py-0.5 font-medium">پاسخ آفلاین</span>
                  )}
                  {!mine && <CopyBtn text={m.content} />}
                </div>
              </div>
            </div>
          )
        })}

        {/* در حال نوشتن */}
        {sending && (
          <div className="flex gap-2.5 mb-5 items-end animate-fade-up">
            <AIAvatar />
            <div className="glass-card rounded-3xl rounded-br-md px-4 py-3.5 flex items-center gap-2.5 shadow-sm">
              <span className="flex gap-1">
                <span className="typing-dot w-2 h-2 rounded-full bg-green-600 inline-block" />
                <span className="typing-dot w-2 h-2 rounded-full bg-green-600 inline-block" />
                <span className="typing-dot w-2 h-2 rounded-full bg-green-600 inline-block" />
              </span>
              <span className="text-[11px] text-gray-400">در حال بررسی علائم...</span>
            </div>
          </div>
        )}

        {/* خطای ارسال با تلاش مجدد */}
        {lastError && (
          <div className="flex gap-2.5 mb-5 items-end animate-fade-up">
            <AIAvatar />
            <div className="max-w-[82%] glass-card rounded-3xl rounded-br-md px-4 py-3.5 shadow-sm border border-red-200 dark:border-red-900/50">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                </div>
                <div className="flex-1">
                  <p className="text-[13px] text-gray-700 dark:text-gray-200 leading-6">{lastError.message}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => send(lastError.retry)}
                    className="mt-2.5 h-8 rounded-xl border-green-300 text-green-700 hover:bg-green-50 text-[12px]"
                  >
                    <RotateCcw className="w-3.5 h-3.5 ml-1" />
                    تلاش مجدد
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── نوار ورودی ثابت ── */}
      <div className="fixed bottom-[70px] lg:bottom-4 inset-x-0 z-40 px-4 pb-2">
        <div className="max-w-3xl mx-auto">
          {limitReached && (
            <div className="glass-card rounded-2xl p-3 mb-2 flex items-center gap-3 bg-amber-50/90 dark:bg-amber-900/30">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <div className="flex-1 text-[12px] text-amber-900 dark:text-amber-200">
                سهمیه امروز تمام شد. با ارتقای اشتراک، پیام‌های AI بیشتری دریافت کنید.
              </div>
              <Button size="sm" onClick={() => navigate('subscription')} className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white shrink-0">
                ارتقا
              </Button>
            </div>
          )}
          <div className="glass-card rounded-[1.6rem] p-2 flex items-end gap-2 shadow-xl shadow-green-900/10">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  send()
                }
              }}
              placeholder="علائم حیوان را توضیح دهید..."
              rows={1}
              className="flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-gray-400 resize-none max-h-[120px] leading-6"
              aria-label="پیام به AI دامپزشک"
            />
            <Button
              onClick={() => send()}
              disabled={sending || !input.trim()}
              size="icon"
              className="rounded-full w-11 h-11 bg-gradient-to-br from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 shadow-md shrink-0 transition-all active:scale-95"
              aria-label="ارسال"
            >
              <Send className="w-4 h-4 -scale-x-100" />
            </Button>
          </div>
          <p className="text-center text-[10px] text-gray-400 mt-1.5 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            پاسخ‌های AI آموزشی است و تشخیص قطعی نیست — Enter برای ارسال
          </p>
        </div>
      </div>
    </PageShell>
  )
}
