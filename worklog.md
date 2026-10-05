
---
Task ID: responsive-desktop-nav
Agent: Super Z (main)
Task: Fix desktop layout - remove mobile bottom nav on desktop, add proper top navbar, make fully responsive

Work Log:
- Created src/components/bazargah/top-nav.tsx: sticky desktop navbar (hidden lg:block) with logo, 7 menu links, search, ثبت آگهی button, user dropdown menu (profile/my-ads/favorites/wallet/subscription/notifications/admin/logout)
- bottom-nav.tsx: added lg:hidden (mobile-only now)
- page.tsx: rendered TopNav above CurrentView; added mounted-gate to fix React hydration mismatch from localStorage store init
- shared.tsx: PageHeader sticky lg:top-16 below navbar + max-w-7xl inner; AdCard md:flex-col-reverse + md:w-full md:h-44 image (vertical card in desktop grids, horizontal on mobile)
- Responsive containers in all 15 views: max-w widened on lg (lists→6xl, details/forms→3xl-5xl), pb-28 lg:pb-12, lg:px-8
- Lists converted to grids on desktop: home/favorites/my-ads (1/2/3 cols), vets (2/3), animals (2/3), herds (2/3), stores (2)
- chat.tsx + ai-vet.tsx: fixed input bars bottom-[70px] lg:bottom-4; chat shells h-dvh lg:h-[calc(100dvh-4rem)]
- home.tsx: hero brand row hidden on desktop (lg:hidden, navbar has it); search hero max-w-4xl
- api.ts: removed duplicate 'گلستان' from PROVINCES (React duplicate key error), added گلستان cities to CITIES
- Verified via agent-browser screenshots at 1440x900 (desktop: navbar+3-col grid+user menu+vets page) and 390x844 (mobile: bottom nav intact, single column)
- Build passed; no console errors; pushed to github.com/vahidaskari1365/bazargah main

Stage Summary:
- Desktop now has proper sticky top navigation with user dropdown; mobile keeps bottom nav + FAB
- Fully responsive: 3-col ad grids, wide containers, correct sticky offsets on desktop
- Fixed pre-existing hydration error + duplicate React key error
- All changes committed and pushed to GitHub main branch
