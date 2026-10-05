'use client'

import { House, Search, Plus, HeartPulse, User } from 'lucide-react'
import { useStore, ViewName } from '@/lib/store'

/** نویگیشن پایین — فقط موبایل (زیر lg). مطابق طرح ضمیمه: خانه، جستجو، ثبت آگهی (سبز بزرگ)، سلامت، پروفایل */
export function BottomNav() {
  const { stack, navigate, resetTo, user } = useStore()
  const current = stack[stack.length - 1]?.view

  const go = (view: ViewName) => {
    navigate(view)
  }

  const items: { view: ViewName; icon: React.ReactNode; label: string }[] = [
    { view: 'home', icon: <House className="w-5 h-5" />, label: 'خانه' },
    { view: 'search', icon: <Search className="w-5 h-5" />, label: 'جستجو' },
    { view: 'create-ad', icon: <Plus className="w-7 h-7" strokeWidth={2.5} />, label: 'ثبت آگهی' },
    { view: 'animals', icon: <HeartPulse className="w-5 h-5" />, label: 'سلامت' },
    { view: 'profile', icon: <User className="w-5 h-5" />, label: user?.firstName || 'پروفایل' },
  ]

  return (
    <nav
      aria-label="ناوبری اصلی"
      className="fixed bottom-0 inset-x-0 z-50 glass-card border-t border-white/50 dark:border-gray-800 safe-bottom lg:hidden"
    >
      <div className="max-w-3xl mx-auto flex items-center justify-around px-2 pt-1.5 pb-1">
        {items.map((item) => {
          if (item.view === 'create-ad') {
            return (
              <button
                key="create"
                onClick={() => go('create-ad')}
                aria-label="ثبت آگهی جدید"
                className="fab-create -mt-7 w-14 h-14 rounded-full text-white flex flex-col items-center justify-center shrink-0"
              >
                <Plus className="w-6 h-6" strokeWidth={2.5} />
                <span className="text-[9px] font-bold -mt-0.5">ثبت آگهی</span>
              </button>
            )
          }
          const isActive = current === item.view
          return (
            <button
              key={item.view}
              onClick={() => (item.view === 'home' ? resetTo('home') : go(item.view))}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl min-w-[56px] transition-colors ${
                isActive ? 'text-green-700 dark:text-green-400' : 'text-gray-400 hover:text-green-600'
              }`}
            >
              {item.icon}
              <span className="text-[10px] font-medium truncate max-w-[64px]">{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
