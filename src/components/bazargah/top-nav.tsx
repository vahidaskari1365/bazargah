'use client'

import { House, Search, Store, Stethoscope, Bot, HeartPulse, Brain, MessageCircle, Plus, User, Wallet, Crown, Bell, Heart, FileText, ShieldCheck, LogOut, Menu } from 'lucide-react'
import { useStore, ViewName } from '@/lib/store'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

/** منوی بالای صفحه — فقط دسکتاپ (lg به بالا). موبایل از BottomNav استفاده می‌کند */
export function TopNav() {
  const { stack, navigate, resetTo, user, token, logout } = useStore()
  const current = stack[stack.length - 1]?.view

  const go = (view: ViewName) => {
    if (!token && (view === 'create-ad' || view === 'profile' || view === 'chat' || view === 'animals')) {
      navigate('auth')
      return
    }
    navigate(view)
  }

  const isActive = (view: ViewName) => current === view

  const links: { view: ViewName; label: string; icon: React.ReactNode }[] = [
    { view: 'home', label: 'خانه', icon: <House className="w-4 h-4" /> },
    { view: 'stores', label: 'فروشگاه‌ها', icon: <Store className="w-4 h-4" /> },
    { view: 'vets', label: 'دامپزشکان', icon: <Stethoscope className="w-4 h-4" /> },
    { view: 'ai-vet', label: 'AI دامپزشک', icon: <Bot className="w-4 h-4" /> },
    { view: 'animals', label: 'سلامت دام', icon: <HeartPulse className="w-4 h-4" /> },
    { view: 'nutrition', label: 'تغذیه هوشمند', icon: <Brain className="w-4 h-4" /> },
    { view: 'chat', label: 'گفتگوها', icon: <MessageCircle className="w-4 h-4" /> },
  ]

  const isAdmin = user?.roleList?.includes('ADMIN')

  return (
    <nav
      aria-label="منوی اصلی دسکتاپ"
      className="hidden lg:block sticky top-0 z-50 glass-card border-b border-white/50 dark:border-gray-800"
    >
      {/* ردیف بالا */}
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-4">
        {/* لوگو */}
        <button
          onClick={() => resetTo('home')}
          className="flex items-center gap-2 shrink-0"
          aria-label="بازارگاه — صفحه اصلی"
        >
          <span className="w-10 h-10 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-800 flex items-center justify-center text-xl shadow-md">🌿</span>
          <span className="text-right leading-tight">
            <span className="block font-extrabold text-[17px] text-green-900 dark:text-green-100">بازارگاه</span>
            <span className="block text-[10px] text-gray-500">دنیای دام در دستان شما</span>
          </span>
        </button>

        {/* لینک‌های اصلی */}
        <div className="flex-1 flex items-center justify-center gap-1">
          {links.map((l) => (
            <button
              key={l.view}
              onClick={() => (l.view === 'home' ? resetTo('home') : go(l.view))}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13.5px] font-medium transition-colors ${
                isActive(l.view)
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/60 dark:text-green-200'
                  : 'text-gray-600 hover:text-green-700 hover:bg-green-50 dark:text-gray-300 dark:hover:bg-green-900/40'
              }`}
              aria-current={isActive(l.view) ? 'page' : undefined}
            >
              {l.icon}
              {l.label}
            </button>
          ))}
        </div>

        {/* اکشن‌ها */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => go('search')}
            aria-label="جستجو"
            className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 hover:text-green-700 hover:bg-green-50 dark:text-gray-300 dark:hover:bg-green-900/40 transition-colors"
          >
            <Search className="w-[18px] h-[18px]" />
          </button>

          <Button
            onClick={() => go('create-ad')}
            className="rounded-full h-10 px-5 bg-green-700 hover:bg-green-800 text-white font-bold text-[13px] gap-1.5 shadow-md"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            ثبت آگهی
          </Button>

          {user ? (
            <DropdownMenu dir="rtl">
              <DropdownMenuTrigger asChild>
                <button
                  aria-label="منوی کاربری"
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-700 text-white flex items-center justify-center font-bold text-[15px] shadow-md ring-2 ring-white/60 hover:ring-green-300 transition-all"
                >
                  {user.firstName?.[0] || '👤'}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-60 rounded-2xl p-2">
                <DropdownMenuLabel>
                  <div className="font-bold text-[14px]">{user.firstName} {user.lastName}</div>
                  <div className="text-[11px] text-gray-400 font-normal mt-0.5" dir="ltr">{user.phone}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('profile')} className="rounded-xl py-2.5 cursor-pointer">
                  <User className="w-4 h-4 ml-2" /> پروفایل من
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('my-ads')} className="rounded-xl py-2.5 cursor-pointer">
                  <FileText className="w-4 h-4 ml-2" /> آگهی‌های من
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('favorites')} className="rounded-xl py-2.5 cursor-pointer">
                  <Heart className="w-4 h-4 ml-2" /> علاقه‌مندی‌ها
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('wallet')} className="rounded-xl py-2.5 cursor-pointer">
                  <Wallet className="w-4 h-4 ml-2" /> کیف پول
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('subscription')} className="rounded-xl py-2.5 cursor-pointer">
                  <Crown className="w-4 h-4 ml-2" /> اشتراک
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('notifications')} className="rounded-xl py-2.5 cursor-pointer">
                  <Bell className="w-4 h-4 ml-2" /> اعلان‌ها
                </DropdownMenuItem>
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('admin')} className="rounded-xl py-2.5 cursor-pointer text-amber-700">
                      <ShieldCheck className="w-4 h-4 ml-2" /> پنل مدیریت
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => { logout(); resetTo('home') }}
                  className="rounded-xl py-2.5 cursor-pointer text-red-600 focus:text-red-700"
                >
                  <LogOut className="w-4 h-4 ml-2" /> خروج از حساب
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              onClick={() => navigate('auth')}
              variant="outline"
              className="rounded-full h-10 px-5 font-bold text-[13px] gap-1.5 border-green-200 hover:bg-green-50 hover:text-green-800"
            >
              <Menu className="w-4 h-4" />
              ورود
            </Button>
          )}
        </div>
      </div>
    </nav>
  )
}
