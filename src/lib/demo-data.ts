/**
 * حالت دمو بازارگاه — وقتی سرور/دیتابیس در دسترس نیست (مثلاً Vercel بدون دیتابیس)،
 * تمام داده‌ها از حافظه مرورگر (localStorage) با دیتای دموی غنی شبیه‌سازی می‌شود.
 * این حالت فقط برای ارائه و تست است؛ در پروداکشن دیتابیس واقعی جایگزین می‌شود.
 */

import type { User } from './store'

// ---------- کاربر مهمان (سمت مرورگر) ----------
export const GUEST_USER: User = {
  id: 'guest-demo',
  phone: '09000000000',
  firstName: 'مهمان',
  lastName: 'بازارگاه',
  roles: '["BUYER"]',
  roleList: ['BUYER'],
  isVerified: true,
  walletBalance: 500_000_000,
  loyaltyPoints: 120,
  planKey: 'FREE',
  planExpiresAt: null,
  referralCode: 'GUEST-DEMO',
}

// ---------- پرچم حالت دمو ----------
const DEMO_FLAG = 'bazargah-demo-mode'
let _demoMode: boolean | null = null

export function isDemoMode(): boolean {
  if (_demoMode === null) {
    _demoMode = typeof window !== 'undefined' && localStorage.getItem(DEMO_FLAG) === '1'
  }
  return _demoMode
}

export function enableDemoMode() {
  _demoMode = true
  if (typeof window !== 'undefined') localStorage.setItem(DEMO_FLAG, '1')
}

// ---------- دسته‌بندی‌ها ----------
export const DEMO_CATEGORIES = [
  { id: 'c1', slug: 'live-animal', name: 'دام زنده', icon: '🄰', type: 'ANIMAL', image: '/images/cow.jpg', order: 1, attributes: JSON.stringify([{ key: 'breed', label: 'نژاد', type: 'text' }, { key: 'age', label: 'سن (ماه)', type: 'number' }, { key: 'gender', label: 'جنسیت', type: 'select', options: ['ماده', 'نر'] }, { key: 'weight', label: 'وزن (کیلو)', type: 'number' }]) },
  { id: 'c2', slug: 'feed', name: 'خوراک', icon: '🌾', type: 'FEED', image: '/images/feed.jpg', order: 2, attributes: JSON.stringify([{ key: 'brand', label: 'برند', type: 'text' }, { key: 'weight', label: 'وزن (کیلو)', type: 'number' }]) },
  { id: 'c3', slug: 'poultry', name: 'طیور', icon: '🐔', type: 'ANIMAL', image: '/images/chicken.jpg', order: 3, attributes: '[]' },
  { id: 'c4', slug: 'equipment', name: 'تجهیزات', icon: '🚜', type: 'PRODUCT', image: '/images/farm.jpg', order: 4, attributes: '[]' },
  { id: 'c5', slug: 'vet', name: 'دامپزشک', icon: '🩺', type: 'SERVICE', image: '/images/vet.jpg', order: 5, attributes: '[]' },
  { id: 'c6', slug: 'stores', name: 'فروشگاه‌ها', icon: '🏪', type: 'PRODUCT', image: '/images/goat.jpg', order: 6, attributes: '[]' },
  { id: 'c7', slug: 'sheep-goat', name: 'گوسفند و بز', icon: '🐑', type: 'ANIMAL', image: '/images/sheep.jpg', order: 7, attributes: '[]' },
  { id: 'c8', slug: 'pets', name: 'حیوانات خانگی', icon: '🐕', type: 'ANIMAL', image: '/images/dog.jpg', order: 8, attributes: '[]' },
  { id: 'c9', slug: 'horse', name: 'اسب', icon: '🐎', type: 'ANIMAL', image: '/images/horse.jpg', order: 9, attributes: '[]' },
  { id: 'c10', slug: 'calf', name: 'گوساله', icon: '🐄', type: 'ANIMAL', image: '/images/calf.jpg', order: 10, attributes: '[]' },
]

// ---------- کاربران نمونه (فروشندگان آگهی‌ها) ----------
const U2 = { id: 'u2', firstName: 'مهدی', lastName: 'قاسمی', isVerified: true, city: 'ورامین', phone: '09120000002', createdAt: '2024-05-01T00:00:00.000Z' }
const U3 = { id: 'u3', firstName: 'علی', lastName: 'محمدی', isVerified: true, city: 'شهرضا', phone: '09120000003', createdAt: '2024-04-10T00:00:00.000Z' }
export const DEMO_SELLERS: Record<string, typeof U2> = { u2: U2, u3: U3 }

// ---------- آگهی‌های نمونه ----------
const daysAgo = (d: number) => new Date(Date.now() - d * 864e5).toISOString()

export const DEMO_ADS = [
  { id: 'a1', slug: 'gav-shiri-holstein-1', title: 'گاو شیری هلشتاین', description: 'گاو هلشتاین اصیل با تولید روزانه ۳۵ لیتر شیر، کاملاً سالم با پرونده پزشکی کامل. مناسب دامداری‌های صنعتی و سنتی.', price: 380000000, negotiable: false, province: 'تهران', city: 'تهران', images: '["/images/cow.jpg"]', categoryId: 'c1', userId: 'u2', status: 'ACTIVE', attributes: JSON.stringify({ 'نژاد': 'هلشتاین', 'سن': '۲۴ ماه', 'جنسیت': 'ماده', 'وزن': '۵۵۰ کیلو' }), views: 342, isFeatured: true, ladderedUntil: daysAgo(1), createdAt: daysAgo(3), expiresAt: daysAgo(-27), category: { name: 'دام زنده', slug: 'live-animal' }, user: { id: 'u2', firstName: 'مهدی', lastName: 'قاسمی', isVerified: true, city: 'ورامین' } },
  { id: 'a2', slug: 'gusfand-zende-makuie-1', title: 'گوسفند زنده ماکویی', description: '۸ رأس گوسفند ماکویی سالم با وزن متوسط ۴۰ کیلو، مناسب عید قربان و پروار. قیمت پایه برای هر رأس است.', price: 22500000, negotiable: true, province: 'آذربایجان غربی', city: 'ارومیه', images: '["/images/sheep.jpg"]', categoryId: 'c7', userId: 'u2', status: 'ACTIVE', attributes: JSON.stringify({ breed: 'ماکویی', age: 8, gender: 'ماده', weight: 40 }), views: 187, isFeatured: false, ladderedUntil: daysAgo(2), createdAt: daysAgo(4), expiresAt: daysAgo(-26), category: { name: 'گوسفند و بز', slug: 'sheep-goat' }, user: { id: 'u2', firstName: 'مهدی', lastName: 'قاسمی', isVerified: true, city: 'ورامین' } },
  { id: 'a3', slug: 'morgh-tokhmgozar-1', title: 'مرغ تخم‌گذار فعال', description: 'مجموع ۶۰ قطعه مرغ لگ‌هورن تخم‌گذار فعال با بازدهی بالای ۸۰٪. عکس‌های واقعی از مرغداری.', price: 20500000, negotiable: false, province: 'تهران', city: 'شهریار', images: '["/images/chicken.jpg"]', categoryId: 'c3', userId: 'u3', status: 'ACTIVE', attributes: JSON.stringify({ breed: 'لگ‌هورن', age: 6, gender: 'ماده', weight: 2 }), views: 156, isFeatured: false, ladderedUntil: daysAgo(1), createdAt: daysAgo(5), expiresAt: daysAgo(-25), category: { name: 'طیور', slug: 'poultry' }, user: { id: 'u3', firstName: 'علی', lastName: 'محمدی', isVerified: true, city: 'شهرضا' } },
  { id: 'a4', slug: 'boz-santi-asil-1', title: 'بز سانتی اصیل', description: 'دو رأس بز سانتی با شاخ‌های متقارن، عالی برای پرورش و پروار. دارای شناسنامه و سوابق واکسیناسیون.', price: 26000000, negotiable: false, province: 'فارس', city: 'شیراز', images: '["/images/goat.jpg"]', categoryId: 'c7', userId: 'u3', status: 'ACTIVE', attributes: JSON.stringify({ breed: 'سانتی', age: 24, gender: 'ماده', weight: 60 }), views: 143, isFeatured: false, ladderedUntil: daysAgo(3), createdAt: daysAgo(6), expiresAt: daysAgo(-24), category: { name: 'گوسفند و بز', slug: 'sheep-goat' }, user: { id: 'u3', firstName: 'علی', lastName: 'محمدی', isVerified: true, city: 'شهرضا' } },
  { id: 'a5', slug: 'gusale-provari-simmental-1', title: 'گوساله پرواری سیمنتال', description: 'گوساله نر سیمنتال با ژنتیک عالی برای پروار، ۵ ماهه با وزن ۱۸۰ کیلو. کاملاً شیرخوارگی‌اش کامل شده.', price: 31000000, negotiable: false, province: 'تهران', city: 'پاکدشت', images: '["/images/calf.jpg"]', categoryId: 'c10', userId: 'u2', status: 'ACTIVE', attributes: JSON.stringify({ breed: 'سیمنتال', age: 5, gender: 'نر', weight: 180 }), views: 289, isFeatured: true, ladderedUntil: daysAgo(0), createdAt: daysAgo(2), expiresAt: daysAgo(-28), category: { name: 'گوساله', slug: 'calf' }, user: { id: 'u2', firstName: 'مهدی', lastName: 'قاسمی', isVerified: true, city: 'ورامین' } },
  { id: 'a6', slug: 'gusale-holstein-nr-1', title: 'گوساله پرواری هلشتاین نر', description: 'گوساله هلشتاین با رشد سریع، مناسب دامداری‌های پرواری. قیمت توافقی برای خرید بالای ۵ رأس.', price: 34000000, negotiable: true, province: 'اصفهان', city: 'نجف‌آباد', images: '["/images/calf.jpg"]', categoryId: 'c10', userId: 'u3', status: 'ACTIVE', attributes: JSON.stringify({ breed: 'هلشتاین', age: 5, gender: 'نر', weight: 165 }), views: 198, isFeatured: false, ladderedUntil: daysAgo(2), createdAt: daysAgo(7), expiresAt: daysAgo(-23), category: { name: 'گوساله', slug: 'calf' }, user: { id: 'u3', firstName: 'علی', lastName: 'محمدی', isVerified: true, city: 'شهرضا' } },
  { id: 'a7', slug: 'asb-arab-asil-1', title: 'اسب عرب اصیل با شناسنامه', description: 'مادیان عرب اصیل ۵ ساله با شناسنامه معتبر، آموزش‌دیده برای سوارکاری. بسیار آرام و سالم.', price: 850000000, negotiable: false, province: 'یزد', city: 'یزد', images: '["/images/horse.jpg"]', categoryId: 'c9', userId: 'u2', status: 'ACTIVE', attributes: JSON.stringify({ breed: 'عرب', age: 60, gender: 'ماده', weight: 420 }), views: 412, isFeatured: true, ladderedUntil: daysAgo(1), createdAt: daysAgo(8), expiresAt: daysAgo(-22), category: { name: 'اسب', slug: 'horse' }, user: { id: 'u2', firstName: 'مهدی', lastName: 'قاسمی', isVerified: true, city: 'ورامین' } },
  { id: 'a8', slug: 'sag-german-shepherd-1', title: 'سگ ژرمن شپردد با مدرک', description: 'سگ ژرمن شپردد خالص ۸ ماهه با شناسنامه و مدارک اصالت، واکسینه و آموزش‌دیده اولیه.', price: 65000000, negotiable: false, province: 'تهران', city: 'تهران', images: '["/images/dog.jpg"]', categoryId: 'c8', userId: 'u3', status: 'ACTIVE', attributes: JSON.stringify({ breed: 'ژرمن شپردد', age: 8, gender: 'نر', weight: 28 }), views: 331, isFeatured: false, ladderedUntil: daysAgo(2), createdAt: daysAgo(9), expiresAt: daysAgo(-21), category: { name: 'حیوانات خانگی', slug: 'pets' }, user: { id: 'u3', firstName: 'علی', lastName: 'محمدی', isVerified: true, city: 'شهرضا' } },
  { id: 'a9', slug: 'yonge-darje-1', title: 'یونجه خشک درجه یک - محموله ۱۰ تن', description: 'یونجه تازه از مزارع مغان، بسته‌بندی عدل ۳۰ کیلویی. ارسال به سراسر کشور با کامیون.', price: 2550000, negotiable: false, province: 'آذربایجان شرقی', city: 'مغان', images: '["/images/feed.jpg"]', categoryId: 'c2', userId: 'u3', status: 'ACTIVE', attributes: JSON.stringify({ brand: 'مغان', weight: 30 }), views: 89, isFeatured: false, ladderedUntil: daysAgo(4), createdAt: daysAgo(10), expiresAt: daysAgo(-20), category: { name: 'خوراک', slug: 'feed' }, user: { id: 'u3', firstName: 'علی', lastName: 'محمدی', isVerified: true, city: 'شهرضا' } },
]

// ---------- دامپزشکان ----------
export const DEMO_VETS = [
  { id: 'v1', name: 'دکتر امیر رضایی', specialty: 'دام بزرگ و دام سبک', bio: '۱۵ سال سابقه درمان دام، متخصص پرواربندی و بارداری گاو و گوسفند', province: 'تهران', city: 'تهران', image: null, rating: 4.8, reviewCount: 132, pricePerSession: 250000, isVerified: true, commissionRate: 10, services: '["ویزیت کلینیک","ویزیت در محل","مشاوره تلفنی"]', availableSlots: '["09:00","11:00","14:00","16:00","18:00"]' },
  { id: 'v2', name: 'دکتر مریم احمدی', specialty: 'طیور و آبزیان', bio: 'متخصص بیماری‌های طیور، مشاور مرغداری‌های صنعتی', province: 'اصفهان', city: 'اصفهان', image: null, rating: 4.7, reviewCount: 98, pricePerSession: 200000, isVerified: true, commissionRate: 10, services: '["ویزیت کلینیک","مشاوره مرغداری"]', availableSlots: '["08:00","10:00","15:00"]' },
  { id: 'v3', name: 'دکتر سعید کریمی', specialty: 'حیوانات خانگی', bio: 'جراح دامپزشکی، متخصص سگ و گربه با ۱۰ سال سابقه', province: 'فارس', city: 'شیراز', image: null, rating: 4.9, reviewCount: 210, pricePerSession: 300000, isVerified: true, commissionRate: 10, services: '["جراحی","ویزیت کلینیک","واکسیناسیون"]', availableSlots: '["09:00","12:00","17:00","19:00"]' },
  { id: 'v4', name: 'دکتر فاطمه موسوی', specialty: 'تغذیه دام و طیور', bio: 'دکترای تغذیه دام، مشاور فرمولاسیون خوراک گله‌های صنعتی', province: 'خراسان', city: 'مشهد', image: null, rating: 4.6, reviewCount: 76, pricePerSession: 220000, isVerified: true, commissionRate: 10, services: '["مشاوره تغذیه","بازدید مزرعه"]', availableSlots: '["10:00","13:00","16:00"]' },
  { id: 'v5', name: 'دکتر حسین نوری', specialty: 'زنبور و دام کوچک', bio: 'متخصص بیماری‌های زنبور عسل و دام‌های کوچک', province: 'آذربایجان شرقی', city: 'تبریز', image: null, rating: 4.5, reviewCount: 54, pricePerSession: 180000, isVerified: false, commissionRate: 10, services: '["ویزیت کلینیک"]', availableSlots: '["09:00","11:00","14:00"]' },
]

// ---------- فروشگاه‌ها و محصولات ----------
export const DEMO_STORES = [
  {
    id: 'st1', name: 'فروشگاه دام‌یار مرکزی', slug: 'damyar-central', description: 'تأمین خوراک و تجهیزات دامداری‌های صنعتی با بهترین قیمت', province: 'تهران', city: 'تهران', phone: '02155667788', rating: 4.7, isActive: true, ownerId: 'u3', createdAt: daysAgo(60),
    products: [
      { id: 'p1', storeId: 'st1', slug: 'p-yonge-30', name: 'یونجه خشک درجه یک - عدل ۳۰ کیلویی', price: 255000, category: 'FOOD', image: '/images/feed.jpg', stock: 200, description: 'یونجه تازه دشت مغان، پروتئین بالای ۱۶٪', isActive: true, createdAt: daysAgo(50) },
      { id: 'p2', storeId: 'st1', slug: 'p-provari-40', name: 'خوراک پرواری گاو - کیسه ۴۰ کیلویی', price: 480000, category: 'FOOD', image: '/images/feed.jpg', stock: 150, description: 'فرمول ویژه پروار با انرژی و پروتئین متعادل', isActive: true, createdAt: daysAgo(50) },
      { id: 'p3', storeId: 'st1', slug: 'p-abkhori', name: 'آبخوری خودکار دام', price: 1250000, category: 'EQUIPMENT', image: '/images/farm.jpg', stock: 30, description: 'آبخوری استیل ضدزنگ با فلوتر ایتالیایی', isActive: true, createdAt: daysAgo(45) },
    ],
  },
  {
    id: 'st2', name: 'حیوانات خانگی پت‌لند', slug: 'petland', description: 'همه چیز برای سگ، گربه و پرندگان خانگی', province: 'اصفهان', city: 'اصفهان', phone: '03133445566', rating: 4.8, isActive: true, ownerId: 'u3', createdAt: daysAgo(55),
    products: [
      { id: 'p4', storeId: 'st2', slug: 'p-royal-15', name: 'خوراک خشک سگ رویال کنین ۱۵ کیلو', price: 1890000, category: 'FOOD', image: '/images/dog.jpg', stock: 25, description: 'اصل فرانسه، مناسب نژاد بزرگ', isActive: true, createdAt: daysAgo(40) },
      { id: 'p5', storeId: 'st2', slug: 'p-band-charmi', name: 'بند و قلاده چرمی حرفه‌ای', price: 320000, category: 'TOOL', image: '/images/dog.jpg', stock: 50, description: 'چرم طبیعی دست‌دوز', isActive: true, createdAt: daysAgo(40) },
    ],
  },
  {
    id: 'st3', name: 'خوراک طیور آریا', slug: 'arya-poultry', description: 'خوراک صنعتی طیور با آنالیز تضمینی', province: 'البرز', city: 'کرج', phone: '02644556677', rating: 4.5, isActive: true, ownerId: 'u2', createdAt: daysAgo(50),
    products: [
      { id: 'p6', storeId: 'st3', slug: 'p-morgh-40', name: 'خوراک مرغ تخم‌گذار - کیسه ۴۰ کیلویی', price: 540000, category: 'FOOD', image: '/images/chicken.jpg', stock: 300, description: 'کلسیم بالا برای تخم‌گذاری بهینه', isActive: true, createdAt: daysAgo(35) },
      { id: 'p7', storeId: 'st3', slug: 'p-abkhori-tuyur', name: 'آبخوری ناودانی طیور ۳ متری', price: 890000, category: 'EQUIPMENT', image: '/images/chicken.jpg', stock: 40, description: 'پلاستیک فودگرید ضدجلبک', isActive: true, createdAt: daysAgo(35) },
    ],
  },
]

// ---------- پلن‌های اشتراک ----------
export const DEMO_PLANS = [
  { id: 'pl1', key: 'FREE', name: 'رایگان', price: 0, dailyAiMessages: 10, maxActiveAds: 5, color: '#64748b', features: '["10 پیام AI روزانه","5 آگهی فعال","پرونده حیوان","تغذیه هوشمند پایه"]' },
  { id: 'pl2', key: 'PRO', name: 'حرفه‌ای', price: 149000, dailyAiMessages: 100, maxActiveAds: 15, color: '#16a34a', features: '["100 پیام AI روزانه","15 آگهی فعال","تغذیه هوشمند پیشرفته","What-If مقایسه","پشتیبانی اولویت‌دار"]' },
  { id: 'pl3', key: 'SELLER', name: 'فروشنده', price: 349000, dailyAiMessages: 100, maxActiveAds: 40, color: '#0891b2', features: '["آگهی نامحدود","نردبان رایگان ماهانه","فروشگاه اختصاصی","3 آگهی ویژه","آمار بازدید کامل"]' },
  { id: 'pl4', key: 'FARM', name: 'مزرعه', price: 749000, dailyAiMessages: 500, maxActiveAds: 100, color: '#b45309', features: '["مدیریت گله نامحدود","تحلیل سود و زیان","گزارش PDF","AI نامحدود تقریباً","پشتیبانی اختصاصی"]' },
]

// ---------- حیوانات نمونه ----------
export const DEMO_ANIMALS = [
  { id: 'an1', publicId: 'BAZ-CO-A1B2C3', userId: 'guest-demo', name: 'نازنین', species: 'COW', breed: 'هلشتاین', gender: 'FEMALE', birthDate: '2022-03-15', weight: 550, color: 'سیاه و سفید', purpose: 'MILK', environment: 'FARM', images: '["/images/cow.jpg"]', notes: 'گاو شیری ممتاز، تولید روزانه ۳۰ لیتر', isPublic: false, createdAt: daysAgo(30), vaccinations: [], healthRecords: [], dailyLogs: [] },
  { id: 'an2', publicId: 'BAZ-DO-D4E5F6', userId: 'guest-demo', name: 'رکس', species: 'DOG', breed: 'ژرمن شپردد', gender: 'MALE', birthDate: '2024-01-10', weight: 28, color: 'قهوه‌ای و مشکی', purpose: 'PET', environment: 'HOUSE', images: '["/images/dog.jpg"]', notes: 'سگ نگهبانی، واکسینه', isPublic: false, createdAt: daysAgo(20), vaccinations: [], healthRecords: [], dailyLogs: [] },
]

export const DEMO_ANIMAL_RECORDS: Record<string, { healthRecords: Record<string, unknown>[]; vaccinations: Record<string, unknown>[]; medications: Record<string, unknown>[]; tests: Record<string, unknown>[]; dailyLogs: Record<string, unknown>[] }> = {
  an1: {
    healthRecords: [{ id: 'hr1', animalId: 'an1', type: 'CHECKUP', title: 'معاینه دوره‌ای', description: 'حالت عمومی خوب، نشخوار طبیعی، دمای بدن ۳۸.۵ درجه', vetName: 'دکتر امیر رضایی', date: daysAgo(12).slice(0, 10), createdAt: daysAgo(12) }],
    vaccinations: [{ id: 'vx1', animalId: 'an1', vaccine: 'بروسلوز', date: daysAgo(60).slice(0, 10), nextDate: daysAgo(-305).slice(0, 10), vetName: 'دکتر امیر رضایی', createdAt: daysAgo(60) }, { id: 'vx2', animalId: 'an1', vaccine: 'بیماری خاموش (اپتا)', date: daysAgo(90).slice(0, 10), nextDate: null, vetName: 'دکتر امیر رضایی', createdAt: daysAgo(90) }],
    medications: [],
    tests: [{ id: 'ts1', animalId: 'an1', name: 'آزمایش خون کامل', result: 'طبیعی — کمبود مینرال خفیف', date: daysAgo(15).slice(0, 10), createdAt: daysAgo(15) }],
    dailyLogs: [{ id: 'dl1', animalId: 'an1', date: daysAgo(1).slice(0, 10), weight: 552, feedKg: 22, waterL: 65, production: '31 لیتر شیر', activity: 'طبیعی', symptoms: null, createdAt: daysAgo(1) }, { id: 'dl2', animalId: 'an1', date: daysAgo(2).slice(0, 10), weight: 550, feedKg: 21, waterL: 60, production: '30 لیتر شیر', activity: 'طبیعی', symptoms: null, createdAt: daysAgo(2) }],
  },
  an2: {
    healthRecords: [{ id: 'hr2', animalId: 'an2', type: 'TREATMENT', title: 'درمان عفونت گوش', description: 'قطره آنتی‌بیوتیکی به مدت ۷ روز تجویز شد', vetName: 'دکتر سعید کریمی', date: daysAgo(20).slice(0, 10), createdAt: daysAgo(20) }],
    vaccinations: [{ id: 'vx3', animalId: 'an2', vaccine: 'هاری', date: daysAgo(45).slice(0, 10), nextDate: daysAgo(-320).slice(0, 10), vetName: 'دکتر سعید کریمی', createdAt: daysAgo(45) }],
    medications: [{ id: 'md1', animalId: 'an2', name: 'قطره گوش آنتی‌بیوتیک', dose: '۳ قطره هر ۱۲ ساعت', startDate: daysAgo(20).slice(0, 10), endDate: daysAgo(13).slice(0, 10), notes: 'پس از اتمام دوره مراجعه مجدد', createdAt: daysAgo(20) }],
    tests: [],
    dailyLogs: [{ id: 'dl3', animalId: 'an2', date: daysAgo(1).slice(0, 10), weight: 28.5, feedKg: 0.5, waterL: 2, production: null, activity: 'شاد و فعال', symptoms: null, createdAt: daysAgo(1) }],
  },
}

// ---------- گله‌ها و هزینه‌ها ----------
export const DEMO_HERDS = [
  { id: 'h1', userId: 'guest-demo', name: 'گله گاو شیری', species: 'COW', notes: '۴۵ رأس هلشتاین و سیمنتال', createdAt: daysAgo(25) },
  { id: 'h2', userId: 'guest-demo', name: 'گله گوسفند ماکویی', species: 'SHEEP', notes: '۱۲۰ رأس، دوره پروار', createdAt: daysAgo(18) },
]

export const DEMO_EXPENSES = [
  { id: 'e1', userId: 'guest-demo', animalId: null, herdId: 'h1', type: 'FEED', amount: 12500000, note: 'خوراک پرواری - ۵۰ کیسه', date: daysAgo(5).slice(0, 10), createdAt: daysAgo(5) },
  { id: 'e2', userId: 'guest-demo', animalId: null, herdId: 'h1', type: 'VET', amount: 2800000, note: 'ویزیت دوره‌ای و واکسیناسیون', date: daysAgo(12).slice(0, 10), createdAt: daysAgo(12) },
  { id: 'e3', userId: 'guest-demo', animalId: null, herdId: 'h2', type: 'MEDICINE', amount: 3200000, note: 'داروی ضدانگل گله', date: daysAgo(8).slice(0, 10), createdAt: daysAgo(8) },
  { id: 'e4', userId: 'guest-demo', animalId: null, herdId: 'h1', type: 'TRANSPORT', amount: 1500000, note: 'حمل‌ونقل یونجه', date: daysAgo(15).slice(0, 10), createdAt: daysAgo(15) },
  { id: 'e5', userId: 'guest-demo', animalId: null, herdId: 'h2', type: 'LABOR', amount: 8000000, note: 'دستمزد کارگر مزرعه - ماهانه', date: daysAgo(20).slice(0, 10), createdAt: daysAgo(20) },
  { id: 'e6', userId: 'guest-demo', animalId: null, herdId: 'h1', type: 'FEED', amount: 4100000, note: 'سیلاژ ذرت', date: daysAgo(25).slice(0, 10), createdAt: daysAgo(25) },
]

// ---------- اعلان‌ها ----------
export const DEMO_NOTIFS = [
  { id: 'n1', userId: 'guest-demo', title: 'به بازارگاه خوش آمدید 🌿', body: 'حساب دمو شما آماده است؛ همه امکانات را بدون ثبت‌نام امتحان کنید', type: 'SYSTEM', isRead: false, createdAt: daysAgo(1) },
  { id: 'n2', userId: 'guest-demo', title: 'یادآور واکسن', body: 'واکسن بروسلوز نازنین ۱۰ روز دیگر نیاز به تمدید دارد', type: 'REMINDER', isRead: false, createdAt: daysAgo(2) },
  { id: 'n3', userId: 'guest-demo', title: 'آگهی ویژه جدید', body: 'گاو شیری هلشتاین در تهران ثبت شد — ۳۵ لیتر شیر روزانه', type: 'AD', isRead: true, createdAt: daysAgo(3) },
]

// ---------- چت ----------
export const DEMO_CONVS = [
  {
    id: 'cv1', buyerId: 'guest-demo', sellerId: 'u2', adId: 'a1', lastMessage: 'قیمت آخرتون چنده؟', lastMessageAt: daysAgo(1), createdAt: daysAgo(3),
    buyer: { id: 'guest-demo', firstName: 'مهمان', lastName: 'بازارگاه', avatar: null },
    seller: { id: 'u2', firstName: 'مهدی', lastName: 'قاسمی', avatar: null },
    messages: [],
  },
]
export const DEMO_MESSAGES: Record<string, Record<string, unknown>[]> = {
  cv1: [
    { id: 'm1', conversationId: 'cv1', senderId: 'guest-demo', content: 'سلام، گاو هلشتاین هنوز موجوده؟', isRead: true, createdAt: daysAgo(2) },
    { id: 'm2', conversationId: 'cv1', senderId: 'u2', content: 'سلام وقت بخیر 🌹 بله موجوده، ۳۵ لیتر شیر روزانه میده', isRead: true, createdAt: daysAgo(2) },
    { id: 'm3', conversationId: 'cv1', senderId: 'guest-demo', content: 'قیمت آخرتون چنده؟', isRead: false, createdAt: daysAgo(1) },
  ],
}

// ---------- سفارش و کیف پول ----------
export const DEMO_ORDERS = [
  {
    id: 'o1', orderNo: 'ORD-DEMO1', userId: 'guest-demo', items: JSON.stringify([{ name: 'یونجه خشک درجه یک - عدل ۳۰ کیلویی', qty: 2, price: 255000 }]), total: 510000, address: 'تهران، میدان آزادی', phone: '09000000000', status: 'PAID', createdAt: daysAgo(6),
    orderItems: [{ id: 'oi1', orderId: 'o1', productId: 'p1', qty: 2, price: 255000, product: { name: 'یونجه خشک درجه یک - عدل ۳۰ کیلویی', image: '/images/feed.jpg' } }],
  },
]

export const DEMO_WALLET_TX = [
  { id: 'w1', userId: 'guest-demo', amount: 500000000, type: 'CHARGE', description: 'اعتبار دمو برای تست', createdAt: daysAgo(1) },
]

// ---------- Helpers ----------
export function lsGet<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem('bazargah-demo-' + key)
    return raw !== null ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function lsSet(key: string, value: unknown) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem('bazargah-demo-' + key, JSON.stringify(value)) } catch { /* ignore */ }
}

/** خواندن با مقدار اولیه — اولین بار seed ذخیره می‌شود تا تغییرات کاربر ماندگار باشد */
export function loadInit<T>(key: string, seed: T): T {
  const cur = lsGet<T | null>(key, null)
  if (cur === null) { lsSet(key, seed); return seed }
  return cur
}

export function currentUser(): User {
  try {
    const raw = localStorage.getItem('bazargah-user')
    if (raw) return JSON.parse(raw) as User
  } catch { /* ignore */ }
  return GUEST_USER
}

export function saveCurrentUser(u: User) {
  if (typeof window !== 'undefined') localStorage.setItem('bazargah-user', JSON.stringify(u))
}
