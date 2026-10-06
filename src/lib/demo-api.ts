/**
 * شبیه‌ساز API حالت دمو — پاسخ‌دهی به تمام endpointهای بازارگاه از حافظه مرورگر.
 * ساختار پاسخ‌ها دقیقاً مطابق routeهای واقعی است تا viewها بدون تغییر کار کنند.
 */

import {
  DEMO_ADS, DEMO_ANIMALS, DEMO_ANIMAL_RECORDS, DEMO_CATEGORIES, DEMO_CONVS, DEMO_MESSAGES,
  DEMO_EXPENSES, DEMO_HERDS, DEMO_NOTIFS, DEMO_ORDERS, DEMO_PLANS, DEMO_SELLERS, DEMO_STORES,
  DEMO_VETS, DEMO_WALLET_TX, currentUser, loadInit, lsGet, lsSet, saveCurrentUser,
} from './demo-data'
import type { User } from './store'

const uid = () => 'd' + Math.random().toString(36).slice(2, 9)
const nowISO = () => new Date().toISOString()
const today = () => new Date().toISOString().slice(0, 10)

function myAds(): Record<string, unknown>[] {
  return lsGet('myads', [])
}

function allAds(): Record<string, unknown>[] {
  return [...myAds(), ...DEMO_ADS].filter((a) => a.status !== 'DELETED') as Record<string, unknown>[]
}

function findAd(idOrSlug: string): Record<string, unknown> | undefined {
  return allAds().find((a) => a.id === idOrSlug || a.slug === idOrSlug)
}

function notify(title: string, body: string, type: string) {
  const notifs = loadInit('notifs', DEMO_NOTIFS)
  notifs.unshift({ id: uid(), userId: 'me', title, body, type, isRead: false, createdAt: nowISO() })
  lsSet('notifs', notifs.slice(0, 50))
}

/** پیام خودکار فروشنده در چت — برای زنده بودن دمو */
function scheduleAutoReply(convId: string, userText: string) {
  const t = userText || ''
  const reply = /سلام|درود|وقت/.test(t)
    ? 'سلام 👋 وقت بخیر، در خدمتم.'
    : /قیمت|تخفیف|آخر/.test(t)
      ? 'قیمت همونیه که تو آگهی گذاشتم، ولی برای خرید حضوری یکم تخفیف میدم 🙂'
      : /موجود|هست/.test(t)
        ? 'بله موجوده، هر وقت تشریف بیارید آماده‌ست.'
        : 'چشم، هماهنگ می‌کنم و خبر میدم 🙏'
  setTimeout(() => {
    const msgs = lsGet<Record<string, Record<string, unknown>[]>>('chatmsgs', DEMO_MESSAGES)
    const list = msgs[convId] || []
    list.push({ id: uid(), conversationId: convId, senderId: 'u2', content: reply, isRead: false, createdAt: nowISO() })
    msgs[convId] = list
    lsSet('chatmsgs', msgs)
    const convs = loadInit('convs', DEMO_CONVS)
    const conv = convs.find((c) => c.id === convId)
    if (conv) {
      conv.lastMessage = reply.slice(0, 80)
      conv.lastMessageAt = nowISO()
      lsSet('convs', convs)
    }
  }, 1600)
}

/**
 * مسیریاب اصلی دمو — پاسخ معادل سرور برمی‌گرداند؛
 * برای مسیرهای ناشناخته undefined (و api() خطای اصلی را پرتاب می‌کند).
 */
export async function demoFetch(path: string, method = 'GET', bodyRaw?: string): Promise<unknown | undefined> {
  const url = new URL(path, 'http://demo.local')
  const p = url.pathname.startsWith('/api') ? url.pathname.slice(4) : url.pathname
  const q = url.searchParams
  const m = method.toUpperCase()
  let body: Record<string, unknown> = {}
  if (bodyRaw) { try { body = JSON.parse(bodyRaw) } catch { /* ignore */ } }

  const user = currentUser()
  const me = user.id

  // ---------- Auth ----------
  if (p === '/auth/request-otp' && m === 'POST') {
    return { success: true, demoCode: '12345', expiresIn: 120, message: 'کد آزمایشی دمو' }
  }
  if (p === '/auth/verify-otp' && m === 'POST') {
    const phone = (body.phone as string) || '09000000000'
    return { success: true, token: 'demo-token', user: { ...user, phone }, isNew: false }
  }
  if (p === '/auth/guest' && m === 'POST') {
    return { success: true, token: 'demo-token', user: { ...user } }
  }
  if (p === '/auth/me' && m === 'GET') {
    return { user }
  }

  // ---------- Categories ----------
  if (p === '/categories' && m === 'GET') {
    return { categories: [...DEMO_CATEGORIES].sort((a, b) => a.order - b.order) }
  }

  // ---------- Ads ----------
  if (p === '/ads' && m === 'GET') {
    const qq = (q.get('q') || '').trim()
    const category = q.get('category') || ''
    const city = q.get('city') || ''
    const minPrice = q.get('minPrice')
    const maxPrice = q.get('maxPrice')
    const sort = q.get('sort') || 'NEWEST'
    const page = parseInt(q.get('page') || '1')
    const limit = Math.min(parseInt(q.get('limit') || '20'), 50)
    const featured = q.get('featured')
    const userId = q.get('userId')
    const status = q.get('status') || 'ACTIVE'

    let list = allAds()
    if (qq) {
      // جستجوی واژه‌محور (هماهنگ با /api/ads): واژه‌های عمومی و اعداد حذف می‌شوند
      const STOP = new Set(['از', 'به', 'تا', 'با', 'و', 'در', 'برای', 'زیر', 'بالا', 'بالای', 'تومان', 'میلیون', 'هزار', 'ریال', 'قیمت', 'خرید', 'فروش', 'دنبال', 'میخواهم', 'میخوام'])
      const words = qq.split(/\s+/).filter((w) => w.length >= 2 && !/^[\d۰-۹./،,]+$/.test(w) && !STOP.has(w))
      if (words.length > 0) {
        list = list.filter((a) => {
          const text = `${String(a.title)} ${String(a.description || '')}`
          return words.every((w) => text.includes(w))
        })
      }
    }
    if (category) list = list.filter((a) => a.categoryId === category || (a.category as { slug?: string } | undefined)?.slug === category)
    if (city) list = list.filter((a) => String(a.city).includes(city))
    if (minPrice) list = list.filter((a) => Number(a.price) >= parseInt(minPrice))
    if (maxPrice) list = list.filter((a) => Number(a.price) <= parseInt(maxPrice))
    if (featured === '1') list = list.filter((a) => a.isFeatured)
    if (userId) list = list.filter((a) => a.userId === userId)
    list = list.filter((a) => !status || a.status === status)

    if (sort === 'CHEAPEST') list.sort((a, b) => Number(a.price) - Number(b.price))
    else if (sort === 'EXPENSIVE') list.sort((a, b) => Number(b.price) - Number(a.price))
    else if (sort === 'POPULAR') list.sort((a, b) => Number(b.views) - Number(a.views))
    else list.sort((a, b) => new Date(String(b.ladderedUntil || b.createdAt)).getTime() - new Date(String(a.ladderedUntil || a.createdAt)).getTime())

    const total = list.length
    const ads = list.slice((page - 1) * limit, page * limit)
    return { ads, total, page, pages: Math.max(Math.ceil(total / limit), 1) }
  }

  if (p === '/ads' && m === 'POST') {
    const cat = DEMO_CATEGORIES.find((c) => c.id === body.categoryId)
    const ad = {
      id: uid(),
      slug: String(body.title || 'ad').replace(/\s+/g, '-').slice(0, 40) + '-' + uid().slice(2, 6),
      title: body.title,
      description: body.description || '',
      price: parseInt(String(body.price)) || 0,
      negotiable: !!body.negotiable,
      province: body.province || 'تهران',
      city: body.city || 'تهران',
      images: JSON.stringify(body.images || []),
      categoryId: body.categoryId,
      userId: me,
      status: 'ACTIVE',
      attributes: JSON.stringify(body.attributes || {}),
      views: 0,
      isFeatured: false,
      ladderedUntil: nowISO(),
      createdAt: nowISO(),
      expiresAt: new Date(Date.now() + 30 * 864e5).toISOString(),
      category: cat ? { name: cat.name, slug: cat.slug } : undefined,
      user: { id: me, firstName: user.firstName, lastName: user.lastName, isVerified: true, city: user.city },
    }
    const mine = myAds()
    mine.unshift(ad)
    lsSet('myads', mine)
    notify('آگهی شما منتشر شد', `آگهی «${String(ad.title)}» با موفقیت منتشر شد`, 'AD')
    return { ad }
  }

  if (p.startsWith('/ads/')) {
    const id = p.slice(5)
    if (m === 'GET') {
      const ad = findAd(id)
      if (!ad) throw new Error('آگهی یافت نشد')
      const similar = allAds().filter((a) => a.categoryId === ad.categoryId && a.id !== ad.id).slice(0, 4)
        .map((a) => ({ ...a, category: { name: (a.category as { name?: string })?.name || '' } }))
      return { ad, similar }
    }
    if (m === 'DELETE') {
      const mine = myAds()
      const ad = mine.find((a) => a.id === id || a.slug === id)
      if (ad) ad.status = 'DELETED'
      lsSet('myads', mine)
      return { success: true }
    }
  }

  // ---------- Vets ----------
  if (p === '/vets' && m === 'GET') {
    let vets = [...DEMO_VETS]
    const city = q.get('city')
    const specialty = q.get('specialty')
    if (city) vets = vets.filter((v) => v.city.includes(city))
    if (specialty) vets = vets.filter((v) => v.specialty.includes(specialty))
    vets.sort((a, b) => b.rating - a.rating)
    return { vets }
  }

  if (p === '/vets/book') {
    if (m === 'GET') return { bookings: lsGet('bookings', []) }
    if (m === 'POST') {
      const vet = DEMO_VETS.find((v) => v.id === body.vetId)
      if (!vet) throw new Error('دامپزشک یافت نشد')
      const price = vet.pricePerSession
      if (user.walletBalance < price) throw new Error('موجودی کیف پول کافی نیست')
      const booking = {
        id: uid(), vetId: vet.id, userId: me, slot: String(body.slot || ''),
        sessionType: String(body.sessionType || 'CHAT'), status: 'CONFIRMED',
        price, commission: Math.round(price * (vet.commissionRate / 100)), createdAt: nowISO(), vet,
      }
      const bookings = lsGet<Record<string, unknown>[]>('bookings', [])
      bookings.unshift(booking)
      lsSet('bookings', bookings)
      const updated = { ...user, walletBalance: user.walletBalance - price }
      saveCurrentUser(updated)
      notify('رزرو تأیید شد', `نوبت شما با ${vet.name} در ساعت ${String(booking.slot)} ثبت شد`, 'BOOKING')
      return { booking, walletBalance: updated.walletBalance }
    }
  }

  // ---------- Stores ----------
  if (p === '/stores' && m === 'GET') {
    return { stores: [...DEMO_STORES].sort((a, b) => b.rating - a.rating) }
  }

  // ---------- Favorites ----------
  if (p === '/favorites') {
    if (m === 'GET') {
      const favIds = lsGet<string[]>('favs', [])
      const favorites = favIds.map((adId) => ({ id: 'fav-' + adId, userId: me, adId, createdAt: nowISO(), ad: findAd(adId) })).filter((f) => f.ad)
      return { favorites, adIds: favIds }
    }
    if (m === 'POST') {
      const adId = String(body.adId || '')
      const favIds = lsGet<string[]>('favs', [])
      if (favIds.includes(adId)) {
        lsSet('favs', favIds.filter((f) => f !== adId))
        return { favorited: false }
      }
      favIds.unshift(adId)
      lsSet('favs', favIds)
      return { favorited: true }
    }
  }

  // ---------- Cart ----------
  if (p === '/cart') {
    if (m === 'GET') {
      const cart = lsGet<{ productId: string; qty: number; id: string }[]>('cart', [])
      const items = cart.map((c) => {
        let product: Record<string, unknown> | undefined
        for (const st of DEMO_STORES) {
          const f = st.products.find((x) => x.id === c.productId)
          if (f) product = { ...f, store: { name: st.name, slug: st.slug } }
        }
        return { id: c.id, userId: me, productId: c.productId, qty: c.qty, createdAt: nowISO(), product }
      }).filter((i) => i.product)
      const total = items.reduce((s, i) => s + (i.product!.price as number) * i.qty, 0)
      return { items, total }
    }
    if (m === 'POST') {
      const cart = lsGet<{ productId: string; qty: number; id: string }[]>('cart', [])
      const productId = String(body.productId || '')
      const existing = cart.find((c) => c.productId === productId)
      if (existing) existing.qty += Number(body.qty || 1)
      else cart.unshift({ id: uid(), productId, qty: Number(body.qty || 1) })
      lsSet('cart', cart)
      return { success: true }
    }
    if (m === 'DELETE') {
      const itemId = q.get('itemId') || ''
      lsSet('cart', lsGet<{ id: string }[]>('cart', []).filter((c) => c.id !== itemId))
      return { success: true }
    }
  }

  // ---------- Orders ----------
  if (p === '/orders') {
    if (m === 'GET') return { orders: loadInit('orders', DEMO_ORDERS) }
    if (m === 'POST') {
      const cart = lsGet<{ productId: string; qty: number; id: string }[]>('cart', [])
      if (cart.length === 0) throw new Error('سبد خرید خالی است')
      let product: Record<string, unknown> | undefined
      const entries = cart.map((c) => {
        product = undefined
        for (const st of DEMO_STORES) {
          const f = st.products.find((x) => x.id === c.productId)
          if (f) product = { ...f, store: { name: st.name, slug: st.slug } }
        }
        return { cartItem: c, product }
      }).filter((e) => e.product)
      const total = entries.reduce((s, e) => s + (e.product!.price as number) * e.cartItem.qty, 0)
      if (user.walletBalance < total) throw new Error(`موجودی کیف پول کافی نیست. نیاز: ${total.toLocaleString('fa-IR')} تومان`)
      const orderNo = 'ORD-' + Date.now().toString(36).toUpperCase()
      const order = {
        id: uid(), orderNo, userId: me,
        items: JSON.stringify(entries.map((e) => ({ name: e.product!.name, qty: e.cartItem.qty, price: e.product!.price }))),
        total, address: String(body.address || user.city || ''), phone: String(body.phone || user.phone),
        status: 'PAID', createdAt: nowISO(),
        orderItems: entries.map((e) => ({ id: uid(), orderId: '', productId: e.cartItem.productId, qty: e.cartItem.qty, price: e.product!.price, product: { name: e.product!.name, image: e.product!.image } })),
      }
      const orders = loadInit('orders', DEMO_ORDERS)
      orders.unshift(order)
      lsSet('orders', orders)
      lsSet('cart', [])
      const updated = { ...user, walletBalance: user.walletBalance - total }
      saveCurrentUser(updated)
      const txs = loadInit('wallettx', DEMO_WALLET_TX)
      txs.unshift({ id: uid(), userId: me, amount: -total, type: 'PAYMENT', description: `پرداخت سفارش ${orderNo}`, createdAt: nowISO() })
      lsSet('wallettx', txs)
      notify('سفارش ثبت شد', `سفارش ${orderNo} با موفقیت پرداخت شد`, 'ORDER')
      return { order, walletBalance: updated.walletBalance }
    }
  }

  // ---------- Wallet ----------
  if (p === '/wallet') {
    if (m === 'GET') return { balance: user.walletBalance, transactions: loadInit('wallettx', DEMO_WALLET_TX) }
    if (m === 'POST') {
      const amt = parseInt(String(body.amount))
      if (!amt || amt < 10000 || amt > 100000000) throw new Error('مبلغ باید بین 10,000 تا 100,000,000 تومان باشد')
      const updated = { ...user, walletBalance: user.walletBalance + amt }
      saveCurrentUser(updated)
      const txs = loadInit('wallettx', DEMO_WALLET_TX)
      txs.unshift({ id: uid(), userId: me, amount: amt, type: 'CHARGE', description: 'شارژ کیف پول (درگاه دمو)', createdAt: nowISO() })
      lsSet('wallettx', txs)
      return { success: true, balance: updated.walletBalance }
    }
  }

  // ---------- Notifications ----------
  if (p === '/notifications') {
    if (m === 'GET') {
      const notifs = loadInit('notifs', DEMO_NOTIFS)
      return { notifications: notifs, unread: notifs.filter((n) => !n.isRead).length }
    }
    if (m === 'POST') {
      const notifs = loadInit('notifs', DEMO_NOTIFS)
      notifs.forEach((n) => { n.isRead = true })
      lsSet('notifs', notifs)
      return { success: true }
    }
  }

  // ---------- Chat ----------
  if (p === '/chat') {
    if (m === 'GET') {
      const convs = loadInit('convs', DEMO_CONVS)
      const msgs = lsGet<Record<string, Record<string, unknown>[]>>('chatmsgs', DEMO_MESSAGES)
      const withLast = convs.map((c) => {
        const list = [...(msgs[c.id] || [])]
        const last = list.length ? [list[list.length - 1]] : []
        return { ...c, messages: last }
      })
      return { conversations: withLast }
    }
    if (m === 'POST') {
      const sellerId = String(body.sellerId || '')
      const adId = body.adId ? String(body.adId) : null
      const convs = loadInit('convs', DEMO_CONVS)
      let conv = convs.find((c) => c.buyerId === me && c.sellerId === sellerId && (c.adId || null) === adId)
      if (!conv) {
        const seller = DEMO_SELLERS[sellerId]
        conv = {
          id: uid(), buyerId: me, sellerId, adId, lastMessage: '', lastMessageAt: nowISO(), createdAt: nowISO(),
          buyer: { id: me, firstName: user.firstName, lastName: user.lastName, avatar: null },
          seller: { id: sellerId, firstName: seller?.firstName || 'فروشنده', lastName: seller?.lastName || '', avatar: null },
          messages: [],
        }
        convs.unshift(conv)
        lsSet('convs', convs)
      }
      return { conversation: conv }
    }
  }

  if (p.startsWith('/chat/') && p.endsWith('/messages')) {
    const convId = p.slice(6, -9)
    const msgs = lsGet<Record<string, Record<string, unknown>[]>>('chatmsgs', DEMO_MESSAGES)
    if (m === 'GET') {
      const list = (msgs[convId] || []).slice().sort((a, b) => new Date(String(a.createdAt)).getTime() - new Date(String(b.createdAt)).getTime())
      return { messages: list, meId: me }
    }
    if (m === 'POST') {
      const content = String(body.content || '').trim()
      if (!content) throw new Error('متن پیام خالی است')
      const message = { id: uid(), conversationId: convId, senderId: me, content, isRead: false, createdAt: nowISO() }
      const list = msgs[convId] || []
      list.push(message)
      msgs[convId] = list
      lsSet('chatmsgs', msgs)
      const convs = loadInit('convs', DEMO_CONVS)
      const conv = convs.find((c) => c.id === convId)
      if (conv) { conv.lastMessage = content.slice(0, 80); conv.lastMessageAt = nowISO(); lsSet('convs', convs) }
      scheduleAutoReply(convId, content)
      return { message }
    }
  }

  // ---------- Animals ----------
  if (p === '/animals') {
    if (m === 'GET') {
      const animals = loadInit('myanimals', DEMO_ANIMALS)
      const recs = loadInit('recs', DEMO_ANIMAL_RECORDS)
      const full = animals.map((a) => ({
        ...a,
        vaccinations: (recs[a.id]?.vaccinations || []).slice(0, 3),
        healthRecords: (recs[a.id]?.healthRecords || []).slice(0, 3),
        dailyLogs: (recs[a.id]?.dailyLogs || []).slice(0, 3),
      }))
      return { animals: full }
    }
    if (m === 'POST') {
      const animals = loadInit('myanimals', DEMO_ANIMALS)
      const species = String(body.species || 'OTHER')
      const animal = {
        id: uid(), publicId: 'BAZ-' + species.slice(0, 2).toUpperCase() + '-' + uid().slice(2, 8).toUpperCase(),
        userId: me, name: body.name, species, breed: body.breed || null,
        gender: body.gender || 'UNKNOWN', birthDate: body.birthDate || null,
        weight: body.weight ? parseFloat(String(body.weight)) : null,
        color: body.color || null, purpose: body.purpose || null, environment: body.environment || null,
        images: JSON.stringify(body.images || []), notes: body.notes || null,
        isPublic: !!body.isPublic, createdAt: nowISO(), vaccinations: [], healthRecords: [], dailyLogs: [],
      }
      animals.unshift(animal)
      lsSet('myanimals', animals)
      return { animal }
    }
  }

  if (p.startsWith('/animals/')) {
    const rest = p.slice(9)
    if (rest.endsWith('/records') && m === 'POST') {
      const animalId = rest.slice(0, -8)
      const { type, data } = body as { type: string; data: Record<string, unknown> }
      const recs = loadInit('recs', DEMO_ANIMAL_RECORDS)
      if (!recs[animalId]) recs[animalId] = { healthRecords: [], vaccinations: [], medications: [], tests: [], dailyLogs: [] }
      let record: Record<string, unknown> | null = null
      switch (type) {
        case 'HEALTH':
          record = { id: uid(), animalId, type: data.type || 'NOTE', title: data.title, description: data.description || null, vetName: data.vetName || null, date: data.date || today(), createdAt: nowISO() }
          recs[animalId].healthRecords.unshift(record)
          break
        case 'VACCINATION':
          record = { id: uid(), animalId, vaccine: data.vaccine, date: data.date || today(), nextDate: data.nextDate || null, vetName: data.vetName || null, createdAt: nowISO() }
          recs[animalId].vaccinations.unshift(record)
          if (data.nextDate) notify('یادآور واکسن ثبت شد', `دوز بعدی واکسن ${String(data.vaccine)} در تاریخ ${String(data.nextDate)}`, 'REMINDER')
          break
        case 'MEDICATION':
          record = { id: uid(), animalId, name: data.name, dose: data.dose || null, startDate: data.startDate || today(), endDate: data.endDate || null, notes: data.notes || null, createdAt: nowISO() }
          recs[animalId].medications.unshift(record)
          break
        case 'TEST':
          record = { id: uid(), animalId, name: data.name, result: data.result || null, date: data.date || today(), createdAt: nowISO() }
          recs[animalId].tests.unshift(record)
          break
        case 'DAILY_LOG':
          record = { id: uid(), animalId, date: data.date || today(), weight: data.weight ? parseFloat(String(data.weight)) : null, feedKg: data.feedKg ? parseFloat(String(data.feedKg)) : null, waterL: data.waterL ? parseFloat(String(data.waterL)) : null, production: data.production || null, activity: data.activity || null, symptoms: data.symptoms || null, createdAt: nowISO() }
          recs[animalId].dailyLogs.unshift(record)
          break
        default:
          throw new Error('نوع رکورد نامعتبر')
      }
      lsSet('recs', recs)
      return { record }
    }
    const animalId = rest
    if (m === 'GET') {
      const animals = loadInit('myanimals', DEMO_ANIMALS)
      const animal = animals.find((a) => a.id === animalId || a.publicId === animalId)
      if (!animal) throw new Error('حیوان یافت نشد')
      const recs = loadInit('recs', DEMO_ANIMAL_RECORDS)
      return {
        animal: {
          ...animal,
          healthRecords: recs[animalId]?.healthRecords || [],
          vaccinations: recs[animalId]?.vaccinations || [],
          medications: recs[animalId]?.medications || [],
          tests: recs[animalId]?.tests || [],
          dailyLogs: (recs[animalId]?.dailyLogs || []).slice(0, 30),
          nutritionPlans: [],
          expenses: [],
        },
      }
    }
    if (m === 'PUT') {
      const animals = loadInit('myanimals', DEMO_ANIMALS)
      const animal = animals.find((a) => a.id === animalId)
      if (!animal) throw new Error('دسترسی غیرمجاز')
      Object.assign(animal, body)
      if (body.weight !== undefined) animal.weight = parseFloat(String(body.weight)) || null
      lsSet('myanimals', animals)
      return { animal }
    }
    if (m === 'DELETE') {
      lsSet('myanimals', loadInit('myanimals', DEMO_ANIMALS).filter((a) => a.id !== animalId))
      return { success: true }
    }
  }

  // ---------- Herds ----------
  if (p === '/herds') {
    if (m === 'GET') return { herds: loadInit('herds', DEMO_HERDS) }
    if (m === 'POST') {
      const herds = loadInit('herds', DEMO_HERDS)
      const herd = { id: uid(), userId: me, name: body.name, species: body.species || null, notes: body.notes || null, createdAt: nowISO() }
      herds.unshift(herd)
      lsSet('herds', herds)
      return { herd }
    }
  }

  // ---------- Expenses ----------
  if (p === '/expenses') {
    if (m === 'GET') {
      const expenses = loadInit('expenses', DEMO_EXPENSES)
      const byTypeMap: Record<string, number> = {}
      let total = 0
      expenses.forEach((e) => { byTypeMap[e.type] = (byTypeMap[e.type] || 0) + e.amount; total += e.amount })
      const byTypeFa: Record<string, string> = { FEED: 'خوراک', MEDICINE: 'دارو', VET: 'دامپزشک', TRANSPORT: 'حمل‌ونقل', LABOR: 'نیروی انسانی', OTHER: 'سایر' }
      const byType = Object.entries(byTypeMap).map(([type, amount]) => ({ type, label: byTypeFa[type] || type, amount, percent: total > 0 ? Math.round((amount / total) * 100) : 0 }))
      return { expenses, total, byType }
    }
    if (m === 'POST') {
      const amt = parseInt(String(body.amount))
      if (!amt || amt <= 0) throw new Error('مبلغ نامعتبر')
      const expenses = loadInit('expenses', DEMO_EXPENSES)
      const expense = { id: uid(), userId: me, animalId: body.animalId || null, herdId: body.herdId || null, type: String(body.type || 'FEED'), amount: amt, note: body.note || null, date: String(body.date || today()), createdAt: nowISO() }
      expenses.unshift(expense)
      lsSet('expenses', expenses)
      return { expense }
    }
  }

  // ---------- Subscription ----------
  if (p === '/subscription') {
    if (m === 'GET') return { plans: [...DEMO_PLANS].sort((a, b) => a.price - b.price), currentPlan: user.planKey }
    if (m === 'POST') {
      const plan = DEMO_PLANS.find((x) => x.key === body.planKey)
      if (!plan) throw new Error('پلن یافت نشد')
      let updated: User
      if (plan.price === 0) {
        updated = { ...user, planKey: 'FREE', planExpiresAt: null }
      } else {
        if (user.walletBalance < plan.price) throw new Error(`موجودی کافی نیست. قیمت پلن: ${plan.price.toLocaleString('fa-IR')} تومان`)
        const expiresAt = new Date(Date.now() + 30 * 864e5).toISOString()
        updated = { ...user, planKey: plan.key, planExpiresAt: expiresAt }
        const txs = loadInit('wallettx', DEMO_WALLET_TX)
        txs.unshift({ id: uid(), userId: me, amount: -plan.price, type: 'PAYMENT', description: `خرید اشتراک ${plan.name}`, createdAt: nowISO() })
        lsSet('wallettx', txs)
        notify('اشتراک فعال شد', `اشتراک ${plan.name} تا 30 روز فعال است`, 'SUBSCRIPTION')
      }
      saveCurrentUser(updated)
      return { success: true, planKey: plan.key, walletBalance: updated.walletBalance }
    }
  }

  return undefined
}
