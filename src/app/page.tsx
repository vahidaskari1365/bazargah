'use client'

import { useEffect, useState } from 'react'
import { useStore } from '@/lib/store'
import { enableDemoMode, GUEST_USER } from '@/lib/demo-data'
import { BottomNav } from '@/components/bazargah/bottom-nav'
import { TopNav } from '@/components/bazargah/top-nav'
import { HomeView } from '@/components/bazargah/home'
import { AuthView } from '@/components/bazargah/auth'
import { AdDetailView } from '@/components/bazargah/ad-detail'
import { CreateAdView } from '@/components/bazargah/create-ad'
import { AIVetView } from '@/components/bazargah/ai-vet'
import { ChatListView, ChatDetailView } from '@/components/bazargah/chat'
import { VetsView } from '@/components/bazargah/vets'
import { NutritionView } from '@/components/bazargah/nutrition'
import { AnimalsView, AnimalDetailView } from '@/components/bazargah/animals'
import { StoresView, CartView, OrdersView } from '@/components/bazargah/shop'
import { ProfileView, WalletView, SubscriptionView, NotificationsView, FavoritesView, MyAdsView } from '@/components/bazargah/profile'
import { HerdsView, ExpensesView } from '@/components/bazargah/livestock'
import { AdminView } from '@/components/bazargah/admin'

/** Splash Screen */
function Splash({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1800)
    return () => clearTimeout(t)
  }, [onDone])
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-b from-[#0b3d2c] via-[#14532d] to-[#166534] text-white">
      <div className="w-24 h-24 rounded-[2rem] bg-white/10 backdrop-blur flex items-center justify-center text-6xl mb-6 animate-fade-up shadow-2xl">
        🌿
      </div>
      <h1 className="text-3xl font-extrabold animate-fade-up" style={{ animationDelay: '0.15s' }}>بازارگاه</h1>
      <p className="text-sm text-green-200/80 mt-2 animate-fade-up" style={{ animationDelay: '0.3s' }}>
        مارکت‌پلیس + دامپزشکی + هوش مصنوعی + تغذیه هوشمند
      </p>
      <div className="mt-10 w-10 h-10 border-[3px] border-green-300/30 border-t-green-200 rounded-full animate-spin" />
      <p className="absolute bottom-8 text-[11px] text-green-300/50">نسخه ۱ — PWA</p>
    </div>
  )
}

function CurrentView() {
  const stack = useStore(s => s.stack)
  const current = stack[stack.length - 1]
  const { view, params } = current

  switch (view) {
    case 'home': return <HomeView />
    case 'auth': return <AuthView />
    case 'ad-detail': return <AdDetailView id={params?.id || ''} />
    case 'create-ad': return <CreateAdView />
    case 'ai-vet': return <AIVetView />
    case 'chat': return <ChatListView />
    case 'chat-detail': return <ChatDetailView id={params?.id || ''} />
    case 'vets': return <VetsView />
    case 'nutrition': return <NutritionView />
    case 'animals': return <AnimalsView />
    case 'animal-detail': return <AnimalDetailView id={params?.id || ''} />
    case 'stores': return <StoresView />
    case 'cart': return <CartView />
    case 'orders': return <OrdersView />
    case 'profile': return <ProfileView />
    case 'wallet': return <WalletView />
    case 'subscription': return <SubscriptionView />
    case 'notifications': return <NotificationsView />
    case 'favorites': return <FavoritesView />
    case 'my-ads': return <MyAdsView />
    case 'herds': return <HerdsView />
    case 'expenses': return <ExpensesView />
    case 'admin': return <AdminView />
    case 'search': return <HomeView />
    default: return <HomeView />
  }
}

export default function BazargahApp() {
  const [splash, setSplash] = useState(true)
  const [mounted, setMounted] = useState(false)

  // ثبت Service Worker برای PWA + جلوگیری از خطای Hydration (خواندن localStorage فقط سمت کلاینت)
  useEffect(() => {
    setMounted(true)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
  }, [])

  // ورود خودکار مهمان — همه امکانات بدون نیاز به لاگین کار می‌کنند (فعلاً)
  // اگر سرور/دیتابیس در دسترس نبود (مثل Vercel بدون SQLite)، مهمان کاملاً سمت مرورگر ساخته می‌شود
  useEffect(() => {
    const s = useStore.getState()
    if (s.token) {
      s.setGuestReady(true)
      return
    }
    fetch('/api/auth/guest', { method: 'POST' })
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then(res => {
        if (res.token && res.user) {
          s.setAuth(res.token, res.user)
        } else {
          throw new Error('guest-failed')
        }
      })
      .catch(() => {
        // سرور/دیتابیس در دسترس نیست → حالت دموی کامل سمت مرورگر
        enableDemoMode()
        s.setAuth('demo-token', GUEST_USER)
      })
      .finally(() => useStore.getState().setGuestReady(true))
  }, [])

  return (
    <main className="min-h-dvh">
      {mounted && (
        <>
          {splash && <Splash onDone={() => setSplash(false)} />}
          <TopNav />
          <CurrentView />
          <BottomNav />
        </>
      )}
    </main>
  )
}
