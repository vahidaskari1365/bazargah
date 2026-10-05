'use client'

import { useEffect, useRef, useState } from 'react'
import { Send, Bot, AlertTriangle, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader, PageShell, useRequireAuth } from '@/components/bazargah/shared'
import { useStore } from '@/lib/store'
import { api } from '@/lib/api'
import { toast } from '@/hooks/use-toast'

interface Msg { role: 'user' | 'assistant'; content: string }

const SUGGESTIONS = [
  'گاو من دیروز بی‌اشتهاست و شیرش کم شده، چه کنم؟',
  'گوسفندم اسهال خونی دارد، فوریت چیست؟',
  'علائم کمبود کلسیم در مرغ تخم‌گذار چیست؟',
  'برنامه واکسیناسیون گوساله شیرخوار چگونه است؟',
]

export function AIVetView() {
  const checked = useRequireAuth()
  const user = useStore(s => s.user)
  const navigate = useStore(s => s.navigate)
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [usage, setUsage] = useState<{ used: number; limit: number; remaining: number } | null>(null)
  const [limitReached, setLimitReached] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  async function send(text?: string) {
    const content = (text ?? input).trim()
    if (!content || sending) return
    setInput('')
    const newMessages = [...messages, { role: 'user' as const, content }]
    setMessages(newMessages)
    setSending(true)

    try {
      const res = await api('/api/ai/vet', {
        method: 'POST',
        body: JSON.stringify({ messages: newMessages }),
      })
      setMessages([...newMessages, { role: 'assistant', content: res.reply }])
      setUsage(res.usage)
      setLimitReached(false)
    } catch (e) {
      const err = e as Error & { data?: { limitReached?: boolean } }
      if (err.data?.limitReached) {
        setLimitReached(true)
      }
      toast({ title: err.message, variant: 'destructive' })
    }
    setSending(false)
  }

  if (!checked) return <PageShell image="/images/vet.jpg" />

  return (
    <PageShell image="/images/vet.jpg" className="flex flex-col h-dvh">
      <PageHeader
        title="AI دامپزشک بازارگاه"
        subtitle={usage ? `باقیمانده امروز: ${usage.remaining} از ${usage.limit}` : 'پاسخ آموزشی فوری ۲۴ ساعته'}
        right={
          <button
            onClick={() => navigate('vets')}
            className="text-[11px] bg-white/15 hover:bg-white/25 rounded-full px-3 py-1.5 whitespace-nowrap"
          >
            رزرو دامپزشک واقعی
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto max-w-3xl w-full mx-auto px-4 py-4 pb-32">
        {messages.length === 0 && (
          <div className="text-center py-8 animate-fade-up">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-green-500 to-emerald-700 flex items-center justify-center shadow-xl mb-4">
              <Bot className="w-10 h-10 text-white" />
            </div>
            <h2 className="font-extrabold text-lg text-green-950 dark:text-green-100">سلام! من دستیار دامپزشکی بازارگاه هستم 🩺</h2>
            <p className="text-[13px] text-gray-500 mt-2 max-w-sm mx-auto leading-relaxed">
              علائم حیوانتان را توضیح دهید تا راهنمایی آموزشی بگیرید.
              پاسخ من جایگزین معاینه دامپزشک نیست.
            </p>

            <div className="grid gap-2 mt-6 max-w-md mx-auto">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="glass-card rounded-2xl px-4 py-3 text-right text-[13px] hover:bg-green-50 transition-colors flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-green-600 shrink-0" />
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 mb-4 ${m.role === 'user' ? 'flex-row-reverse' : ''} animate-fade-up`}>
            {m.role === 'assistant' && (
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-700 flex items-center justify-center shrink-0 shadow">
                <Bot className="w-5 h-5 text-white" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-3xl px-4 py-3 text-[14px] leading-7 whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-green-700 text-white rounded-tr-md shadow-lg'
                  : 'glass-card text-gray-800 dark:text-gray-100 rounded-tl-md'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex gap-2 mb-4">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-700 flex items-center justify-center shrink-0 shadow">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="glass-card rounded-3xl rounded-tl-md px-5 py-4 flex gap-1.5 items-center">
              <span className="typing-dot w-2 h-2 rounded-full bg-green-600 inline-block" />
              <span className="typing-dot w-2 h-2 rounded-full bg-green-600 inline-block" />
              <span className="typing-dot w-2 h-2 rounded-full bg-green-600 inline-block" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* نوار ورودی */}
      <div className="fixed bottom-[70px] inset-x-0 z-40 px-4 pb-2">
        <div className="max-w-3xl mx-auto">
          {limitReached && (
            <div className="glass-card rounded-2xl p-3 mb-2 flex items-center gap-3 bg-amber-50/90">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <div className="flex-1 text-[12px] text-amber-900">
                سهمیه امروز تمام شد. با ارتقای اشتراک، پیام‌های AI بیشتری دریافت کنید.
              </div>
              <Button size="sm" onClick={() => navigate('subscription')} className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white shrink-0">
                ارتقا
              </Button>
            </div>
          )}
          <div className="glass-card rounded-full p-1.5 flex items-center gap-2 shadow-lg">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="علائم حیوان را توضیح دهید..."
              className="flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-gray-400"
              aria-label="پیام به AI دامپزشک"
            />
            <Button
              onClick={() => send()}
              disabled={sending || !input.trim()}
              size="icon"
              className="rounded-full w-10 h-10 bg-green-700 hover:bg-green-800"
              aria-label="ارسال"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-center text-[10px] text-gray-400 mt-1.5">
            ⚠️ پاسخ‌های AI آموزشی است و تشخیص قطعی نیست — موارد اورژانسی به دامپزشک واقعی مراجعه کنید
          </p>
        </div>
      </div>
    </PageShell>
  )
}
