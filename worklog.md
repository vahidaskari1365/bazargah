
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

---
Task ID: guest-mode-open-access
Agent: Super Z (main)
Task: Make all platform features accessible without login (user request: "فعلا بزار همه امکانات بدون وارد شدن انجام بشه")

Work Log:
- Created src/app/api/auth/guest/route.ts: POST upserts shared guest user (phone 09000000000, «مهمان بازارگاه», BUYER, walletBalance 500,000,000 demo credit) and returns real JWT session
- store.ts: added guestReady/setGuestReady state
- page.tsx: on mount, if no token → auto POST /api/auth/guest → setAuth; always sets guestReady in finally
- shared.tsx useRequireAuth: waits for guestReady before any redirect to auth (fallback only if guest session truly unavailable)
- top-nav.tsx: removed all login redirects in go(); guest avatar gray, dropdown shows «حساب مهمان — همه امکانات آزاد است» + «ورود / ثبت‌نام با شماره موبایل» item; «خروج» hidden for guest
- bottom-nav.tsx: removed login redirects
- Browser tests (fresh localStorage): auto guest login confirmed; animals/chat/create-ad/profile/wallet/AI-vet/favorites all open and function; wallet shows ۵۰۰M demo credit; AI vet usage ۱۰ از ۱۰; favorite POST+GET round-trip works
- Build passed; pushed to github.com/vahidaskari1365/bazargah main (d25b9a8)

Stage Summary:
- Guest mode active: every section usable without registration; real OTP login still available via dropdown
- Guest data (ads/animals/favorites) stored under shared guest account — acceptable per user's "فعلا" instruction

---
Task ID: vercel-demo-fallback
Agent: Main agent
Task: Fix Vercel deployment — blank site (empty content) and phone-number wall for sections

Work Log:
- Diagnosed root cause: Vercel serverless cannot host SQLite file DB → all API routes fail (500/401) → empty home page + guest login fails → auth wall reappears
- Created src/lib/demo-data.ts: rich demo dataset (10 categories, 9 ads, 5 vets, 3 stores+7 products, 4 plans, 2 animals with health records, 2 herds, 6 expenses, demo chat/order/wallet/notifications) + GUEST_USER + localStorage helpers
- Created src/lib/demo-api.ts: demoFetch router simulating every endpoint (ads CRUD+filters, favorites toggle, cart, orders+wallet deduction, wallet charge, animals+records, herds, expenses analytics, subscription purchase, chat with seller auto-reply, OTP demo login)
- api.ts: tryDemo fallback — triggers on network error, 5xx, or 401 with demo token; demo mode flag skips server calls entirely (except /api/ai/* and /api/nutrition/calculate which really work on server)
- page.tsx: if /api/auth/guest fails → enableDemoMode() + client-side GUEST_USER ('demo-token') → zero auth walls
- AI vet/nutrition routes: user optional (noDb mode → unlimited usage), usage tracking wrapped in catch
- AI search: category fallback list; nutrition/calculate: seed foods fallback (exported foods from seed-data.ts)
- sw.js cache bumped to v2
- Tested with production build + hidden DB file (exact Vercel simulation): home/vets/stores/animals/chat/create-ad/subscription all work without login; real AI vet answered live Persian question
- Restored DB, verified dev mode intact, pushed (0952dff)

Stage Summary:
- Vercel deploy will now boot in full demo mode: every section accessible without phone, demo data everywhere, real AI working
- Normal mode (with DB) unchanged — demo layer only activates on server failure
- User must just redeploy (Vercel auto-deploys from GitHub main) and optionally clear site data once
