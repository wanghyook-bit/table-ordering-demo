import { uiText } from '../i18n'
import { Check, ChevronRight, Clock, Wallet, X } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { strings, type L10n, type Lang } from '../data'
import { optsLabel, type CartLine } from '../cart'
import type { Mode } from './Welcome'
import { toCents, type PriceQuote, type Saving } from '../pricing'
import { FeeRows, feeText } from './pricing'
import { StoreCard } from './store'
import { ActionBar, BottomSheet, Button, DishImage, Empty, money, Page, Price, Row, Section, StatusPanel, TableIdentity, Tag, TextButton } from './ui'

/** One submission to the kitchen (first order or an add-on). Paid later. */
export type Round = { id: number; lines: CartLine[]; mode: Mode; quote: PriceQuote; time: string; createdAt?: string }
export type PaymentRecord = { id: string; orderNo: number; methodId: string; name: L10n; amount: number; tip: number; paidAt: Date }
type OrderStatus = 'waiting' | 'accepted' | 'cancelled'

export function formatOrderTime(round?: Round): string | undefined {
  if (!round?.createdAt) return round?.time
  const date = new Date(round.createdAt)
  if (Number.isNaN(date.getTime())) return round.time
  const two = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${two(date.getMonth() + 1)}-${two(date.getDate())} ${two(date.getHours())}:${two(date.getMinutes())}:${two(date.getSeconds())}`
}

export function calculateBill(rounds: Round[], payments: PaymentRecord[]) {
  const subtotal = rounds.reduce((sum, round) => sum + round.quote.subtotal, 0)
  const service = rounds.reduce((sum, round) => sum + round.quote.service, 0)
  const packaging = rounds.reduce((sum, round) => sum + round.quote.packaging, 0)
  const tip = payments.reduce((sum, payment) => sum + payment.tip, 0)
  const paid = payments.reduce((sum, payment) => sum + toCents(payment.amount), 0)
  const total = rounds.reduce((sum, round) => sum + round.quote.total, 0)
  const savings = new Map<string, Saving>()
  for (const round of rounds) {
    for (const saving of round.quote.savings) {
      savings.set(saving.key, { ...saving, cents: (savings.get(saving.key)?.cents ?? 0) + saving.cents })
    }
  }
  return {
    quote: { subtotal, service, packaging, total, savings: [...savings.values()] },
    tip, total: (total + tip) / 100, paid: paid / 100, remaining: Math.max(0, total + tip - paid) / 100,
  }
}

const settlementTime = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Hong_Kong',
  year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
})

function formatSettlementTime(date: Date) {
  const parts = Object.fromEntries(settlementTime.formatToParts(date).map(({ type, value }) => [type, value]))
  return `${parts.month}/${parts.day}/${parts.year} ${parts.hour}:${parts.minute}:${parts.second}`
}

export const itemCount = (lines: CartLine[]) => lines.reduce((sum, line) => sum + line.qty, 0)
export const countLabel = (count: number, lang: Lang) => (lang === 'en' ? `${count} ${count === 1 ? 'item' : 'items'}` : `共 ${count} 件`)

/** Read-only item rows (thumb · name · per-dish status · options · price · qty) shared by confirm, order detail and payment. */
export function ItemList({ lines, lang, amounts, status }: { lines: CartLine[]; lang: Lang; amounts: Record<string, number>; status?: 'pending' | 'ordered' }) {
  return <ul className="confirm-items">{lines.map((line) => {
    const options = optsLabel(line.opts, line.note, lang)
    return <li key={line.key} className="confirm-item">
      <DishImage src={line.dish.image} alt={line.dish.name[lang]} className="confirm-item-image" />
      <div className="confirm-item-info"><div className="confirm-item-title">{status && <span className={`confirm-status ${status}`}>{status === 'ordered' ? (uiText(lang, 'ordered_fc521')) : (uiText(lang, 'not_ordered_95579'))}</span>}<strong>{line.dish.name[lang]}</strong></div>
        {options && <p className="confirm-options">{options}</p>}<div className="confirm-item-bottom"><span>×{line.qty}</span><strong>{money((amounts[line.key] ?? 0) / 100)}</strong></div></div>
    </li>
  })}</ul>
}

/**
 * One kitchen round. The round is the group heading; each dish only carries its own
 * state (not ordered / ordered) instead of repeating "第 N 次下單" on every row.
 */
export function RoundGroup({ index, lines, lang, amounts, status, showRound = true }: { index: number; lines: CartLine[]; lang: Lang; amounts: Record<string, number>; status?: 'pending' | 'ordered'; showRound?: boolean }) {
  return (
    <div>
      {showRound && <h3 className="mb-2 text-callout font-semibold text-ink">{lang === 'en' ? `Round ${index}` : lang === 'zh' ? `第 ${index} 轮` : `第 ${index} 輪`}</h3>}
      <ItemList lines={lines} lang={lang} amounts={amounts} status={status} />
    </div>
  )
}

export function OrderDetail({
  rounds,
  bill,
  payments,
  animateSuccess,
  lastPaidAmount,
  mode,
  orderNo,
  pickup,
  receiptNo,
  lang,
  status,
  onAccept,
  onReject,
  onClose,
  onAddMore,
  onPay,
  onFinish,
  table, online, canAddDishes, manualSettlement, settled, onSettle, tablePrepay, guests, orderNote,
}: {
  rounds: Round[]
  bill: ReturnType<typeof calculateBill>
  payments: PaymentRecord[]
  animateSuccess: boolean
  lastPaidAmount: number | null
  mode: Mode
  orderNo: number
  pickup: string
  receiptNo: string
  lang: Lang
  status: OrderStatus | null
  onAccept: () => void
  onReject: () => void
  onClose: () => void
  onAddMore: () => void
  onPay: () => void
  onFinish: () => void
  table: string | null
  online: boolean
  canAddDishes: boolean
  manualSettlement: boolean
  settled: boolean
  onSettle: () => void
  tablePrepay: boolean
  guests: number
  orderNote: string
}) {
  const t = (s: L10n) => s[lang]
  const [historyOpen, setHistoryOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const { total, paid, remaining } = bill
  const allPaid = status === 'accepted' && remaining === 0
  const lastPayment = payments[payments.length - 1]
  const methods = new Map<string, { name: L10n; amount: number }>()
  for (const payment of payments) {
    methods.set(payment.methodId, { name: payment.name, amount: (methods.get(payment.methodId)?.amount ?? 0) + payment.amount })
  }

  const StatusIcon = status === 'cancelled' ? X : Clock

  if (table && status) {
    const completed = allPaid && (!manualSettlement || settled)
    const title = status === 'waiting' ? t(strings.awaitingAcceptance)
      : status === 'cancelled' ? t(strings.orderCancelled)
      : completed ? uiText(lang, 'completed_f1a22')
      : allPaid ? uiText(lang, 'paid_86900') : uiText(lang, 'awaiting_payment_99cbe')
    const description = status === 'waiting' ? t(strings.payAfterAcceptance)
      : status === 'cancelled' ? t(strings.rejectedHint)
      : completed || allPaid || online ? undefined : uiText(lang, 'please_pay_at_the_cashier_94edf')
    const showPay = status === 'accepted' && online && remaining > 0
    return (
    <Page className="order-design" title={uiText(lang, 'order_details_22864')} onBack={onClose} footer={status === 'accepted' && (canAddDishes || showPay || allPaid) && (
      <div className="confirm-actions">
        {canAddDishes && <Button variant="secondary" onClick={onAddMore} className="flex-1">{t(strings.addDishes)}</Button>}
        {(showPay || allPaid) && <Button onClick={onPay} disabled={allPaid} className="flex-1">{t(strings.pay)}</Button>}
      </div>
    )}>
      <Section>
        {allPaid ? <div className="order-success"><img src={`${import.meta.env.BASE_URL}confirm-assets/payment-success.png`} alt="" /><strong>{uiText(lang, 'payment_successful_e6774')}</strong></div> : <div className={`order-success order-status-illustration ${status === 'cancelled' ? 'is-cancelled' : ''}`}>
          <div className="order-status-art" aria-hidden="true"><span className="order-status-orbit" /><span className="order-status-circle">{status === 'cancelled' ? <X size={44} strokeWidth={2.5} /> : <Clock size={44} strokeWidth={2.5} />}</span></div>
          <strong>{title}</strong>{description && <span className="order-status-description">{description}</span>}
        </div>}
      </Section>
      <Section
        title={uiText(lang, 'items_2f38f')}
        trailing={<span className="text-caption text-ink-2 tabular-nums">{countLabel(rounds.reduce((sum, round) => sum + itemCount(round.lines), 0), lang)}</span>}
      >
        <div className="confirm-item-groups">
          {rounds.map((round, index) => (
            <RoundGroup
              key={round.id}
              index={index + 1}
              lines={round.lines}
              lang={lang}
              amounts={round.quote.rows}
              status={status === 'accepted' ? 'ordered' : undefined}
              showRound={false}
            />
          ))}
        </div>
      </Section>
      {status === 'waiting' && <Section title={t(strings.simulateMerchant)}><div className="flex gap-3"><Button size="md" variant="secondary" onClick={onReject} className="flex-1">{t(strings.simulateReject)}</Button><Button size="md" onClick={onAccept} className="flex-1">{t(strings.simulateAccept)}</Button></div></Section>}
      <Section title={uiText(lang, 'amount_details_25bdd')}>
        <OrderAmounts quote={bill.quote} tip={bill.tip} total={total} paid={paid} remaining={status === 'cancelled' ? 0 : remaining} lang={lang} onPaymentHistory={payments.length ? () => setHistoryOpen(true) : undefined} />
      </Section>
      <Section title={uiText(lang, 'order_information_fd7fd')}>
        <dl className="order-information">
          <Row k={uiText(lang, 'order_number_6b17e')} v={`#${orderNo}`} />
          {formatOrderTime(rounds[0]) && <Row k={uiText(lang, 'order_time_38773')} v={formatOrderTime(rounds[0])} />}
          {orderNote && <Row k={uiText(lang, 'order_note_756d0')} v={orderNote} />}
        </dl>
        {manualSettlement && allPaid && !settled && <TextButton tone="muted" underline className="mt-3" onClick={onSettle}>{uiText(lang, 'simulate_staff_settlement_30a6f')}</TextButton>}
      </Section>
      {historyOpen && (
        <BottomSheet title={t(strings.paymentHistory)} onClose={() => setHistoryOpen(false)}>
          <PaymentHistory payments={payments} lang={lang} />
        </BottomSheet>
      )}
    </Page>
    )
  }

  return (
    <Page
      className="order-design"
      title={t(strings.orders)}
      onBack={onClose}
      footer={
        status === 'accepted' && (
          <ActionBar label={allPaid ? t(strings.total) : t(strings.balanceDue)} total={allPaid ? total : remaining} hideLabel={allPaid}>
            <div className="flex w-full gap-3">
              {allPaid && (!table || settled || !manualSettlement) ? (
                <Button onClick={onFinish} className="min-w-0 flex-1 whitespace-nowrap max-[359px]:px-3">
                  {t(strings.finish)}
                </Button>
              ) : !allPaid && online ? (
                <Button onClick={onPay} className="min-w-0 flex-1 whitespace-nowrap max-[359px]:px-3">
                  <Wallet className="size-4" />
                  {t(paid > 0 ? strings.continuePay : strings.goPay)}
                </Button>
              ) : null}
            </div>
          </ActionBar>
        )
      }
    >
      {!status ? (
        <Empty title={t(strings.noOrders)} />
      ) : (
        <>
          <Section>
            <StatusPanel
              tone={status === 'cancelled' ? 'danger' : status === 'accepted' && allPaid ? 'success' : 'pending'}
              icon={status === 'accepted' && allPaid ? <Check className="size-5" /> : <StatusIcon className="size-5" aria-hidden="true" />}
              title={status === 'accepted' ? (remaining > 0 ? (uiText(lang, 'awaiting_payment_99cbe')) : manualSettlement && !settled ? (uiText(lang, 'awaiting_settlement_20fa3')) : (uiText(lang, 'completed_f1a22'))) : t(status === 'cancelled' ? strings.orderCancelled : strings.awaitingAcceptance)}
              description={status === 'accepted' ? (remaining > 0 && !online ? (uiText(lang, 'please_pay_at_the_cashier_94edf')) : t(strings.merchantAccepted)) : t(status === 'cancelled' ? strings.rejectedHint : strings.payAfterAcceptance)}
            />
            {table && <div className="mt-3 border-t border-line pt-3"><TableIdentity table={table} mode={mode} guests={guests} lang={lang} /></div>}
          </Section>

          {status !== 'cancelled' && (
            <Section title={t(strings.bill)}>
              <dl>
                <div>
                  <dt className="text-callout font-semibold text-ink-2">{t(allPaid ? strings.fullyPaid : strings.balanceDue)}</dt>
                  <dd className="mt-1 text-title font-semibold text-ink tabular-nums">{money(remaining)}</dd>
                </div>
                <div className="mt-3 space-y-2 border-t border-line pt-3">
                  <Row k={t(strings.billTotal)} v={money(total)} />
                  <Row k={t(strings.confirmedPaid)} v={money(paid)} />
                </div>
              </dl>
              {lastPaidAmount !== null && (
                <p role="status" className="mt-3 flex items-center gap-1.5 rounded-md bg-success-soft px-3 py-2 text-callout font-medium text-success">
                  <Check className="size-4" aria-hidden="true" />
                  {t(strings.paymentReceived)} {money(lastPaidAmount)}
                </p>
              )}
              {payments.length > 0 && <TextButton weight="medium" className="mt-2 gap-1" onClick={() => setHistoryOpen(true)}>
                {t(strings.viewPayments)} <ChevronRight className="size-4" aria-hidden="true" />
              </TextButton>}
              <TextButton weight="medium" className="gap-1" onClick={() => setDetailsOpen(true)}>
                {t(feeText.details)} <ChevronRight className="size-4" aria-hidden="true" />
              </TextButton>
            </Section>
          )}

          {status === 'cancelled' && <Section title={t(strings.receiptBreakdown)}>
            <FeeRows quote={bill.quote} lang={lang} totalLabel={t(feeText.cancelledTotal)} />
          </Section>}

          {status === 'waiting' && (
            <Section title={t(strings.simulateMerchant)}>
              <div className="flex gap-3">
                <Button size="md" variant="secondary" onClick={onReject} className="flex-1">{t(strings.simulateReject)}</Button>
                <Button size="md" onClick={onAccept} className="flex-1">{t(strings.simulateAccept)}</Button>
              </div>
            </Section>
          )}

          {status === 'accepted' && !table && mode === 'takeaway' && (
            <Section title={t(strings.pickupNoTitle)}>
              <p className="text-display font-semibold tracking-wider text-ink tabular-nums">{pickup}</p>
            </Section>
          )}

          {status === 'accepted' && !table && mode === 'takeaway' && (
            <Section title={t(strings.pickupStore)}>
              <StoreCard lang={lang} showDistance />
            </Section>
          )}

          {status === 'accepted' && <Section><p className="text-callout text-ink-2">{uiText(lang, 'please_follow_staff_instructions_d9c43')}</p>{manualSettlement && allPaid && !settled && <TextButton tone="muted" underline className="mt-2" onClick={onSettle}>{uiText(lang, 'simulate_staff_settlement_30a6f')}</TextButton>}</Section>}
          {status === 'accepted' && <Section
            title={`${t(strings.order)} #${orderNo}`}
            trailing={<span className="text-caption text-ink-2 tabular-nums">{countLabel(rounds.reduce((sum, r) => sum + itemCount(r.lines), 0), lang)}</span>}
          >
            <div className="space-y-5">
              {rounds.map((r, i) => (
                <RoundGroup
                  key={r.id}
                  index={i + 1}
                  lines={r.lines}
                  lang={lang}
                  amounts={r.quote.rows}
                  status="ordered"
                />
              ))}
            </div>
          </Section>}

          {allPaid ? (
            <Section title={t(strings.receiptBreakdown)}>
              <FeeRows quote={bill.quote} tip={bill.tip} lang={lang} totalLabel={t(strings.billTotal)} />
              {methods.size > 0 && (
                <div className="mt-4 border-t border-line pt-3">
                  <h3 className="mb-2 text-callout font-semibold text-ink-2">{t(strings.payMethod)}</h3>
                  <dl className="space-y-2">
                    {[...methods].map(([id, method]) => <Row key={id} k={t(method.name)} v={money(method.amount)} />)}
                  </dl>
                </div>
              )}
              {lastPayment && (
                <dl className="mt-4 space-y-2 border-t border-line pt-3">
                  <Row k={t(strings.receiptNumber)} v={receiptNo} />
                  <Row k={t(strings.orderType)} v={t(mode === 'dine' ? strings.dineIn : strings.takeaway)} />
                  <Row k={t(strings.settledAt)} v={<time dateTime={lastPayment.paidAt.toISOString()}>{formatSettlementTime(lastPayment.paidAt)}</time>} />
                </dl>
              )}
            </Section>
          ) : null}

          {detailsOpen && (
            <BottomSheet title={t(strings.receiptBreakdown)} onClose={() => setDetailsOpen(false)}>
              <FeeRows quote={bill.quote} tip={bill.tip} lang={lang} totalLabel={t(strings.billTotal)} />
            </BottomSheet>
          )}

          {historyOpen && (
            <BottomSheet title={t(strings.paymentHistory)} onClose={() => setHistoryOpen(false)}>
              <PaymentHistory payments={payments} lang={lang} />
            </BottomSheet>
          )}
        </>
      )}
    </Page>
  )
}

export function OrderAmounts({ quote, tip = 0, total, paid, remaining, lang, onPaymentHistory, showSummary = true }: { quote: Pick<PriceQuote, 'subtotal' | 'service' | 'packaging' | 'savings' | 'total'>; tip?: number; total: number; paid?: number; remaining: number; lang: Lang; onPaymentHistory?: () => void; showSummary?: boolean }) {
  return <dl className="order-amounts">
    <div className="order-amount-breakdown">
      <Row k={lang === 'en' ? 'Items total' : lang === 'zh' ? '商品总额' : '商品總額'} v={money(quote.subtotal / 100)} />
      {quote.service > 0 && <Row k={strings.service[lang]} v={money(quote.service / 100)} />}
      {quote.packaging > 0 && <Row k={strings.packagingFee[lang]} v={money(quote.packaging / 100)} />}
      {tip > 0 && <Row k={strings.tip[lang]} v={money(tip / 100)} />}
      {quote.savings.map((saving) => <Row key={saving.key} k={saving.name[lang]} v={saving.included ? `${feeText.save[lang]} ${money(saving.cents / 100)} · ${feeText.included[lang]}` : `−${money(saving.cents / 100)}`} />)}
    </div>
    {showSummary && <div className="order-amount-summary">
      <Row k={strings.billTotal[lang]} v={money(total)} strong />
      {paid !== undefined && <Row k={onPaymentHistory ? <button type="button" onClick={onPaymentHistory} className="inline-flex items-center gap-1">{strings.confirmedPaid[lang]} <ChevronRight size={16} /></button> : strings.confirmedPaid[lang]} v={money(paid)} strong />}
      <Row k={strings.balanceDue[lang]} v={<span className="text-[#ff7a30]">{money(remaining)}</span>} strong />
    </div>}
  </dl>
}

function PaymentHistory({ payments, lang }: { payments: PaymentRecord[]; lang: Lang }) {
  return (
    <ul className="divide-y divide-line">
      {payments.map((payment) => (
        <li key={payment.id} className="flex items-start justify-between gap-3 py-3">
          <div className="min-w-0">
            <p className="text-body font-medium">{payment.name[lang]}</p>
            <time className="mt-0.5 block text-caption text-ink-2" dateTime={payment.paidAt.toISOString()}>{formatSettlementTime(payment.paidAt)}</time>
            {payment.tip > 0 && <p className="mt-0.5 text-caption text-ink-2">{uiText(lang, 'tip_d8c94')} {money(payment.tip / 100)}</p>}
          </div>
          <span className="shrink-0 text-body font-semibold tabular-nums">{money(payment.amount)}</span>
        </li>
      ))}
    </ul>
  )
}
