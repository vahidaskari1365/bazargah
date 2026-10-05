import { db } from './db'

/**
 * Seed پایگاه داده بازارگاه — دسته‌بندی‌ها، خوراک‌ها، دامپزشکان،
 * فروشگاه‌ها، محصولات، پلن‌های اشتراک، کاربران نمونه و آگهی‌های نمونه
 */

const categories = [
  { slug: 'live-animal', name: 'دام زنده', icon: '🄰', type: 'ANIMAL', image: '/images/cow.jpg', order: 1,
    attributes: JSON.stringify([
      { key: 'breed', label: 'نژاد', type: 'text' },
      { key: 'age', label: 'سن (ماه)', type: 'number' },
      { key: 'gender', label: 'جنسیت', type: 'select', options: ['ماده', 'نر'] },
      { key: 'weight', label: 'وزن (کیلو)', type: 'number' },
    ]) },
  { slug: 'feed', name: 'خوراک', icon: '🌾', type: 'FEED', image: '/images/feed.jpg', order: 2,
    attributes: JSON.stringify([
      { key: 'brand', label: 'برند', type: 'text' },
      { key: 'weight', label: 'وزن (کیلو)', type: 'number' },
    ]) },
  { slug: 'poultry', name: 'طیور', icon: '🐔', type: 'ANIMAL', image: '/images/chicken.jpg', order: 3, attributes: '[]' },
  { slug: 'equipment', name: 'تجهیزات', icon: '🚜', type: 'PRODUCT', image: '/images/farm.jpg', order: 4, attributes: '[]' },
  { slug: 'vet', name: 'دامپزشک', icon: '🩺', type: 'SERVICE', image: '/images/vet.jpg', order: 5, attributes: '[]' },
  { slug: 'stores', name: 'فروشگاه‌ها', icon: '🏪', type: 'PRODUCT', image: '/images/goat.jpg', order: 6, attributes: '[]' },
  { slug: 'sheep-goat', name: 'گوسفند و بز', icon: '🐑', type: 'ANIMAL', image: '/images/sheep.jpg', order: 7, attributes: '[]' },
  { slug: 'pets', name: 'حیوانات خانگی', icon: '🐕', type: 'ANIMAL', image: '/images/dog.jpg', order: 8, attributes: '[]' },
  { slug: 'horse', name: 'اسب', icon: '🐎', type: 'ANIMAL', image: '/images/horse.jpg', order: 9, attributes: '[]' },
  { slug: 'calf', name: 'گوساله', icon: '🐄', type: 'ANIMAL', image: '/images/calf.jpg', order: 10, attributes: '[]' },
]

export const foods = [
  { name: 'یونجه خشک', category: 'ROUGHAGE', species: 'ALL', dryMatter: 90, protein: 17, energy: 1.7, fiber: 30, fat: 2.5, calcium: 1.4, phosphorus: 0.22, pricePerKg: 8500 },
  { name: 'کاه گندم', category: 'ROUGHAGE', species: 'ALL', dryMatter: 89, protein: 4, energy: 0.9, fiber: 41, fat: 1.5, calcium: 0.3, phosphorus: 0.08, pricePerKg: 3000 },
  { name: 'سیلاژ ذرت', category: 'ROUGHAGE', species: 'ALL', dryMatter: 35, protein: 8, energy: 2.2, fiber: 24, fat: 3, calcium: 0.3, phosphorus: 0.2, pricePerKg: 2500 },
  { name: 'ذرت دانه‌ای', category: 'ENERGY', species: 'ALL', dryMatter: 88, protein: 9, energy: 3.3, fiber: 2.5, fat: 4, calcium: 0.02, phosphorus: 0.28, pricePerKg: 12000 },
  { name: 'جو دانه‌ای', category: 'CONCENTRATE', species: 'ALL', dryMatter: 88, protein: 12, energy: 2.9, fiber: 6, fat: 2, calcium: 0.05, phosphorus: 0.34, pricePerKg: 11000 },
  { name: 'کنجاله سویا', category: 'PROTEIN', species: 'ALL', dryMatter: 89, protein: 48, energy: 3.0, fiber: 7, fat: 1.5, calcium: 0.3, phosphorus: 0.65, pricePerKg: 28000 },
  { name: 'کنجاله کلزا', category: 'PROTEIN', species: 'ALL', dryMatter: 90, protein: 36, energy: 2.6, fiber: 12, fat: 2, calcium: 0.7, phosphorus: 1.0, pricePerKg: 19000 },
  { name: 'سبوس گندم', category: 'CONCENTRATE', species: 'ALL', dryMatter: 88, protein: 16, energy: 1.9, fiber: 11, fat: 4, calcium: 0.15, phosphorus: 1.1, pricePerKg: 7000 },
  { name: 'مکمل معدنی دام', category: 'MINERAL', species: 'ALL', dryMatter: 98, protein: 0, energy: 0, fiber: 0, fat: 0, calcium: 20, phosphorus: 8, pricePerKg: 45000 },
  { name: 'خوراک مرغ تخم‌گذار', category: 'CONCENTRATE', species: 'POULTRY', dryMatter: 90, protein: 17, energy: 2.8, fiber: 5, fat: 3.5, calcium: 3.6, phosphorus: 0.45, pricePerKg: 13500 },
  { name: 'خوراک پرواری', category: 'CONCENTRATE', species: 'POULTRY', dryMatter: 90, protein: 21, energy: 3.0, fiber: 4.5, fat: 4, calcium: 0.9, phosphorus: 0.4, pricePerKg: 15000 },
  { name: 'خوراک خشک سگ', category: 'CONCENTRATE', species: 'DOG', dryMatter: 92, protein: 24, energy: 3.4, fiber: 4, fat: 12, calcium: 1.1, phosphorus: 0.9, brand: 'رویال کنین', pricePerKg: 85000 },
]

const vets = [
  { name: 'دکتر امیر رضایی', specialty: 'دام بزرگ و دام سبک', bio: '۱۵ سال سابقه درمان دام، متخصص پرواربندی و بارداری گاو و گوسفند', province: 'تهران', city: 'تهران', rating: 4.8, reviewCount: 132, pricePerSession: 250000, isVerified: true, services: '["ویزیت کلینیک","ویزیت در محل","مشاوره تلفنی"]', availableSlots: '["09:00","11:00","14:00","16:00","18:00"]' },
  { name: 'دکتر مریم احمدی', specialty: 'طیور و آبزیان', bio: 'متخصص بیماری‌های طیور، مشاور مرغداری‌های صنعتی', province: 'اصفهان', city: 'اصفهان', rating: 4.7, reviewCount: 98, pricePerSession: 200000, isVerified: true, services: '["ویزیت کلینیک","مشاوره مرغداری"]', availableSlots: '["08:00","10:00","15:00"]' },
  { name: 'دکتر سعید کریمی', specialty: 'حیوانات خانگی', bio: 'جراح دامپزشکی، متخصص سگ و گربه با ۱۰ سال سابقه', province: 'فارس', city: 'شیراز', rating: 4.9, reviewCount: 210, pricePerSession: 300000, isVerified: true, services: '["جراحی","ویزیت کلینیک","واکسیناسیون"]', availableSlots: '["09:00","12:00","17:00","19:00"]' },
  { name: 'دکتر فاطمه موسوی', specialty: 'تغذیه دام و طیور', bio: 'دکترای تغذیه دام، مشاور فرمولاسیون خوراک گله‌های صنعتی', province: 'خراسان', city: 'مشهد', rating: 4.6, reviewCount: 76, pricePerSession: 220000, isVerified: true, services: '["مشاوره تغذیه","بازدید مزرعه"]', availableSlots: '["10:00","13:00","16:00"]' },
  { name: 'دکتر حسین نوری', specialty: 'زنبور و دام کوچک', bio: 'متخصص بیماری‌های زنبور عسل و دام‌های کوچک', province: 'آذربایجان شرقی', city: 'تبریز', rating: 4.5, reviewCount: 54, pricePerSession: 180000, isVerified: false, services: '["ویزیت کلینیک"]', availableSlots: '["09:00","11:00","14:00"]' },
]

const stores = [
  { name: 'فروشگاه دام‌یار مرکزی', slug: 'damyar-central', description: 'تأمین خوراک و تجهیزات دامداری‌های صنعتی با بهترین قیمت', province: 'تهران', city: 'تهران', phone: '02155667788', rating: 4.7 },
  { name: 'حیوانات خانگی پت‌لند', slug: 'petland', description: 'همه چیز برای سگ، گربه و پرندگان خانگی', province: 'اصفهان', city: 'اصفهان', phone: '03133445566', rating: 4.8 },
  { name: 'خوراک طیور آریا', slug: 'arya-poultry', description: 'خوراک صنعتی طیور با آنالیز تضمینی', province: 'البرز', city: 'کرج', phone: '02644556677', rating: 4.5 },
]

const products = [
  { store: 'damyar-central', name: 'یونجه خشک درجه یک - عدل ۳۰ کیلویی', price: 255000, category: 'FOOD', image: '/images/feed.jpg', stock: 200, description: 'یونجه تازه دشت مغان، پروتئین بالای ۱۶٪' },
  { store: 'damyar-central', name: 'خوراک پرواری گاو - کیسه ۴۰ کیلویی', price: 480000, category: 'FOOD', image: '/images/feed.jpg', stock: 150, description: 'فرمول ویژه پروار با انرژی و پروتئین متعادل' },
  { store: 'damyar-central', name: 'آبخوری خودکار دام', price: 1250000, category: 'EQUIPMENT', image: '/images/farm.jpg', stock: 30, description: 'آبخوری استیل ضدزنگ با فلوتر ایتالیایی' },
  { store: 'petland', name: 'خوراک خشک سگ رویال کنین ۱۵ کیلو', price: 1890000, category: 'FOOD', image: '/images/dog.jpg', stock: 25, description: 'اصل فرانسه، مناسب نژاد بزرگ' },
  { store: 'petland', name: 'بند و قلاده چرمی حرفه‌ای', price: 320000, category: 'TOOL', image: '/images/dog.jpg', stock: 50, description: 'چرم طبیعی دست‌دوز' },
  { store: 'arya-poultry', name: 'خوراک مرغ تخم‌گذار - کیسه ۴۰ کیلویی', price: 540000, category: 'FOOD', image: '/images/chicken.jpg', stock: 300, description: 'کلسیم بالا برای تخم‌گذاری بهینه' },
  { store: 'arya-poultry', name: 'آبخوری ناودانی طیور ۳ متری', price: 890000, category: 'EQUIPMENT', image: '/images/chicken.jpg', stock: 40, description: 'پلاستیک فودگرید ضدجلبک' },
]

const plans = [
  { key: 'FREE', name: 'رایگان', price: 0, dailyAiMessages: 10, maxActiveAds: 5, color: '#64748b', features: '["10 پیام AI روزانه","5 آگهی فعال","پرونده حیوان","تغذیه هوشمند پایه"]' },
  { key: 'PRO', name: 'حرفه‌ای', price: 149000, dailyAiMessages: 100, maxActiveAds: 15, color: '#16a34a', features: '["100 پیام AI روزانه","15 آگهی فعال","تغذیه هوشمند پیشرفته","What-If مقایسه","پشتیبانی اولویت‌دار"]' },
  { key: 'SELLER', name: 'فروشنده', price: 349000, dailyAiMessages: 100, maxActiveAds: 40, color: '#0891b2', features: '["آگهی نامحدود","نردبان رایگان ماهانه","فروشگاه اختصاصی","3 آگهی ویژه","آمار بازدید کامل"]' },
  { key: 'FARM', name: 'مزرعه', price: 749000, dailyAiMessages: 500, maxActiveAds: 100, color: '#b45309', features: '["مدیریت گله نامحدود","تحلیل سود و زیان","گزارش PDF","AI نامحدود تقریباً","پشتیبانی اختصاصی"]' },
]

export async function seedDatabase() {
  // Settings
  await db.setting.upsert({ where: { key: 'seeded' }, update: {}, create: { key: 'seeded', value: '1' } })

  // Categories
  for (const c of categories) {
    await db.category.upsert({ where: { slug: c.slug }, update: {}, create: c })
  }

  // Foods
  const foodCount = await db.food.count()
  if (foodCount === 0) {
    for (const f of foods) {
      await db.food.create({ data: f })
    }
  }

  // Vets
  const vetCount = await db.vet.count()
  if (vetCount === 0) {
    for (const v of vets) {
      await db.vet.create({ data: v })
    }
  }

  // Stores & products
  for (const s of stores) {
    await db.store.upsert({ where: { slug: s.slug }, update: {}, create: s })
  }
  const allStores = await db.store.findMany()
  const productCount = await db.product.count()
  if (productCount === 0) {
    for (const p of products) {
      const store = allStores.find(s => s.slug === p.store)
      if (store) {
        const { store: _s, ...data } = p
        await db.product.create({ data: { ...data, slug: `p-${Math.random().toString(36).slice(2, 9)}`, storeId: store.id } })
      }
    }
  }

  // Plans
  for (const p of plans) {
    await db.subscriptionPlan.upsert({ where: { key: p.key }, update: {}, create: p })
  }

  // Demo users
  const demoUsers = [
    { phone: '09120000001', firstName: 'وحید', lastName: 'عسکری', province: 'تهران', city: 'تهران', roles: JSON.stringify(['BUYER', 'ADMIN']), referralCode: 'BAZ-VAHID' },
    { phone: '09120000002', firstName: 'مهدی', lastName: 'قاسمی', province: 'تهران', city: 'ورامین', roles: JSON.stringify(['ANIMAL_SELLER']), referralCode: 'BAZ-MAHDI' },
    { phone: '09120000003', firstName: 'علی', lastName: 'محمدی', province: 'اصفهان', city: 'شهرضا', roles: JSON.stringify(['ANIMAL_SELLER', 'FOOD_SELLER']), referralCode: 'BAZ-ALI' },
    { phone: '09120000004', firstName: 'زهرا', lastName: 'حیدری', province: 'تهران', city: 'تهران', roles: JSON.stringify(['BUYER']), referralCode: 'BAZ-ZAHRA' },
  ]
  const users: Record<string, string> = {}
  for (const u of demoUsers) {
    const user = await db.user.upsert({
      where: { phone: u.phone },
      update: {},
      create: { ...u, walletBalance: 5000000, loyaltyPoints: 250 },
    })
    users[u.phone] = user.id
  }

  // Demo ads
  const catMap: Record<string, string> = {}
  const allCats = await db.category.findMany()
  allCats.forEach(c => { catMap[c.slug] = c.id })

  const demoAds = [
    { title: 'گاو شیری هلشتاین', slug: 'gav-shiri-holstein-1', description: 'گاو هلشتاین اصیل با تولید روزانه ۳۵ لیتر شیر، کاملاً سالم با پرونده پزشکی کامل. مناسب دامداری‌های صنعتی و سنتی.', price: 380000000, province: 'تهران', city: 'تهران', categoryId: catMap['live-animal'], userId: users['09120000002'], images: JSON.stringify(['/images/cow.jpg']), attributes: JSON.stringify({ 'نژاد': 'هلشتاین', 'سن': '۲۴ ماه', 'جنسیت': 'ماده', 'وزن': '۵۵۰ کیلو', 'تعداد عکس': 5 }), isFeatured: true, views: 342 },
    { title: 'گوسفند زنده ماکویی', slug: 'gusfand-zende-makuie-1', description: '۸ رأس گوسفند ماکویی سالم با وزن متوسط ۴۰ کیلو، مناسب عید قربان و پروار. قیمت پایه برای هر رأس است.', price: 22500000, province: 'آذربایجان غربی', city: 'ارومیه', categoryId: catMap['sheep-goat'], userId: users['09120000002'], images: JSON.stringify(['/images/sheep.jpg']), attributes: JSON.stringify({ breed: 'ماکویی', age: 8, gender: 'ماده', weight: 40, 'تعداد عکس': 4 }), views: 187 },
    { title: 'مرغ تخم‌گذار فعال', slug: 'morgh-tokhmgozar-1', description: 'مجموع ۶۰ قطعه مرغ لگ‌هورن تخم‌گذار فعال با بازدهی بالای ۸۰٪. عکس‌های واقعی از مرغداری.', price: 20500000, province: 'تهران', city: 'شهریار', categoryId: catMap['poultry'], userId: users['09120000003'], images: JSON.stringify(['/images/chicken.jpg']), attributes: JSON.stringify({ breed: 'لگ‌هورن', age: 6, gender: 'ماده', weight: 2, 'تعداد عکس': 3 }), views: 156 },
    { title: 'بز سانتی اصیل', slug: 'boz-santi-asil-1', description: 'دو رأس بز سانتی با شاخ‌های متقارن، عالی برای پرورش و پروار. دارای شناسنامه و سوابق واکسیناسیون.', price: 26000000, province: 'فارس', city: 'شیراز', categoryId: catMap['sheep-goat'], userId: users['09120000003'], images: JSON.stringify(['/images/goat.jpg']), attributes: JSON.stringify({ breed: 'سانتی', age: 24, gender: 'ماده', weight: 60, 'تعداد عکس': 6 }), views: 143 },
    { title: 'گوساله پرواری سیمنتال', slug: 'gusale-provari-simmental-1', description: 'گوساله نر سیمنتال با ژنتیک عالی برای پروار، ۵ ماهه با وزن ۱۸۰ کیلو. کاملاً شیرخوارگی‌اش کامل شده.', price: 31000000, province: 'تهران', city: 'پاکدشت', categoryId: catMap['calf'], userId: users['09120000002'], images: JSON.stringify(['/images/calf.jpg']), attributes: JSON.stringify({ breed: 'سیمنتال', age: 5, gender: 'نر', weight: 180, 'تعداد عکس': 4 }), isFeatured: true, views: 289 },
    { title: 'گوساله پرواری هلشتاین نر', slug: 'gusale-holstein-nr-1', description: 'گوساله هلشتاین با رشد سریع، مناسب دامداری‌های پرواری. قیمت توافقی برای خرید بالای ۵ رأس.', price: 34000000, province: 'اصفهان', city: 'نجف‌آباد', categoryId: catMap['calf'], userId: users['09120000003'], images: JSON.stringify(['/images/calf.jpg']), attributes: JSON.stringify({ breed: 'هلشتاین', age: 5, gender: 'نر', weight: 165, 'تعداد عکس': 4 }), views: 198 },
    { title: 'اسب عرب اصیل با شناسنامه', slug: 'asb-arab-asil-1', description: 'مادیان عرب اصیل ۵ ساله با شناسنامه معتبر، آموزش‌دیده برای سوارکاری. بسیار آرام و سالم.', price: 850000000, province: 'یزد', city: 'یزد', categoryId: catMap['horse'], userId: users['09120000002'], images: JSON.stringify(['/images/horse.jpg']), attributes: JSON.stringify({ breed: 'عرب', age: 60, gender: 'ماده', weight: 420, 'تعداد عکس': 8 }), isFeatured: true, views: 412 },
    { title: 'سگ ژرمن شپردد با مدرک', slug: 'sag-german-shepherd-1', description: 'سگ ژرمن شپردد خالص ۸ ماهه با شناسنامه و مدارک اصالت، واکسینه و آموزش‌دیده اولیه.', price: 65000000, province: 'تهران', city: 'تهران', categoryId: catMap['pets'], userId: users['09120000003'], images: JSON.stringify(['/images/dog.jpg']), attributes: JSON.stringify({ breed: 'ژرمن شپردد', age: 8, gender: 'نر', weight: 28, 'تعداد عکس': 5 }), views: 331 },
    { title: 'یونجه خشک درجه یک - محموله ۱۰ تن', slug: 'yonge-darje-1', description: 'یونجه تازه از مزارع مغان، بسته‌بندی عدل ۳۰ کیلویی. ارسال به سراسر کشور با کامیون.', price: 2550000, province: 'آذربایجان شرقی', city: 'مغان', categoryId: catMap['feed'], userId: users['09120000003'], images: JSON.stringify(['/images/feed.jpg']), attributes: JSON.stringify({ brand: 'مغان', weight: 30, 'نوع بسته‌بندی': 'عدل' }), views: 89 },
  ]

  for (const ad of demoAds) {
    await db.ad.upsert({
      where: { slug: ad.slug },
      update: {},
      create: { ...ad, status: 'ACTIVE', expiresAt: new Date(Date.now() + 30 * 864e5) },
    })
  }

  return { success: true, users: Object.keys(users).length, ads: demoAds.length }
}
