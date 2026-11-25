import { uiText } from '../i18n'
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronRight } from 'lucide-react'
import { strings, type Lang } from '../data'
import type { CartLine } from '../cart'
import { couponIssue, coupons, l10n, quoteCart, type CouponId, type CouponIssue, type PriceQuote, type QuoteOptions } from '../pricing'
import { BottomSheet, Button, Row, choiceBase, choiceState, money } from './ui'

export const feeText = {
  offers: l10n('Offers', '優惠', '优惠'),
  coupons: l10n('Coupons', '優惠券', '优惠券'),
  estimate: l10n('Total', '總計', '总计'),
  included: l10n('Already included in item prices', '已計入菜價', '已计入菜价'),
  save: l10n('Saved', '已省', '已省'),
  noCoupon: l10n('No coupon', '不使用優惠券', '不使用优惠券'),
  limited: l10n('Takeaway only', '限外帶', '仅限外带'),
  addOnOnly: l10n('Order coupons do not apply to add-ons', '訂單優惠券不適用於加菜', '订单优惠券不适用于加菜'),
  replace: l10n('This coupon replaces the current activity discount.', '此券不能與目前活動疊加，使用後將取代活動減免。', '此券不可与当前活动叠加，使用后将替换活动减免。'),
  confirmCoupon: l10n('Confirm coupon selection', '確認選券', '确认选券'),
  preview: l10n('Offer preview', '優惠預覽', '优惠预览'),
  invalidated: l10n('Coupon removed:', '優惠券已移除：', '优惠券已移除：'),
  reprice: l10n('The store updated the packaging fee. Review the new total and submit again.', '門店更新了包裝費。請核對新金額後，再按「提交訂單」。', '门店更新了包装费。请核对新金额后，再点「提交订单」。'),
  details: l10n('View breakdown', '查看明細', '查看明细'),
  cancelledTotal: l10n('Original order total', '原訂單金額', '原订单金额'),
  addOnHint: l10n('Only new items and their fees will be added to the existing bill.', '只會將本次加菜及相關費用加入原帳單。', '只会将本次加菜及相关费用加入原账单。'),
  addTip: l10n('Add a tip (optional)', '添加小費（自願）', '添加小费（自愿）'),
  noTip: l10n('No tip', '不加小費', '不加小费'),
  payTotal: l10n('Charged now', '本次付款', '本次付款'),
  availableCoupons: l10n('Available', '可用優惠券', '可用优惠券'),
  unavailableCoupons: l10n('Unavailable', '不可用優惠券', '不可用优惠券'),
  selected: l10n('Selected', '已選', '已选'),
  available: l10n('Available', '可使用', '可使用'),
  unavailable: l10n('Unavailable', '不可使用', '不可使用'),
}

export function describeCouponIssue(issue: CouponIssue, lang: Lang) {
  switch (issue.kind) {
    case 'minimum': return lang === 'en' ? `${money(issue.gap / 100)} more required` : `還差 ${money(issue.gap / 100)}`.replace('還', lang === 'zh' ? '还' : '還')
    case 'takeaway': return feeText.limited[lang]
    case 'used': return feeText.addOnOnly[lang]
  }
}

export function FeeRows({ quote, lang, tip = 0, totalLabel, total = quote.total + tip }: {
  quote: Pick<PriceQuote, 'subtotal' | 'service' | 'packaging' | 'savings' | 'total'>
  lang: Lang
  tip?: number
  totalLabel?: string
  total?: number
}) {
  return (
    <dl className="amount-rows">
      <Row k={strings.subtotal[lang]} v={money(quote.subtotal / 100)} />
      {quote.service > 0 && <Row k={strings.service[lang]} v={money(quote.service / 100)} />}
      {quote.packaging > 0 && <Row k={strings.packagingFee[lang]} v={money(quote.packaging / 100)} />}
      {quote.savings.map((saving) => {
        const coupon = coupons.find((item) => item.id === saving.key)
        const label = (
          <span className="flex flex-wrap items-center gap-1.5">
            <span>{strings.discount[lang]}</span>
            <span className="rounded-sm bg-tile px-1.5 py-0.5 text-caption font-medium text-ink-2">
              {coupon ? (uiText(lang, 'coupon_c80c3')) : saving.name[lang]}
            </span>
            {coupon && <span className="text-caption text-ink-2">{lang === 'en' ? `$${coupon.minimum / 100} minimum` : lang === 'zh' ? `满 $${coupon.minimum / 100}` : `滿 $${coupon.minimum / 100}`}</span>}
          </span>
        )
        return <Row key={saving.key} k={label} v={saving.included
          ? <span className="text-caption text-ink-2">{feeText.save[lang]} {money(saving.cents / 100)} · {feeText.included[lang]}</span>
          : <span className="whitespace-nowrap">−{money(saving.cents / 100)}</span>} />
      })}
      {tip > 0 && <Row k={strings.tip[lang]} v={money(tip / 100)} />}
      {totalLabel && <Row k={totalLabel} v={money(total / 100)} strong />}
    </dl>
  )
}

export function Offers({ lines, options, quote, lang, onCoupon }: {
  lines: CartLine[]
  options: QuoteOptions
  quote: PriceQuote
  lang: Lang
  onCoupon: (id: CouponId | null) => void
}) {
  const [panel, setPanel] = useState<'coupons' | null>(null)
  const [draft, setDraft] = useState<CouponId | null>(null)
  const preview = quoteCart(lines, { ...options, coupon: draft })
  const replaces = quoteCart(lines, { ...options, coupon: null }).savings.some((row) => row.key === 'activity')
  const overlay = document.getElementById('ordering-frame')
  const selected = coupons.find((item) => item.id === quote.coupon)
  const available = coupons.filter((item) => !couponIssue(lines, options, item.id))
  const unavailable = coupons.filter((item) => !!couponIssue(lines, options, item.id))
  return (
    <>
      <div>
        <button type="button" onClick={() => { setDraft(quote.coupon); setPanel('coupons') }} disabled={options.addOn} className="flex min-h-11 w-full items-center justify-between gap-2 text-left text-body disabled:text-ink-2">
          <span className="flex min-w-0 flex-wrap items-center gap-1.5">
            <span>{feeText.coupons[lang]}</span>
            {selected && <span className="rounded-sm bg-brand-soft px-1.5 py-0.5 text-caption text-brand-strong">{lang === 'en' ? `$${selected.minimum / 100} minimum` : lang === 'zh' ? `满 $${selected.minimum / 100} 减 $${selected.cents / 100}` : `滿 $${selected.minimum / 100} 減 $${selected.cents / 100}`}</span>}
          </span>
          <span className="flex shrink-0 items-center gap-1 text-callout text-ink-2">
            {options.addOn ? feeText.addOnOnly[lang] : selected ? `−${money(selected.cents / 100)}` : available.length ? (lang === 'en' ? `${available.length} available` : lang === 'zh' ? `${available.length} 张可用` : `${available.length} 張可用`) : (lang === 'en' ? 'No available coupons' : lang === 'zh' ? '暂无可用优惠券' : '暫無可用優惠券')}
            {!options.addOn && <ChevronRight className="size-4" aria-hidden="true" />}
          </span>
        </button>
      </div>
      {panel === 'coupons' && overlay && createPortal(<BottomSheet title={feeText.coupons[lang]} onClose={() => setPanel(null)} footer={
        <Button className="w-full" onClick={() => { onCoupon(preview.coupon); setPanel(null) }}>{feeText.confirmCoupon[lang]}</Button>
      }>
        {available.length === 0 && <p role="status" className="mb-3 text-callout text-ink-2">{lang === 'en' ? 'No available coupons for this order' : lang === 'zh' ? '本单暂无可用优惠券' : '本單暫無可用優惠券'}</p>}
        <button type="button" aria-pressed={draft === null} onClick={() => setDraft(null)} className={`flex min-h-12 w-full items-center justify-between rounded-md px-4 text-left text-body ${choiceBase} ${choiceState(draft === null)}`}>
          {feeText.noCoupon[lang]}
          {draft === null && <Check className="size-5 shrink-0 text-brand" aria-hidden="true" />}
        </button>
        {available.length > 0 && <div className="mt-4">
          <h3 className="mb-2 text-body font-semibold text-ink-2">{feeText.availableCoupons[lang]} · {available.length}</h3>
          <div className="space-y-2">
            {available.map((coupon) => (
              <button key={coupon.id} type="button" aria-pressed={draft === coupon.id} onClick={() => setDraft(coupon.id)} className={`flex min-h-14 w-full items-center justify-between gap-3 rounded-md px-4 py-2.5 text-left ${choiceBase} ${choiceState(draft === coupon.id)}`}>
                <span className="min-w-0">
                  <span className="block text-body font-semibold text-ink">{coupon.name[lang]}</span>
                  {coupon.id === 'pickup' && replaces && <span className="mt-1 block text-caption text-ink-2">{feeText.replace[lang]}</span>}
                </span>
                <span className={`flex shrink-0 items-center gap-1 text-caption font-semibold ${draft === coupon.id ? 'text-brand' : 'text-ink-2'}`}>
                  {draft === coupon.id ? feeText.selected[lang] : feeText.available[lang]}
                  {draft === coupon.id && <Check className="size-4" aria-hidden="true" />}
                </span>
              </button>
            ))}
          </div>
        </div>}
        {unavailable.length > 0 && <div className="mt-4">
          <h3 className="mb-2 text-body font-semibold text-ink-2">{feeText.unavailableCoupons[lang]} · {unavailable.length}</h3>
          <div className="space-y-2">
            {unavailable.map((coupon) => {
              const issue = couponIssue(lines, options, coupon.id)!
              return <div key={coupon.id} aria-label={`${coupon.name[lang]} · ${feeText.unavailable[lang]} · ${describeCouponIssue(issue, lang)}`} className="flex min-h-14 items-center justify-between gap-3 rounded-md border border-line bg-tile px-4 py-2.5">
                <div className="min-w-0">
                  <p className="text-body font-medium text-ink-2">{coupon.name[lang]}</p>
                  <p className="mt-0.5 text-caption text-ink-2">{describeCouponIssue(issue, lang)}</p>
                </div>
                <span className="shrink-0 text-caption font-medium text-ink-2">{feeText.unavailable[lang]}</span>
              </div>
            })}
          </div>
        </div>}
        <div className="mt-4 border-t border-line pt-3">
          <h3 className="mb-2 text-body font-semibold">{feeText.preview[lang]}</h3>
          <FeeRows quote={preview} lang={lang} totalLabel={feeText.estimate[lang]} />
        </div>
      </BottomSheet>, overlay)}
    </>
  )
}
