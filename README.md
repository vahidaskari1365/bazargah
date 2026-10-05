# 🌿 بازارگاه — Bazargah

> پلتفرم جامع دام، دامپزشکی و کشاورزی هوشمند
> **Marketplace + Veterinary + AI Vet + Smart Nutrition + Animal Health + Livestock Management + E-commerce**

نسخه وب (PWA) بازارگاه — قابلیت نصب روی گوشی اندروید/iOS مثل یک اپ بومی، با Backend مشترک API-First آماده برای اپ اندروید و وب‌سایت آینده.

---

## ✨ قابلیت‌ها

### 🏪 Marketplace
- آگهی خرید و فروش دام، طیور، خوراک و تجهیزات با دسته‌بندی داینامیک
- **جستجوی هوشمند AI**: «سگ ژرمن تهران زیر ۶۰ میلیون» ← تبدیل عبارت طبیعی به فیلترهای قابل اجرا
- فیلتر شهر/قیمت/دسته، مرتب‌سازی، آگهی ویژه (Featured)، بازدید، علاقه‌مندی
- ثبت آگهی چندمرحله‌ای (دسته ← اطلاعات ← عکس ← انتشار) با محدودیت پلن
- چت خریدار و فروشنده با وضعیت خوانده‌شده و Polling Realtime

### 🩺 دامپزشکی
- پروفایل دامپزشکان تأییدشده با تخصص، امتیاز و قیمت
- رزرو نوبت (کلینیک / تلفنی / ویدیویی) با پرداخت از کیف پول + کمیسیون
- **AI دامپزشک واقعی** با:
  - Rate Limit روزانه بر اساس پلن (رایگان: ۱۰ پیام)
  - ثبت کامل Usage برای کنترل هزینه (Admin Dashboard)
  - ایمنی: ممنوعیت تشخیص قطعی + ارجاع به دامپزشک واقعی

### 🧠 تغذیه هوشمند (Nutrition Engine)
- موتور علمی محاسبه جیره مبتنی بر **NRC** (نه حدس AI!):
  `Animal Profile + Environmental Data + Food Database + Scientific Models → Nutrition Engine → AI → Final Response`
- محاسبه ماده خشک، پروتئین، انرژی، فیبر، کلسیم/فسفر، آب
- اثر دما و محیط نگهداری، اهداف (شیردهی، پروار، آبستنی، تخم‌گذاری...)
- ساخت جیره بهینه از بانک خوراک (۱۲+ خوراک با آنالیز کامل) + هزینه روز/ماه
- فیلتر گونه‌ای خوراک (خوراک طیور/سگ در جیره گاو نمی‌آید!)
- توضیح‌دهنده AI روی خروجی موتور

### 🐾 پرونده دیجیتال حیوان
- Animal ID یکتا + QR Code با سطح دسترسی مالک
- سوابق: واکسیناسیون، دارو، آزمایش، رویدادهای سلامت، ثبت روزانه (وزن/خوراک/تولید)
- یادآور واکسن با Notification

### 🐄 مدیریت دام و مزرعه
- ایجاد گله و گروه‌بندی
- ثبت هزینه (خوراک، دارو، دامپزشک، حمل...) + تحلیل تفکیکی

### 🛒 E-commerce
- فروشگاه‌ها با محصولات (خوراک، تجهیزات)
- سبد خرید ← پرداخت از کیف پول ← سفارش با کد پیگیری

### 💰 درآمد و اشتراک
- پلن‌های **رایگان / حرفه‌ای / فروشنده / مزرعه** با قیمت و محدودیت
- کیف پول با شارژ/پرداخت/تراکنش + امتیاز وفاداری + کد معرف

### ⚙️ پنل ادمین (RBAC)
- داشبورد آماری کامل (کاربران، آگهی، سفارش، درآمد)
- مدیریت آگهی (تأیید/معلق/ویژه)، مدیریت کاربران
- گزارش مصرف و هزینه AI

### 📱 PWA
- نصب روی گوشی (Add to Home Screen) با آیکون اختصاصی
- Service Worker با کش هوشمند (تصاویر offline)
- فارسی RTL با فونت وزیرمتن

---

## 🏗 معماری (API-First)

```
Android / Website / Admin Panel
          ↓
   Shared Backend/API   ← همین پروژه
          ↓
     Shared Database    ← Prisma + SQLite
```

- تمام قابلیت‌ها از طریق API مصرف می‌شوند — Client ها فقط UI هستند
- آماده اتصال Website آینده بدون Backend/Database جداگانه
- مستندات: مسیرهای `src/app/api/*` (گام بعدی: OpenAPI/Swagger)

## 🛠 تکنولوژی

| لایه | انتخاب | دلیل |
|------|--------|------|
| Framework | Next.js 16 (App Router) + TypeScript | SSR/SEO-Friendly برای Website آینده، API Routes یکپارچه |
| DB | Prisma ORM + SQLite | Schema-first، Type-safe، قابل مهاجرت به PostgreSQL |
| AI | z-ai-web-dev-sdk | چت، توضیح جیره، پارس جستجوی طبیعی |
| UI | Tailwind CSS 4 + shadcn/ui | طراحی مدرن RTL با تم سبز مزرعه‌ای |
| State | Zustand | روتر داخلی SPA سبک برای تجربه اپی |
| PWA | Manifest + Service Worker | نصب روی گوشی، کارکرد آفلاین تصاویر |

## 🚀 اجرا

```bash
bun install
bun run db:push     # ایجاد دیتابیس
bun run dev         # سرور توسعه روی :3000

# Seed داده اولیه (دسته‌ها، خوراک‌ها، دامپزشکان، فروشگاه‌ها، آگهی‌های نمونه)
curl -X POST http://localhost:3000/api/seed
```

### حساب‌های دمو
| شماره موبایل | نقش |
|---|---|
| 09120000001 | خریدار + **مدیر سیستم** |
| 09120000002 | فروشنده حیوانات |
| 09120000003 | فروشنده حیوانات + خوراک |
| 09120000004 | خریدار |

کد OTP در حالت دمو داخل Toast نمایش داده می‌شود (`demoCode`).

### تست جامع
```bash
python3 scripts/test_all_phases.py   # ۴۹ تست End-to-End از ۴ فاز
```

## 📂 ساختار

```
src/
├── app/
│   ├── api/               # ۲۰+ مسیر API (Auth, Ads, AI, Nutrition, ...)
│   ├── layout.tsx         # RTL + فونت وزیرمتن + PWA
│   └── page.tsx           # SPA Router
├── components/bazargah/   # ۱۵+ View اپلیکیشن
├── lib/
│   ├── nutrition-engine.ts   # 🧠 موتور علمی تغذیه (NRC-based)
│   ├── auth.ts               # Token + RBAC
│   ├── ai.ts                 # z-ai SDK wrapper
│   └── seed-data.ts          # داده اولیه
prisma/schema.prisma          # ۲۵+ مدل دیتابیس
public/                       # PWA manifest, SW, آیکون‌ها، تصاویر
scripts/test_all_phases.py    # تست خودکار ۴ فاز
```

## 🗺 نقشه راه

- **V1 (فعلاً پیاده‌سازی شده)**: Auth/OTP، Profile، Marketplace، Search، Chat، Subscription، Wallet/Payment، Vet، AI Vet، Animal Profile، Basic Nutrition، Admin
- **V2**: Health پیشرفته، Weather، Growth، Store/Map، Smart Search پیشرفته
- **V3**: Production، Reproduction، Pedigree، Economics، Food Marketplace، Transport
- **V4**: Computer Vision، Predictive AI، Farm Analytics، Full E-commerce

## 📄 مالکیت

تمام Source Code، Database Schema، API و خروجی‌های این پروژه متعلق به کارفرما است.
