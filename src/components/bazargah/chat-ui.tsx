'use client'

/**
 * کامپوننت‌های مشترک صفحه‌های گفتگو (AI دامپزشک + چت خریدار/فروشنده)
 * - MarkdownText: رندر Markdown فارسی (بولد، تیتر، لیست، خط جداکننده) بدون کتابخانه خارجی
 * - faTime / faDayLabel: زمان و برچسب روز فارسی
 * - CopyBtn: دکمه کپی متن پیام
 */

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

/** رندر بولد درون‌خطی **متن** و *متن* */
function InlineMd({ text }: { text: string }) {
  // تقسیم بر **بولد** سپس *ایتالیک*
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean)
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith('**') && p.endsWith('**')) {
          return <strong key={i} className="font-extrabold">{p.slice(2, -2)}</strong>
        }
        if (p.startsWith('*') && p.endsWith('*') && p.length > 2) {
          return <em key={i} className="opacity-80">{p.slice(1, -1)}</em>
        }
        return <span key={i}>{p}</span>
      })}
    </>
  )
}

/** رندر سبک Markdown فارسی — بولد، تیتر، لیست تیره/عددی، جداکننده، پاراگراف */
export function MarkdownText({ text, className = '' }: { text: string; className?: string }) {
  const lines = (text || '').split('\n')
  const blocks: React.ReactNode[] = []
  let list: { ordered: boolean; items: string[] } | null = null

  const flushList = (key: string) => {
    if (!list) return
    const L = list
    blocks.push(
      L.ordered ? (
        <ol key={key} className="my-1.5 space-y-1 ps-5 list-decimal marker:text-green-600 marker:font-bold">
          {L.items.map((it, i) => <li key={i} className="ps-1"><InlineMd text={it} /></li>)}
        </ol>
      ) : (
        <ul key={key} className="my-1.5 space-y-1 ps-5 list-disc marker:text-green-600">
          {L.items.map((it, i) => <li key={i} className="ps-1"><InlineMd text={it} /></li>)}
        </ul>
      )
    )
    list = null
  }

  lines.forEach((raw, idx) => {
    const line = raw.trimEnd()
    const trimmed = line.trim()

    // جداکننده ---
    if (/^(-{3,}|—+|={3,})$/.test(trimmed)) {
      flushList(`l${idx}`)
      blocks.push(<hr key={`hr${idx}`} className="my-2.5 border-green-600/15" />)
      return
    }
    // لیست تیره: - یا • یا *
    const bullet = trimmed.match(/^[-•*]\s+(.*)$/)
    if (bullet) {
      if (!list || list.ordered) { flushList(`l${idx}`); list = { ordered: false, items: [] } }
      list.items.push(bullet[1])
      return
    }
    // لیست عددی: 1. یا ۱-
    const numbered = trimmed.match(/^[0-9۰-۹]+[.、-]\s+(.*)$/)
    if (numbered) {
      if (!list || !list.ordered) { flushList(`l${idx}`); list = { ordered: true, items: [] } }
      list.items.push(numbered[1])
      return
    }
    // تیتر
    const heading = trimmed.match(/^(#{1,4})\s+(.*)$/)
    if (heading) {
      flushList(`l${idx}`)
      blocks.push(
        <div key={`h${idx}`} className="font-extrabold text-[15px] text-green-800 dark:text-green-300 mt-2.5 mb-1 flex items-center gap-1.5">
          <span className="w-1 h-4 rounded-full bg-gradient-to-b from-green-500 to-emerald-600 inline-block" />
          <InlineMd text={heading[2]} />
        </div>
      )
      return
    }
    // خط خالی → پایان پاراگراف
    if (!trimmed) {
      flushList(`l${idx}`)
      return
    }
    // پاراگراف عادی
    flushList(`l${idx}`)
    blocks.push(<p key={`p${idx}`} className="my-1"><InlineMd text={trimmed} /></p>)
  })
  flushList('last')

  return <div className={`leading-7 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 ${className}`}>{blocks}</div>
}

/** ساعت فارسی HH:MM */
export function faTime(d: string | number | Date | undefined | null) {
  if (!d) return ''
  try {
    return new Intl.DateTimeFormat('fa-IR', { hour: '2-digit', minute: '2-digit' }).format(new Date(d))
  } catch {
    return ''
  }
}

/** برچسب روز: امروز / دیروز / تاریخ کامل */
export function faDayLabel(d: string | number | Date | undefined | null) {
  if (!d) return ''
  try {
    const date = new Date(d)
    const today = new Date()
    const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
    const diffDays = Math.round((startOf(today) - startOf(date)) / 864e5)
    if (diffDays === 0) return 'امروز'
    if (diffDays === 1) return 'دیروز'
    return new Intl.DateTimeFormat('fa-IR', { weekday: 'long', day: 'numeric', month: 'long' }).format(date)
  } catch {
    return ''
  }
}

/** زمان نسبی فارسی برای لیست گفتگوها */
export function faRelative(d: string | number | Date | undefined | null) {
  if (!d) return ''
  try {
    const diff = Date.now() - new Date(d).getTime()
    const min = Math.floor(diff / 60000)
    if (min < 1) return 'همین حالا'
    if (min < 60) return `${new Intl.NumberFormat('fa-IR').format(min)} دقیقه پیش`
    const h = Math.floor(min / 60)
    if (h < 24) return `${new Intl.NumberFormat('fa-IR').format(h)} ساعت پیش`
    const days = Math.floor(h / 24)
    if (days === 1) return 'دیروز'
    if (days < 7) return `${new Intl.NumberFormat('fa-IR').format(days)} روز پیش`
    return faDayLabel(d)
  } catch {
    return ''
  }
}

/** دکمه کپی متن پیام */
export function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        } catch { /* */ }
      }}
      aria-label="کپی پاسخ"
      className="inline-flex items-center gap-1 text-[10px] text-gray-400 hover:text-green-600 transition-colors"
    >
      {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
      {copied ? 'کپی شد' : 'کپی'}
    </button>
  )
}
