import { unitPrice, type CartLine } from './cart'
import type { L10n } from './data'
import type { Mode } from './components/Welcome'

export const toCents = (amount: number) => Math.round(amount * 100)
export const l10n = (en: string, hk: string, zh: string): L10n => ({ en, hk, zh })

export const storeRules = {
  servicePercent: 10,
  packagingCents: 200,
  unpackagedCategory: 'sweets',
  tips: true,
}

export const offerLabels = {
  dish: l10n('Egg tart special', '蛋撻活動價', '蛋挞活动价'),
  activity: l10n('Roast meal offer', '燒味餐減免', '烧味餐减免'),
}

export const coupons = [
  { id: 'stack', name: l10n('$10 meal coupon', '餐飲券減 $10', '餐饮券减 $10'), cents: 1000, minimum: 20000 },
  { id: 'pickup', name: l10n('$15 takeaway coupon', '外帶券減 $15', '外带券减 $15'), cents: 1500, minimum: 18000 },
] as const

export type CouponId = typeof coupons[number]['id']
export type QuoteOptions = { mode: Mode; coupon: CouponId | null; addOn: boolean; packagingCents: number }
export type Saving = { key: string; name: L10n; cents: number; included: boolean }
export type PriceQuote = {
  subtotal: number
  service: number
  packaging: number
  savings: Saving[]
  total: number
  coupon: CouponId | null
  rows: Record<string, number>
}
export type CouponIssue = { kind: 'takeaway' | 'used' } | { kind: 'minimum'; gap: number }

function unitSavings(line: CartLine, options: QuoteOptions) {
  return {
    dish: options.mode === 'takeaway' && line.dish.id === 'sw1' ? 200 : 0,
  }
}

export function couponIssue(lines: CartLine[], options: QuoteOptions, id: CouponId): CouponIssue | null {
  if (options.addOn) return { kind: 'used' }
  if (id === 'pickup' && options.mode !== 'takeaway') return { kind: 'takeaway' }
  const subtotal = lines.reduce((sum, line) => {
    const savings = unitSavings(line, options)
    return sum + (toCents(unitPrice(line.dish, line.opts)) - savings.dish) * line.qty
  }, 0)
  const gap = coupons.find((coupon) => coupon.id === id)!.minimum - subtotal
  return gap > 0 ? { kind: 'minimum', gap } : null
}

export function quoteCart(lines: CartLine[], options: QuoteOptions): PriceQuote {
  const rows: PriceQuote['rows'] = {}
  let subtotal = 0
  let packaging = 0
  let dishSavings = 0
  for (const line of lines) {
    const savings = unitSavings(line, options)
    const gross = toCents(unitPrice(line.dish, line.opts)) * line.qty
    const net = gross - savings.dish * line.qty
    rows[line.key] = net
    subtotal += net
    if (options.mode === 'takeaway' && line.dish.category !== storeRules.unpackagedCategory) packaging += options.packagingCents * line.qty
    dishSavings += savings.dish * line.qty
  }
  const service = options.mode === 'dine' ? Math.round(subtotal * storeRules.servicePercent / 100) : 0
  const coupon = options.coupon && !couponIssue(lines, options, options.coupon) ? options.coupon : null
  const autoOffer = !options.addOn && subtotal >= 18000 && lines.some((line) => line.dish.category === 'roast')
  const savings: Saving[] = []
  if (dishSavings) savings.push({ key: 'dish', name: offerLabels.dish, cents: dishSavings, included: true })
  if (autoOffer && coupon !== 'pickup') savings.push({ key: 'activity', name: offerLabels.activity, cents: 1000, included: false })
  const appliedCoupon = coupons.find((item) => item.id === coupon)
  if (appliedCoupon) savings.push({ key: coupon!, name: appliedCoupon.name, cents: appliedCoupon.cents, included: false })
  const deductions = savings.reduce((sum, saving) => sum + (saving.included ? 0 : saving.cents), 0)
  return { subtotal, service, packaging, savings, coupon, rows, total: subtotal + service + packaging - deductions }
}
