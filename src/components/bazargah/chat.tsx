'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { Send, MessageCircle, Search, ShieldCheck, BadgeCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageShell, LoadingView, EmptyState, useRequireAuth } from '@/components/bazargah/shared'
import { faTime, faDayLabel, faRelative } from '@/components/bazargah/chat-ui'
import { useStore } from '@/lib/store'
import { api } from '@/lib/api'
import { toast } from '@/hooks/use-toast'

interface Conversation {
  id: string; buyerId: string; sellerId: string; lastMessage: string; lastMessageAt: string
  buyer: { id: string; firstName?: string; lastName?: string }
  seller: { id: string; firstName?: string; lastName?: string }
}
interface Message { id: string; conversationId: string; senderId: string; content: string; isRead: boolean; createdAt: string }
interface ConvInfo {
  buyer: { firstName?: string; lastName?: string; isVerified?: boolean }
  seller: { firstName?: string; lastName?: string; isVerified?: boolean }
  buyerId: string
  sellerId: string
}

/** آواتار گرادیانی با حرف اول نام */
function InitialAvatar({ name, size = 'w-12 h-12', text = 'text-lg' }: { name: string; size?: string; text?: string }) {
  const gradients = [
    'from-green-500 to-emerald-700',
    'from-teal-500 to-green-700',
    'from-emerald-500 to-teal-700',
    'from-lime-500 to-green-700',
  ]
  const g = gradients[(name?.charCodeAt(0) || 0) % gradients.length]
  return (
    <div className={`${size} rounded-2xl bg-gradient-to-br ${g} text-white flex items-center justify-center ${text} font-bold shrink-0 shadow-md`}>
      {(name || '؟')[0]}
    </div>
  )
}

// ═══════════════ لیست گفتگوها ═══════════════
export function ChatListView() {
  const checked = useRequireAuth()
  const navigate = useStore(s => s.navigate)
  const myId = useStore(s => s.user?.id)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (!checked) return
    api('/api/chat').then(res => setConversations(res.conversations)).catch(() => {}).finally(() => setLoading(false))
  }, [checked])

  const filtered = useMemo(() => {
    if (!query.trim()) return conversations
    const q = query.trim()
    return conversations.filter((c) => {
      const other = c.buyerId === myId ? c.seller : c.buyer
      const name = `${other?.firstName || ''} ${other?.lastName || ''}`
      return name.includes(q) || (c.lastMessage || '').includes(q)
    })
  }, [conversations, query, myId])

  if (!checked) return <PageShell image="/images/farm.jpg" />

  return (
    <PageShell image="/images/farm.jpg">
      <div className="max-w-3xl lg:max-w-4xl mx-auto px-4 lg:px-8 pb-28 lg:pb-12">
        {/* هدر با جستجو */}
        <header className="pt-[max(1rem,env(safe-area-inset-top))] pb-3">
          <h1 className="text-2xl font-extrabold text-green-950 dark:text-green-50 flex items-center gap-2">
            گفتگوها
            {conversations.length > 0 && (
              <span className="text-[11px] font-medium bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 rounded-full px-2.5 py-1">
                {new Intl.NumberFormat('fa-IR').format(conversations.length)}
              </span>
            )}
          </h1>
          <div className="glass-card rounded-2xl mt-3 flex items-center gap-2 px-4 py-2.5">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="جستجوی نام یا پیام..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
              aria-label="جستجوی گفتگو"
            />
          </div>
        </header>

        {loading ? <LoadingView /> : filtered.length === 0 ? (
          <EmptyState
            icon="💬"
            title={query ? 'گفتگویی پیدا نشد' : 'هنوز گفتگویی ندارید'}
            description={query ? 'عبارت دیگری را جستجو کنید' : 'از صفحه هر آگهی می‌توانید با فروشنده چت کنید'}
          />
        ) : (
          <div className="space-y-2.5 mt-2">
            {filtered.map((c) => {
              const other = c.buyerId === myId ? c.seller : c.buyer
              const name = `${other?.firstName || ''} ${other?.lastName || ''}`.trim() || 'کاربر بازارگاه'
              return (
                <div
                  key={c.id}
                  onClick={() => navigate('chat-detail', { id: c.id })}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && navigate('chat-detail', { id: c.id })}
                  className="glass-card rounded-3xl p-4 flex items-center gap-3.5 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all animate-fade-up"
                >
                  <div className="relative shrink-0">
                    <InitialAvatar name={name} />
                    <span className="absolute bottom-0 left-0 w-3.5 h-3.5 rounded-full bg-green-400 border-2 border-white dark:border-gray-900" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-bold text-[14px] flex items-center gap-1 truncate">
                        {name}
                        <BadgeCheck className="w-4 h-4 text-green-500 shrink-0" />
                      </div>
                      <span className="text-[10px] text-gray-400 shrink-0">{faRelative(c.lastMessageAt)}</span>
                    </div>
                    <div className="text-[12px] text-gray-500 truncate mt-1">{c.lastMessage || 'شروع گفتگو...'}</div>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" aria-hidden />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </PageShell>
  )
}

// ═══════════════ صفحه گفتگو (جزئیات) ═══════════════
export function ChatDetailView({ id }: { id: string }) {
  const checked = useRequireAuth()
  const user = useStore(s => s.user)
  const [messages, setMessages] = useState<Message[]>([])
  const [convInfo, setConvInfo] = useState<ConvInfo | null>(null)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const lastCountRef = useRef(0)
  const nearBottomRef = useRef(true)
  // فقط پیام‌های جدید انیمیشن بگیرند (بدون پرش در polling)
  const seenIdsRef = useRef<Set<string>>(new Set())
  const [freshIds, setFreshIds] = useState<Set<string>>(new Set())

  const applyMessages = useCallback((list: Message[]) => {
    const fresh = new Set<string>()
    for (const m of list) {
      if (!seenIdsRef.current.has(m.id)) {
        seenIdsRef.current.add(m.id)
        // در بارگذاری اولیه، پیام‌های قدیمی انیمیشن نمی‌گیرند
        if (lastCountRef.current > 0) fresh.add(m.id)
      }
    }
    lastCountRef.current = list.length
    setMessages(list)
    if (fresh.size > 0) setFreshIds(fresh)
  }, [])

  const loadMessages = useCallback(async (silent = false) => {
    try {
      const res = await api(`/api/chat/${id}/messages`)
      if (res.conversation) setConvInfo(res.conversation)
      if (res.messages.length !== lastCountRef.current || !silent) {
        applyMessages(res.messages)
      }
    } catch { /* */ }
    if (!silent) setLoading(false)
  }, [id, applyMessages])

  useEffect(() => {
    if (!checked) return
    loadMessages()
    // Polling هر 3 ثانیه برای دریافت پیام‌های جدید
    const interval = setInterval(() => loadMessages(true), 3000)
    return () => clearInterval(interval)
  }, [checked, id, loadMessages])

  const onScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    nearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 140
  }, [])

  useEffect(() => {
    if (nearBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  // ارتفاع خودکار textarea
  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }, [input])

  async function send() {
    const content = input.trim()
    if (!content || sending) return
    setInput('')
    setSending(true)
    nearBottomRef.current = true
    try {
      await api(`/api/chat/${id}/messages`, { method: 'POST', body: JSON.stringify({ content }) })
      await loadMessages(true)
    } catch (e) {
      toast({ title: (e as Error).message, variant: 'destructive' })
    }
    setSending(false)
    inputRef.current?.focus()
  }

  if (!checked) return <PageShell image="/images/farm.jpg" />

  const myId = user?.id
  const otherInfo = convInfo
    ? (convInfo.buyerId === myId ? convInfo.seller : convInfo.buyer)
    : null
  const otherName = otherInfo ? `${otherInfo.firstName || ''} ${otherInfo.lastName || ''}`.trim() || 'کاربر بازارگاه' : 'گفتگو'

  // گروه‌بندی پیام‌ها با جداکننده روز
  const grouped: { label: string; items: Message[] }[] = []
  for (const m of messages) {
    const label = faDayLabel(m.createdAt) || ''
    const last = grouped[grouped.length - 1]
    if (last && last.label === label) last.items.push(m)
    else grouped.push({ label, items: [m] })
  }

  return (
    <PageShell image="/images/farm.jpg" className="chat-shell flex flex-col h-dvh lg:h-[calc(100dvh-4rem)]">
      {/* ── هدر گفتگو با آواتار طرف مقابل ── */}
      <header className="hero-header relative z-40 text-white" style={{ '--bg-image': 'url(/images/farm.jpg)' } as React.CSSProperties}>
        <div className="relative z-10 flex items-center gap-3 px-4 lg:px-8 pt-[max(0.9rem,env(safe-area-inset-top))] pb-3 max-w-7xl mx-auto">
          <button
            onClick={() => useStore.getState().back()}
            aria-label="بازگشت"
            className="shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
          </button>
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-white font-bold text-lg shadow-inner">
              {otherName[0]}
            </div>
            <span className="absolute bottom-0 left-0 w-3 h-3 rounded-full bg-green-400 border-2 border-white/80" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold flex items-center gap-1 truncate">
              {otherName}
              <BadgeCheck className="w-4 h-4 text-green-200 shrink-0" />
            </h1>
            <p className="text-[11px] text-green-100/80 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              گفتگوی امن بازارگاه
            </p>
          </div>
        </div>
      </header>

      {/* ── پیام‌ها ── */}
      <div ref={scrollRef} onScroll={onScroll} className="flex-1 overflow-y-auto max-w-3xl w-full mx-auto px-4 py-4 pb-44">
        {loading ? <LoadingView /> : (
          <>
            {messages.length === 0 && (
              <div className="text-center py-14 animate-fade-up">
                <div className="text-5xl mb-3">👋</div>
                <p className="text-sm text-gray-500">اولین پیام را بفرستید</p>
                <p className="text-[12px] text-gray-400 mt-1">معامله مطمئن با گفتگوی شفاف شروع می‌شود</p>
              </div>
            )}
            {grouped.map((g, gi) => (
              <div key={gi}>
                {/* جداکننده روز */}
                <div className="flex justify-center my-4 sticky top-1 z-10">
                  <span className="glass-card rounded-full px-3.5 py-1 text-[10px] font-medium text-gray-500 dark:text-gray-300">
                    {g.label}
                  </span>
                </div>
                {g.items.map((m) => {
                  const mine = m.senderId === myId
                  // فقط پیام‌های تازه‌رسیده انیمیشن دارند (بدون پرش در polling)
                  const animate = freshIds.has(m.id)
                  return (
                    <div
                      key={m.id}
                      className={`flex mb-2.5 ${mine ? 'justify-end' : 'justify-start'} ${animate ? 'animate-fade-up' : ''}`}
                    >
                      <div
                        className={
                          mine
                            ? 'max-w-[78%] bg-gradient-to-l from-green-700 to-green-600 text-white rounded-3xl rounded-bl-md px-4 py-2.5 text-[14px] leading-7 shadow-md shadow-green-900/10'
                            : 'max-w-[78%] glass-card text-gray-800 dark:text-gray-100 rounded-3xl rounded-br-md px-4 py-2.5 text-[14px] leading-7 shadow-sm'
                        }
                      >
                        <p className="whitespace-pre-wrap break-words">{m.content}</p>
                        <div className={`flex items-center gap-1.5 mt-1 ${mine ? 'justify-start' : 'justify-end'}`}>
                          <span className={`text-[9px] ${mine ? 'text-green-200/90' : 'text-gray-400'}`}>{faTime(m.createdAt)}</span>
                          {mine && (
                            <span className={`text-[9px] font-bold ${m.isRead ? 'text-emerald-200' : 'text-green-200/70'}`}>
                              {m.isRead ? '✓✓' : '✓'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── نوار ورودی — کاملاً بالای ناوبری پایین ── */}
      <div className="fixed bottom-[calc(64px+env(safe-area-inset-bottom))] lg:bottom-4 inset-x-0 z-40 px-4">
        <div className="max-w-3xl mx-auto glass-card rounded-[1.6rem] p-2 flex items-end gap-2 shadow-xl shadow-green-900/10">
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
            placeholder="پیام خود را بنویسید..."
            rows={1}
            className="flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-gray-400 resize-none max-h-[120px] leading-6"
            aria-label="متن پیام"
          />
          <Button
            onClick={send}
            disabled={sending || !input.trim()}
            size="icon"
            className="rounded-full w-11 h-11 bg-gradient-to-br from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 shadow-md shrink-0 transition-all active:scale-95"
            aria-label="ارسال پیام"
          >
            <Send className="w-4 h-4 -scale-x-100" />
          </Button>
        </div>
      </div>
    </PageShell>
  )
}

