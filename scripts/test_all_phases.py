#!/usr/bin/env python3
"""
تست جامع بازارگاه — تمام فازها
Phase 1: MVP (Auth, Ads, Chat, AI Vet, Nutrition, Payment)
Phase 2: Health, Vaccination, Store, Smart Search
Phase 3: Herd, Expenses
Phase 4: AI Analytics (admin)
"""
import json
import urllib.request

BASE = 'http://localhost:3000'
results = []

def req(method, path, body=None, token=None):
    url = BASE + path
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    data = json.dumps(body).encode() if body else None
    r = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(r, timeout=90) as resp:
            return resp.status, json.loads(resp.read())
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read())
        except Exception:
            return e.code, {}
    except Exception as e:
        return 0, {'error': str(e)}

def check(name, cond, extra=''):
    results.append((name, cond, extra))
    mark = 'PASS' if cond else 'FAIL'
    print(f'  [{mark}] {name} {extra}')

print('=' * 60)
print('PHASE 1 — MVP: Auth, Profile, Ads, Chat, AI, Payment')
print('=' * 60)

# --- Auth flow ---
print('\n[Auth]')
s, d = req('POST', '/api/auth/request-otp', {'phone': '09120000001'})
code = d.get('demoCode')
check('OTP request', s == 200 and code is not None, f'code={code}')

s, d = req('POST', '/api/auth/verify-otp', {'phone': '09120000001', 'code': code})
token = d.get('token')
user = d.get('user', {})
check('OTP verify + token', s == 200 and token is not None)
check('User roles parsed', 'ADMIN' in (user.get('roleList') or []), str(user.get('roleList')))

s, d = req('GET', '/api/auth/me', token=token)
check('Get /me', s == 200 and d.get('user', {}).get('id') == user.get('id'))

s, d = req('PUT', '/api/auth/me', {'firstName': 'وحید', 'lastName': 'عسکری', 'city': 'تهران'}, token=token)
check('Update profile', s == 200 and d.get('user', {}).get('firstName') == 'وحید')

# --- Ads ---
print('\n[Ads & Search]')
s, d = req('GET', '/api/ads')
check('List ads', s == 200 and d.get('total', 0) >= 8, f'total={d.get("total")}')

s, d = req('GET', '/api/ads?q=هلشتاین')
check('Text search', s == 200 and d.get('total', 0) >= 1, f'total={d.get("total")}')

s, d = req('GET', '/api/ads?sort=CHEAPEST&maxPrice=30000000')
ok = s == 200 and all(a['price'] <= 30000000 for a in d.get('ads', []))
check('Filter maxPrice', ok)

ad_id = None
s, d = req('GET', '/api/ads')
if d.get('ads'):
    ad_id = d['ads'][0]['id']
    ad_user = d['ads'][0].get('user', {}).get('id')

s, d = req('POST', '/api/ads', {
    'title': 'آگهی تست خودکار بازارگاه', 'description': 'تست', 'price': '12300000',
    'categoryId': d.get('ads', [{}])[0].get('categoryId'), 'city': 'تهران', 'province': 'تهران',
    'images': ['/images/cow.jpg'], 'attributes': {'breed': 'تست', 'age': 3, 'weight': 200},
}, token=token)
check('Create ad', s == 200 and d.get('ad', {}).get('id') is not None, f'status={s}')
my_ad_id = d.get('ad', {}).get('id')

if ad_id:
    s, d = req('GET', f'/api/ads/{ad_id}')
    check('Ad detail + similar', s == 200 and 'similar' in d)

# --- Favorites ---
print('\n[Favorites]')
if ad_id:
    s, d = req('POST', '/api/favorites', {'adId': ad_id}, token=token)
    check('Add favorite', s == 200 and d.get('favorited') is True)
    s, d = req('GET', '/api/favorites', token=token)
    check('List favorites', s == 200 and len(d.get('adIds', [])) >= 1)

# --- Chat ---
print('\n[Chat]')
if ad_user and ad_user != user.get('id'):
    s, d = req('POST', '/api/chat', {'sellerId': ad_user, 'adId': ad_id}, token=token)
    check('Start conversation', s == 200 and d.get('conversation', {}).get('id') is not None)
    conv_id = d.get('conversation', {}).get('id')
    if conv_id:
        s, d = req('POST', f'/api/chat/{conv_id}/messages', {'content': 'سلام، این دام هنوز موجوده؟'}, token=token)
        check('Send message', s == 200 and d.get('message', {}).get('content') == 'سلام، این دام هنوز موجوده؟')
        s, d = req('GET', f'/api/chat/{conv_id}/messages', token=token)
        check('Get messages + read status', s == 200 and len(d.get('messages', [])) >= 1 and d['messages'][0].get('isRead') is not None)

# --- AI VET (REAL AI) ---
print('\n[AI Vet — REAL AI TEST]')
s, d = req('POST', '/api/ai/vet', {
    'messages': [
        {'role': 'user', 'content': 'گاو شیری هلشتاین من ۳ روزه شیرش نصف شده و بی‌اشتهاست. چه بیماری‌هایی محتمل است؟'}
    ]
}, token=token)
ai_reply = d.get('reply', '')
check('AI Vet responds', s == 200 and len(ai_reply) > 100, f'reply_len={len(ai_reply)}')
check('AI Vet usage tracking', s == 200 and d.get('usage', {}).get('remaining') is not None, str(d.get('usage')))
check('AI Vet safety (vet referral)', 'دامپزشک' in ai_reply, 'mentions real vet')
if len(ai_reply) > 0:
    print(f'      AI sample: {ai_reply[:150]}...')

# Rate limit test — اتمام سهمیه 10 پیام روزانه
print('  ... testing rate limit (10 msgs/day)')
for i in range(12):
    s, d = req('POST', '/api/ai/vet', {'messages': [{'role': 'user', 'content': f'تست {i}: سلام گاو من'}]}, token=token)
    if s == 429:
        break
check('AI Vet rate limit (10/day FREE)', s == 429 and d.get('limitReached') is True, f'stopped at usage')

# --- NUTRITION ENGINE + AI ---
print('\n[Nutrition Engine + AI]')
s, d = req('POST', '/api/nutrition/calculate', {
    'species': 'SHEEP', 'weightKg': 45, 'goal': 'FATTENING', 'ageMonths': 12,
    'gender': 'MALE', 'environment': 'FARM'
}, token=token)
check('Engine calculates', s == 200 and d.get('requirements', {}).get('dryMatterKg', 0) > 0,
      f"DM={d.get('requirements', {}).get('dryMatterKg')}kg energy={d.get('requirements', {}).get('energyMcal')}Mcal")
engine_output = d

s, d = req('POST', '/api/ai/nutrition', {'engineOutput': engine_output}, token=token)
check('AI explains ration', s == 200 and len(d.get('explanation', '')) > 100, f'len={len(d.get("explanation", ""))}')
print(f'      AI sample: {d.get("explanation", "")[:150]}...')

# --- Subscription & Wallet & Payment ---
print('\n[Wallet + Subscription + E-commerce]')
s, d = req('GET', '/api/wallet', token=token)
check('Wallet info', s == 200 and d.get('balance', 0) > 0, f'balance={d.get("balance")}')

s, d = req('POST', '/api/wallet', {'amount': 2000000}, token=token)
check('Wallet charge', s == 200 and d.get('balance', 0) >= 2000000)

s, d = req('GET', '/api/subscription', token=token)
check('Get plans', s == 200 and len(d.get('plans', [])) == 4)

s, d = req('POST', '/api/subscription', {'planKey': 'PRO'}, token=token)
check('Subscribe PRO', s == 200)

s, d = req('GET', '/api/stores')
check('Stores list', s == 200 and len(d.get('stores', [])) >= 3)

product_id = None
if d.get('stores'):
    product_id = d['stores'][0].get('products', [{}])[0].get('id')

if product_id:
    s, d = req('POST', '/api/cart', {'productId': product_id, 'qty': 2}, token=token)
    check('Add to cart', s == 200)
    s, d = req('GET', '/api/cart', token=token)
    check('Cart total calc', s == 200 and d.get('total', 0) > 0, f'total={d.get("total")}')
    s, d = req('POST', '/api/orders', {'address': 'تهران، سعادت‌آباد', 'phone': '09120000001'}, token=token)
    check('Checkout + wallet payment', s == 200 and d.get('order', {}).get('status') == 'PAID', f"order={d.get('order', {}).get('orderNo')}")
    s, d = req('GET', '/api/orders', token=token)
    check('Order history', s == 200 and len(d.get('orders', [])) >= 1)

# --- Vet booking ---
print('\n[Vet Booking]')
s, d = req('GET', '/api/vets')
vet_id = d['vets'][0]['id'] if d.get('vets') else None
if vet_id:
    s, d = req('POST', '/api/vets/book', {'vetId': vet_id, 'slot': '09:00', 'sessionType': 'CLINIC'}, token=token)
    check('Book vet (wallet pay)', s == 200 and d.get('booking', {}).get('status') == 'CONFIRMED')

print()
print('=' * 60)
print('PHASE 2 — Health, Smart Search, Animals')
print('=' * 60)

# --- Animals + Health Records ---
print('\n[Animals + Digital Health Records]')
s, d = req('POST', '/api/animals', {
    'name': 'لیلا', 'species': 'COW', 'breed': 'هلشتاین', 'gender': 'FEMALE',
    'weight': 550, 'purpose': 'DAIRY', 'environment': 'FARM',
}, token=token)
check('Create animal + Animal ID', s == 200 and d.get('animal', {}).get('publicId', '').startswith('BAZ-'),
      f"ID={d.get('animal', {}).get('publicId')}")
animal_id = d.get('animal', {}).get('id')

if animal_id:
    s, d = req('POST', f'/api/animals/{animal_id}/records', {'type': 'VACCINATION', 'data': {'vaccine': 'تب برفکی', 'date': '2026-10-01', 'nextDate': '2027-04-01'}}, token=token)
    check('Add vaccination', s == 200)

    s, d = req('POST', f'/api/animals/{animal_id}/records', {'type': 'MEDICATION', 'data': {'name': 'اوکسی‌تتراسایکلین', 'dose': '20ml', 'startDate': '2026-10-03'}}, token=token)
    check('Add medication', s == 200)

    s, d = req('POST', f'/api/animals/{animal_id}/records', {'type': 'TEST', 'data': {'name': 'آزمایش خون', 'result': 'طبیعی', 'date': '2026-10-04'}}, token=token)
    check('Add test', s == 200)

    s, d = req('POST', f'/api/animals/{animal_id}/records', {'type': 'DAILY_LOG', 'data': {'weight': 552, 'feedKg': 22, 'production': '32 لیتر شیر', 'date': '2026-10-05'}}, token=token)
    check('Add daily log (weight update)', s == 200)

    s, d = req('GET', f'/api/animals/{animal_id}', token=token)
    check('Full health record file', s == 200 and len(d.get('animal', {}).get('vaccinations', [])) >= 1 and len(d.get('animal', {}).get('dailyLogs', [])) >= 1)

# --- Smart Search (REAL AI) ---
print('\n[Smart Search — REAL AI TEST]')
s, d = req('POST', '/api/ai/search', {'query': 'سگ ژرمن تهران زیر ۶۰ میلیون'}, token=token)
f = d.get('filters', {})
check('AI parses NL query', s == 200 and f.get('maxPrice') == 60000000, json.dumps(f, ensure_ascii=False)[:120])

s, d = req('POST', '/api/ai/search', {'query': 'گاو هلشتاین ماده زیر ۴۰۰ میلیون در تهران'}, token=token)
f = d.get('filters', {})
check('AI parses cow query', s == 200 and f.get('maxPrice') == 400000000, json.dumps(f, ensure_ascii=False)[:120])

# --- Notifications ---
print('\n[Notifications]')
s, d = req('GET', '/api/notifications', token=token)
check('Notifications list', s == 200 and len(d.get('notifications', [])) >= 1, f'count={len(d.get("notifications", []))}')

print()
print('=' * 60)
print('PHASE 3 — Herd, Expenses, Livestock Management')
print('=' * 60)

s, d = req('POST', '/api/herds', {'name': 'گله گاو شیری مرکزی', 'species': 'COW', 'notes': 'گروه اصلی دامداری'}, token=token)
check('Create herd', s == 200)

s, d = req('GET', '/api/herds', token=token)
check('List herds', s == 200 and len(d.get('herds', [])) >= 1)

s, d = req('POST', '/api/expenses', {'type': 'FEED', 'amount': 4500000, 'note': 'یونجه و کنسانتره مهرماه', 'animalId': animal_id}, token=token)
check('Add expense', s == 200)

s, d = req('POST', '/api/expenses', {'type': 'VET', 'amount': 1200000, 'note': 'ویزیت دوره‌ای'}, token=token)
s, d = req('GET', '/api/expenses', token=token)
check('Expense analysis', s == 200 and len(d.get('byType', [])) >= 2 and d.get('total', 0) > 0,
      f"total={d.get('total')} types={len(d.get('byType', []))}")

print()
print('=' * 60)
print('PHASE 4 — Admin, AI Analytics, RBAC')
print('=' * 60)

s, d = req('GET', '/api/admin/stats', token=token)
check('Admin dashboard', s == 200 and d.get('stats', {}).get('totalUsers', 0) >= 1, f"users={d.get('stats', {}).get('totalUsers')} aiUsage={d.get('stats', {}).get('aiUsageCount')}")

s, d = req('GET', '/api/admin/users', token=token)
check('Admin users list', s == 200 and len(d.get('users', [])) >= 4)

s, d = req('GET', '/api/admin/ai-usage', token=token)
check('AI usage report', s == 200 and d.get('total', {}).get('count', 0) >= 10, f"total_calls={d.get('total', {}).get('count')} tokens={d.get('total', {}).get('tokens')}")

# Non-admin access should fail
s, d = req('POST', '/api/auth/request-otp', {'phone': '09120000004'})
s, d = req('POST', '/api/auth/verify-otp', {'phone': '09120000004', 'code': d.get('demoCode')})
buyer_token = d.get('token')
s, d = req('GET', '/api/admin/stats', token=buyer_token)
check('RBAC: non-admin blocked', s == 403)

# Unauthenticated access should fail
s, d = req('GET', '/api/wallet')
check('Auth guard: no token blocked', s == 401)

print()
print('=' * 60)
passed = sum(1 for _, ok, _ in results if ok)
failed = sum(1 for _, ok, _ in results if not ok)
print(f'RESULT: {passed}/{len(results)} tests passed | {failed} failed')
print('=' * 60)
if failed:
    for name, ok, extra in results:
        if not ok:
            print(f'  FAIL: {name} {extra}')
