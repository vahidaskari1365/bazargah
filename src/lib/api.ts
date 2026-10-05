'use client'

import { useStore } from './store'

/** کلاینت API با توکن خودکار */
export async function api(path: string, options: RequestInit = {}) {
  const token = useStore.getState().token
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(path, { ...options, headers })
  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    const err = new Error(data.error || 'خطای غیرمنتظره') as Error & { status?: number; data?: unknown }
    err.status = res.status
    err.data = data
    throw err
  }
  return data
}

export const faNum = (n: number | string | undefined | null) =>
  n === undefined || n === null ? '—' : String(n).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d])

export const faPrice = (n: number | undefined | null) =>
  n === undefined || n === null || isNaN(n) ? 'توافقی' : `${faNum(n.toLocaleString('en-US'))} تومان`

export const faDate = (d: string | Date | undefined | null) => {
  if (!d) return ''
  try {
    return new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(d))
  } catch {
    return ''
  }
}

export const SPECIES_FA: Record<string, string> = {
  COW: 'گاو', SHEEP: 'گوسفند', GOAT: 'بز', BUFFALO: 'گاومیش',
  POULTRY: 'طیور', HORSE: 'اسب', DOG: 'سگ', CAT: 'گربه', CAMEL: 'شتر', OTHER: 'سایر',
}

export const SPECIES_ICONS: Record<string, string> = {
  COW: '🐄', SHEEP: '🐑', GOAT: '🐐', BUFFALO: '🐃',
  POULTRY: '🐔', HORSE: '🐎', DOG: '🐕', CAT: '🐈', CAMEL: '🐫', OTHER: '🐾',
}

export const GOALS: { value: string; label: string }[] = [
  { value: 'GROW', label: 'رشد' },
  { value: 'MAINTAIN', label: 'حفظ وزن' },
  { value: 'GAIN', label: 'افزایش وزن' },
  { value: 'MILK', label: 'شیردهی' },
  { value: 'PREGNANT', label: 'آبستنی' },
  { value: 'FATTENING', label: 'پرواربندی' },
  { value: 'LOSE', label: 'کاهش وزن' },
  { value: 'LAYING', label: 'تخم‌گذاری' },
]

export const ENVIRONMENTS: { value: string; label: string }[] = [
  { value: 'FARM', label: 'مزرعه' },
  { value: 'STABLE', label: 'اصطبل' },
  { value: 'FREE_RANGE', label: 'چرای آزاد' },
  { value: 'HOUSE', label: 'منزل' },
]

export const PROVINCES = ['تهران','اصفهان','فارس','خراسان رضوی','آذربایجان شرقی','آذربایجان غربی','البرز','قم','مازندران','گیلان','خوزستان','کرمان','یزد','کرمانشاه','هرمزگان','سیستان و بلوچستان','کردستان','همدان','لرستان','گلستان','اردبیل','زنجان','قزوین','مرکزی','سمنان','بوشهر','چهارمحال و بختیاری','کهگیلویه و بویراحمد','ایلام','خراسان شمالی','خراسان جنوبی','گلستان']

export const CITIES: Record<string, string[]> = {
  'تهران': ['تهران', 'شهریار', 'ورامین', 'پاکدشت', 'اسلامشهر', 'ری', 'دماوند', 'فیروزکوه'],
  'اصفهان': ['اصفهان', 'نجف‌آباد', 'شهرضا', 'کاشان', 'خمینی‌شهر', 'فلاورجان'],
  'فارس': ['شیراز', 'مرودشت', 'فسا', 'داراب', 'لار'],
  'خراسان رضوی': ['مشهد', 'نیشابور', 'سبزوار', 'تربت حیدریه'],
  'آذربایجان شرقی': ['تبریز', 'مراغه', 'اهر', 'مغان'],
  'آذربایجان غربی': ['ارومیه', 'خوی', 'مهاباد', 'بوکان'],
  'البرز': ['کرج', 'هشتگرد', 'نظرآباد'],
}
