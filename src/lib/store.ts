'use client'

import { create } from 'zustand'

export interface User {
  id: string
  phone: string
  firstName?: string | null
  lastName?: string | null
  avatar?: string | null
  province?: string | null
  city?: string | null
  roles: string
  roleList?: string[]
  isVerified: boolean
  walletBalance: number
  loyaltyPoints: number
  planKey: string
  planExpiresAt?: string | null
  referralCode: string
}

export type ViewName =
  | 'home' | 'search' | 'ad-detail' | 'create-ad'
  | 'chat' | 'chat-detail'
  | 'ai-vet' | 'vets' | 'vet-booking'
  | 'animals' | 'animal-detail'
  | 'nutrition' | 'stores' | 'store-detail' | 'cart' | 'orders'
  | 'profile' | 'wallet' | 'subscription' | 'notifications' | 'favorites'
  | 'herds' | 'expenses' | 'admin' | 'auth'

interface Navigation {
  view: ViewName
  params?: Record<string, string>
}

interface BazargahState {
  // Auth
  token: string | null
  user: User | null
  setAuth: (token: string, user: User) => void
  logout: () => void
  updateUser: (user: Partial<User>) => void

  // Navigation (SPA router)
  stack: Navigation[]
  navigate: (view: ViewName, params?: Record<string, string>) => void
  back: () => void
  resetTo: (view: ViewName) => void

  // System
  splashDone: boolean
  setSplashDone: (v: boolean) => void

  // Guest mode — ورود خودکار مهمان تا همه امکانات بدون لاگین کار کند
  guestReady: boolean
  setGuestReady: (v: boolean) => void
}

const storedToken = typeof window !== 'undefined' ? localStorage.getItem('bazargah-token') : null
const storedUser = typeof window !== 'undefined' ? localStorage.getItem('bazargah-user') : null

export const useStore = create<BazargahState>((set, get) => ({
  token: storedToken,
  user: storedUser ? JSON.parse(storedUser) : null,
  setAuth: (token, user) => {
    localStorage.setItem('bazargah-token', token)
    localStorage.setItem('bazargah-user', JSON.stringify(user))
    set({ token, user })
  },
  logout: () => {
    localStorage.removeItem('bazargah-token')
    localStorage.removeItem('bazargah-user')
    set({ token: null, user: null, stack: [{ view: 'home' }] })
  },
  updateUser: (userData) => {
    const current = get().user
    if (!current) return
    const updated = { ...current, ...userData }
    localStorage.setItem('bazargah-user', JSON.stringify(updated))
    set({ user: updated })
  },

  stack: [{ view: 'home' }],
  navigate: (view, params) => {
    const stack = get().stack
    set({ stack: [...stack, { view, params }] })
    window.scrollTo(0, 0)
  },
  back: () => {
    const stack = get().stack
    if (stack.length > 1) set({ stack: stack.slice(0, -1) })
    else set({ stack: [{ view: 'home' }] })
    window.scrollTo(0, 0)
  },
  resetTo: (view) => {
    set({ stack: [{ view }] })
    window.scrollTo(0, 0)
  },

  splashDone: false,
  setSplashDone: (v) => set({ splashDone: v }),

  guestReady: false,
  setGuestReady: (v) => set({ guestReady: v }),
}))
