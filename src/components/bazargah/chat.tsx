'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Send, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader, PageShell, LoadingView, EmptyState, useRequireAuth } from '@/components/bazargah/shared'
import { useStore } from '@/lib/store'
import { api } from '@/lib/api'
import { toast } from '@/hooks/use-toast'

interface Conversation {
  id: string; buyerId: string; sellerId: string; lastMessage: string; lastMessageAt: string
  buyer: { id: string; firstName?: string; lastName?: string }
  seller: { id: string; firstName?: string; lastName?: string }
}
interface Message { id: string; conversationId: string; senderId: string; content: string; isRead: boolean; createdAt: string }

export function ChatListView() {
  const checked = useRequireAuth()
  const navigate = useStore(s => s.navigate)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!checked) return
    api('/api/chat').then(res => setConversations(res.conversations)).catch(() => {}).finally(() => setLoading(false))
  }, [checked])

  if (!checked) return <PageShell image="/images/farm.jpg" />

  return (
    <PageShell image="/images/farm.jpg">
      <PageHeader title="گفتگوها" subtitle="چت با خریداران و فروشندگان" />
      <div className="max-w-3xl lg:max-w-4xl mx-auto px-4 lg:px-8 pb-28 lg:pb-12">
        {loading ? <LoadingView /> : conversations.length === 0 ? (
          <EmptyState
            icon="💬"
            title="هنوز گفتگویی ندارید"
            description="از صفحه هر آگهی می‌توانید با فروشنده چت کنید"
          />
        ) : (
          <div className="space-y-2 mt-4">
            {conversations.map((c) => {
              const other = c.buyerId === useStore.getState().user?.id ? c.seller : c.buyer
              return (
                <div
                  key={c.id}
                  onClick={() => navigate('chat-detail', { id: c.id })}
                  className="glass-card rounded-3xl p-4 flex items-center gap-4 cursor-pointer hover:shadow-lg transition-shadow animate-fade-up"
                >
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-green-700 text-white flex items-center justify-center text-lg font-bold shrink-0">
                    {(other?.firstName || '؟')[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[14px]">{other?.firstName} {other?.lastName}</div>
                    <div className="text-[12px] text-gray-500 truncate mt-0.5">{c.lastMessage || 'شروع گفتگو...'}</div>
                  </div>
                  <MessageCircle className="w-5 h-5 text-green-600" />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </PageShell>
  )
}

export function ChatDetailView({ id }: { id: string }) {
  const checked = useRequireAuth()
  const user = useStore(s => s.user)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const lastCountRef = useRef(0)

  const loadMessages = useCallback(async (silent = false) => {
    try {
      const res = await api(`/api/chat/${id}/messages`)
      // فقط اگر پیام جدید آمده state آپدیت شود (برای polling روان)
      if (res.messages.length !== lastCountRef.current || !silent) {
        setMessages(res.messages)
        lastCountRef.current = res.messages.length
      }
    } catch { /* */ }
    if (!silent) setLoading(false)
  }, [id])

  useEffect(() => {
    if (!checked) return
    const initial = async () => {
      try {
        const res = await api(`/api/chat/${id}/messages`)
        setMessages(res.messages)
        lastCountRef.current = res.messages.length
      } catch { /* */ }
      setLoading(false)
    }
    initial()
    // Polling هر 3 ثانیه برای دریافت پیام‌های جدید
    const interval = setInterval(() => loadMessages(true), 3000)
    return () => clearInterval(interval)
  }, [checked, id, loadMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send() {
    const content = input.trim()
    if (!content || sending) return
    setInput('')
    setSending(true)
    try {
      await api(`/api/chat/${id}/messages`, { method: 'POST', body: JSON.stringify({ content }) })
      await loadMessages(true)
    } catch (e) {
      toast({ title: (e as Error).message, variant: 'destructive' })
    }
    setSending(false)
  }

  if (!checked) return <PageShell image="/images/farm.jpg" />

  return (
    <PageShell image="/images/farm.jpg" className="flex flex-col h-dvh lg:h-[calc(100dvh-4rem)]">
      <PageHeader title="گفتگو" subtitle="پیام‌ها رمزنگاری‌شده ذخیره می‌شوند" />
      <div className="flex-1 overflow-y-auto max-w-3xl w-full mx-auto px-4 py-4 pb-28">
        {loading ? <LoadingView /> : (
          <>
            {messages.map((m) => {
              const mine = m.senderId === user?.id
              return (
                <div key={m.id} className={`flex mb-3 ${mine ? 'justify-start flex-row-reverse' : 'justify-end flex-row-reverse'} animate-fade-up`}>
                  <div
                    className={`max-w-[78%] rounded-3xl px-4 py-2.5 text-[14px] leading-7 ${
                      mine
                        ? 'bg-green-700 text-white rounded-tr-md shadow-md'
                        : 'glass-card text-gray-800 dark:text-gray-100 rounded-tl-md'
                    }`}
                  >
                    {m.content}
                    <div className={`text-[9px] mt-1 ${mine ? 'text-green-200' : 'text-gray-400'}`}>
                      {m.isRead ? 'خوانده شد ✓✓' : 'ارسال شد ✓'}
                    </div>
                  </div>
                </div>
              )
            })}
            {messages.length === 0 && (
              <div className="text-center py-16 text-sm text-gray-400">
                اولین پیام را بفرستید 👋
              </div>
            )}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="fixed bottom-[70px] lg:bottom-4 inset-x-0 z-40 px-4">
        <div className="max-w-3xl mx-auto glass-card rounded-full p-1.5 flex items-center gap-2 shadow-lg">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder="پیام خود را بنویسید..."
            className="flex-1 bg-transparent px-3 text-sm outline-none"
            aria-label="متن پیام"
          />
          <Button onClick={send} disabled={sending || !input.trim()} size="icon" className="rounded-full w-10 h-10 bg-green-700 hover:bg-green-800" aria-label="ارسال پیام">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </PageShell>
  )
}
