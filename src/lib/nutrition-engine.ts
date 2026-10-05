/**
 * Nutrition Engine — موتور علمی محاسبه جیره غذایی
 *
 * محاسبات عددی توسط این موتور انجام می‌شود (نه حدس مستقلی AI).
 * مبنای علمی: استانداردهای NRC (National Research Council) برای نشخوارکنندگان
 * و NRC Poultry برای طیور — به صورت ساده‌شده برای مصرف موبایل.
 *
 * ورودی: مشخصات حیوان + محیط + هدف
 * خروجی: نیازهای روزانه + ترکیب جیره پیشنهادی + هزینه
 */

export interface NutritionInput {
  species: string // COW, SHEEP, GOAT, BUFFALO, POULTRY, HORSE, DOG, CAT
  breed?: string
  ageMonths: number
  gender: string
  weightKg: number
  goal: string // GROW, MAINTAIN, GAIN, MILK, PREGNANT, LOSE, FATTENING, LAYING
  environment: string // FARM, HOUSE, STABLE, FREE_RANGE
  tempC?: number
  milkLiters?: number // برای گاو شیری
  pregnancyMonths?: number
  availableFoods?: string[] // id های خوراک موجود
}

export interface FoodNutrition {
  id: string
  name: string
  category: string
  dryMatter: number // %
  protein: number // % DM
  energy: number // Mcal/kg
  fiber: number // %
  fat: number // %
  calcium: number // %
  phosphorus: number // %
  pricePerKg: number
}

export interface RationItem {
  foodId: string
  name: string
  kgPerDay: number
  percentage: number
  proteinContribution: number
  energyContribution: number
  costPerDay: number
}

export interface NutritionOutput {
  animal: {
    species: string
    speciesFa: string
    weightKg: number
    ageMonths: number
    goal: string
    goalFa: string
    environment: string
    environmentFa: string
  }
  requirements: {
    dryMatterKg: number // ماده خشک روزانه
    proteinPercent: number // درصد پروتئین در ماده خشک
    proteinKg: number
    energyMcal: number // انرژی متابولیکی روزانه
    fiberPercent: number
    calciumG: number
    phosphorusG: number
    waterLiters: number
  }
  ration: RationItem[]
  totals: {
    dryMatterKg: number
    proteinPercent: number
    energyMcal: number
    fiberPercent: number
    calciumG: number
    phosphorusG: number
    costPerDay: number
    costPerMonth: number
    costPerKgGain?: number
  }
  balance: {
    proteinDiff: number // درصد انحراف از نیاز
    energyDiff: number
    fiberDiff: number
    status: 'BALANCED' | 'NEEDS_ADJUSTMENT'
    warnings: string[]
  }
  version: string
  calculatedAt: string
}

const SPECIES_FA: Record<string, string> = {
  COW: 'گاو', SHEEP: 'گوسفند', GOAT: 'بز', BUFFALO: 'گاومیش',
  POULTRY: 'طیور', HORSE: 'اسب', DOG: 'سگ', CAT: 'گربه', CAMEL: 'شتر',
}

const GOAL_FA: Record<string, string> = {
  GROW: 'رشد', MAINTAIN: 'حفظ وزن', GAIN: 'افزایش وزن',
  MILK: 'شیردهی', PREGNANT: 'آبستنی', LOSE: 'کاهش وزن',
  FATTENING: 'پرواربندی', LAYING: 'تخم‌گذاری',
}

const ENV_FA: Record<string, string> = {
  FARM: 'مزرعه', HOUSE: 'منزل', STABLE: 'اصطبل', FREE_RANGE: 'آزاد/چرا',
}

/** ضریب فعالیت بر اساس محیط نگهداری */
function activityFactor(env: string): number {
  switch (env) {
    case 'FREE_RANGE': return 1.20
    case 'FARM': return 1.10
    case 'STABLE': return 1.05
    case 'HOUSE': return 1.0
    default: return 1.1
  }
}

/** تنظیم دمایی: زیر 10°C و بالای 27°C نیاز انرژی تغییر می‌کند */
function thermalAdjustment(tempC?: number): number {
  if (tempC === undefined || tempC === null) return 1.0
  if (tempC < 10) return 1.0 + (10 - tempC) * 0.008 // افزایش مصرف انرژی در سرما
  if (tempC > 27) return 1.0 - (tempC - 27) * 0.005 // کاهش خوراک‌خوری در گرما
  return 1.0
}

/**
 * محاسبه نیازهای پایه — ساده‌شده از فرمول‌های NRC 2021 (دام بزرگ) و NRC 2007 (گوسفند/بز)
 */
export function computeRequirements(input: NutritionInput): NutritionOutput['requirements'] {
  const w = Math.max(input.weightKg, 1)
  const af = activityFactor(input.environment) * thermalAdjustment(input.tempC)
  let dm = 0, proteinPct = 0, energy = 0, fiberPct = 0, ca = 0, p = 0

  switch (input.species) {
    case 'COW':
    case 'BUFFALO': {
      // نگهداری: DM = 2.1% BW؛ NEm = 0.08*BW^0.75
      dm = w * 0.021
      const neMaintenance = 0.08 * Math.pow(w, 0.75)
      energy = neMaintenance * 1.7 * af // تبدیل به ME تقریبی
      proteinPct = 8.5
      fiberPct = 30
      ca = w * 0.03
      p = w * 0.02
      if (input.goal === 'MILK') {
        const milk = input.milkLiters ?? 15
        dm += milk * 0.45
        energy += milk * 0.72
        proteinPct += (milk * 0.055 * 100) / dm
        ca += milk * 1.2
        p += milk * 0.9
      }
      if (input.goal === 'PREGNANT') {
        const pm = input.pregnancyMonths ?? 6
        if (pm >= 6) { dm += w * 0.004 * pm; energy += neMaintenance * 0.35; proteinPct += 2.2; ca += w * 0.012; p += w * 0.008 }
      }
      if (input.goal === 'GROW' || input.goal === 'FATTENING' || input.goal === 'GAIN') {
        // گین روزانه ~ 0.9 کیلو
        dm += w * 0.008
        energy += neMaintenance * 0.85
        proteinPct += 4.5
      }
      break
    }
    case 'SHEEP':
    case 'GOAT': {
      dm = w * 0.032 * af
      energy = 0.09 * Math.pow(w, 0.75) * 1.75
      proteinPct = 10
      fiberPct = 28
      ca = w * 0.04
      p = w * 0.025
      if (input.goal === 'MILK') { dm += w * 0.012; energy += 1.2; proteinPct += 3 }
      if (input.goal === 'PREGNANT') { dm += w * 0.005; energy += 0.9; proteinPct += 3.5 }
      if (input.goal === 'GROW' || input.goal === 'FATTENING' || input.goal === 'GAIN') {
        dm += w * 0.011; energy += 1.6; proteinPct += 5.5
      }
      break
    }
    case 'POULTRY': {
      dm = w * 0.09 * af // مرغ ~9% وزن بدن خوراک می‌خورد
      energy = dm * 2.9 // Mcal ME/kg
      proteinPct = input.goal === 'LAYING' ? 17 : 20
      fiberPct = 5
      ca = input.goal === 'LAYING' ? dm * 35 : dm * 9
      p = dm * 4.5
      break
    }
    case 'HORSE': {
      dm = w * 0.022 * af
      energy = 0.095 * Math.pow(w, 0.75) * 1.7
      proteinPct = 10
      fiberPct = 25
      ca = w * 0.04
      p = w * 0.028
      break
    }
    case 'DOG': {
      dm = w * 0.025 * af
      energy = 95 * Math.pow(w, 0.75) / 1000 * 3.5 / 3.5 // kcal → Mcal
      energy = 0.095 * Math.pow(w, 0.75)
      proteinPct = 22
      fiberPct = 4
      ca = dm * 10
      p = dm * 8
      break
    }
    case 'CAT': {
      dm = w * 0.02 * af
      energy = 0.08 * Math.pow(w, 0.75)
      proteinPct = 30
      fiberPct = 3
      ca = dm * 10
      p = dm * 8
      break
    }
    default: {
      dm = w * 0.028 * af
      energy = 0.09 * Math.pow(w, 0.75) * 1.7
      proteinPct = 12
      fiberPct = 22
      ca = w * 0.035
      p = w * 0.022
    }
  }

  // اهداف ویژه
  if (input.goal === 'LOSE') { dm *= 0.85; proteinPct += 2; energy *= 0.88 }
  if (input.goal === 'GROW' && input.ageMonths < 12) { proteinPct += 3 }
  if (input.gender === 'MALE' && (input.goal === 'GROW' || input.goal === 'GAIN')) { proteinPct += 1 }

  const proteinKg = (dm * proteinPct) / 100
  const water = dm * 3.2 + w * 0.05 // تقریبی: آب = 3.2 برابر ماده خشک + 5% وزن

  return {
    dryMatterKg: round2(dm),
    proteinPercent: round1(proteinPct),
    proteinKg: round3(proteinKg),
    energyMcal: round2(energy),
    fiberPercent: round1(fiberPct),
    calciumG: Math.round(ca),
    phosphorusG: Math.round(p),
    waterLiters: Math.round(water),
  }
}

/**
 * ساخت جیره بهینه از خوراک‌های موجود — الگوریتم انتخاب نسبی بر اساس
 * نسبت ارزش تغذیه‌ای به قیمت + رعایت ساختار (علوفه خشک ≥ 30% برای نشخوارکنندگان)
 */
export function buildRation(
  input: NutritionInput,
  req: NutritionOutput['requirements'],
  foods: FoodNutrition[]
): { ration: RationItem[]; warnings: string[] } {
  const warnings: string[] = []
  const isRuminant = ['COW', 'SHEEP', 'GOAT', 'BUFFALO'].includes(input.species)

  // ارزش تغذیه‌ای ترکیبی هر خوراک
  const score = (f: FoodNutrition) => {
    const proteinScore = f.protein / Math.max(req.proteinPercent, 1)
    const energyScore = f.energy / 2.5
    const priceFactor = 1 / Math.max(f.pricePerKg, 1) // ارزان‌تر = امتیاز بیشتر
    return proteinScore * 0.45 + energyScore * 0.35 + priceFactor * 800 * 0.2
  }

  const pool = foods.filter(f => f.pricePerKg > 0)
  if (pool.length === 0) return { ration: [], warnings: ['بانک خوراک خالی است'] }

  const sorted = [...pool].sort((a, b) => score(b) - score(a))
  const ration: RationItem[] = []
  let remaining = req.dryMatterKg

  // ساختار جیره نشخوارکنندگان: ~45% علوفه، ~35% کنسانتره، ~20% مکمل
  const roughage = sorted.filter(f => f.category === 'ROUGHAGE')
  const concentrate = sorted.filter(f => f.category === 'CONCENTRATE' || f.category === 'ENERGY')
  const proteinFoods = sorted.filter(f => f.category === 'PROTEIN')
  const minerals = sorted.filter(f => f.category === 'MINERAL')

  const pick = (list: FoodNutrition[], share: number, minKg: number) => {
    if (list.length === 0) return
    const kg = Math.max(remaining * share, minKg)
    const primary = list[0]
    const asFed = kg / (primary.dryMatter / 100)
    ration.push({
      foodId: primary.id,
      name: primary.name,
      kgPerDay: round2(asFed),
      percentage: 0,
      proteinContribution: round3((kg * primary.protein) / 100),
      energyContribution: round2(kg * primary.energy),
      costPerDay: Math.round(asFed * primary.pricePerKg),
    })
  }

  if (isRuminant) {
    pick(roughage, 0.45, remaining * 0.3)
    pick(concentrate, 0.35, remaining * 0.2)
    pick(proteinFoods, 0.15, remaining * 0.05)
    pick(minerals, 0.01, 0.05)
    if (roughage.length === 0) warnings.push('علوفه خشک در بانک خوراک موجود نیست — افزودن یونجه یا کاه ضروری است')
  } else {
    pick(concentrate, 0.7, remaining * 0.5)
    pick(proteinFoods, 0.25, remaining * 0.1)
    pick(minerals, 0.02, 0.02)
  }

  // محاسبه درصدها و جمع کل
  const totalKg = ration.reduce((s, r) => s + r.kgPerDay, 0)
  ration.forEach(r => { r.percentage = round1((r.kgPerDay / totalKg) * 100) })

  return { ration, warnings }
}

/** ارزیابی جیره در برابر نیازها */
export function evaluateRation(
  ration: RationItem[],
  req: NutritionOutput['requirements'],
  foods: FoodNutrition[]
): NutritionOutput['balance'] & { totals: NutritionOutput['totals'] } {
  let totalDM = 0, totalProtein = 0, totalEnergy = 0, totalFiberW = 0, totalCa = 0, totalP = 0, totalCost = 0

  for (const r of ration) {
    const f = foods.find(x => x.id === r.foodId)
    if (!f) continue
    const dm = r.kgPerDay * (f.dryMatter / 100)
    totalDM += dm
    totalProtein += dm * (f.protein / 100)
    totalEnergy += dm * f.energy
    totalFiberW += dm * f.fiber
    totalCa += dm * (f.calcium / 100) * 1000 // g
    totalP += dm * (f.phosphorus / 100) * 1000
    totalCost += r.costPerDay
  }

  const proteinPct = totalDM > 0 ? (totalProtein / totalDM) * 100 : 0
  const fiberPct = totalDM > 0 ? (totalFiberW / totalDM) * 100 : 0

  const proteinDiff = round1(((proteinPct - req.proteinPercent) / req.proteinPercent) * 100)
  const energyDiff = round1(((totalEnergy - req.energyMcal) / req.energyMcal) * 100)
  const fiberDiff = round1(((fiberPct - req.fiberPercent) / Math.max(req.fiberPercent, 1)) * 100)

  const warnings: string[] = []
  if (Math.abs(proteinDiff) > 15) warnings.push(proteinDiff > 0 ? 'پروتئین جیره بالاتر از نیاز است' : 'پروتئین جیره کافی نیست')
  if (Math.abs(energyDiff) > 15) warnings.push(energyDiff > 0 ? 'انرژی جیره بالاتر از نیاز است' : 'انرژی جیره کافی نیست')
  if (totalCa < req.calciumG * 0.8) warnings.push('کلسیم جیره کم است')

  return {
    totals: {
      dryMatterKg: round2(totalDM),
      proteinPercent: round1(proteinPct),
      energyMcal: round2(totalEnergy),
      fiberPercent: round1(fiberPct),
      calciumG: Math.round(totalCa),
      phosphorusG: Math.round(totalP),
      costPerDay: totalCost,
      costPerMonth: totalCost * 30,
    },
    balance: {
      proteinDiff, energyDiff, fiberDiff,
      status: Math.abs(proteinDiff) <= 15 && Math.abs(energyDiff) <= 15 ? 'BALANCED' : 'NEEDS_ADJUSTMENT',
      warnings,
    },
  }
}

/** اجرای کامل موتور تغذیه */
export function runNutritionEngine(
  input: NutritionInput,
  foods: FoodNutrition[]
): NutritionOutput {
  const req = computeRequirements(input)
  const { ration, warnings } = buildRation(input, req, foods)
  const { totals, balance } = evaluateRation(ration, req, foods)
  balance.warnings = [...warnings, ...balance.warnings]

  return {
    animal: {
      species: input.species,
      speciesFa: SPECIES_FA[input.species] || input.species,
      weightKg: input.weightKg,
      ageMonths: input.ageMonths,
      goal: input.goal,
      goalFa: GOAL_FA[input.goal] || input.goal,
      environment: input.environment,
      environmentFa: ENV_FA[input.environment] || input.environment,
    },
    requirements: req,
    ration,
    totals,
    balance,
    version: 'nutri-engine-v1.2 (NRC-based)',
    calculatedAt: new Date().toISOString(),
  }
}

function round1(n: number) { return Math.round(n * 10) / 10 }
function round2(n: number) { return Math.round(n * 100) / 100 }
function round3(n: number) { return Math.round(n * 1000) / 1000 }
