import { uiText } from '../i18n'
import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { Check, CircleAlert, ChevronRight, CreditCard, Loader2, Nfc, QrCode, Smartphone, X } from 'lucide-react'
import { strings, type L10n, type Lang } from '../data'
import { useBackSwipe } from '../gestures'
import { useExitMotion } from '../exit-motion'
import type { PaymentRecord } from './orders'
import { feeText } from './pricing'
import { ActionBar, BottomSheet, Button, ChoiceRow, IconButton, InlineAlert, choiceBase, choiceState, disabledControlClass, money, Page, Row, Section, StatusPanel, TextButton } from './ui'

const L = (en: string, hk: string, zh: string): L10n => ({ en, hk, zh })

type Method = { id: string; icon: ReactNode; name: L10n }
const METHODS: Method[] = [
  { id: 'apple', icon: <Smartphone className="size-5" />, name: L('Apple Pay', 'Apple Pay', 'Apple Pay') },
  { id: 'card', icon: <CreditCard className="size-5" />, name: strings.card },
  { id: 'octopus', icon: <Nfc className="size-5" />, name: strings.octopus },
  { id: 'alipay', icon: <QrCode className="size-5" />, name: L('AlipayHK', 'AlipayHK', 'AlipayHK') },
  { id: 'wechat', icon: <QrCode className="size-5" />, name: L('WeChat Pay HK', '微信支付', '微信支付') },
]

type Result = 'success' | 'failed' | 'cancelled' | 'unknown'
export type TablePaymentResult =
  | { kind: 'success'; amount: number }
  | { kind: 'failed' | 'cancelled' | 'expired' }

type StoredAttempt = { id: string; cents: number; result?: Result; awaitingResult?: boolean }
type Attempt = { id: string; orderNo: number; cents: number; tip: number; method: Method }
type Stage =
  | { kind: 'review' }
  | { kind: 'redirect'; attempt: Attempt }
  | { kind: 'polling'; attempt: Attempt; result: Result }
  | { kind: 'pending'; attempt: Attempt }

function parseAmountCents(value: string) {
  if (!/^(?:\d+(?:\.\d{0,2})?|\.\d{1,2})$/.test(value)) return null
  const [whole, fraction = ''] = value.split('.')
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'))
  return Number.isSafeInteger(cents) ? cents : null
}

export function PaymentFlow({
  balance,
  tipsEnabled,
  orderNo,
  lang,
  onBack,
  onSuccess,
  gateway = false,
  direct = false,
  directSessionKey,
  persistentAttempt = false,
  onCheckingChange,
  onUnconfirmed,
  resultSheet,
  expiresAt, onExpired,
}: {
  balance: number
  tipsEnabled: boolean
  orderNo: number
  lang: Lang
  onBack: () => void
  onSuccess: (payment: PaymentRecord) => void
  gateway?: boolean
  direct?: boolean
  directSessionKey?: string
  persistentAttempt?: boolean
  onCheckingChange?: (checking: boolean) => void
  onUnconfirmed?: () => void
  resultSheet?: ReactNode
  expiresAt?: number | null
  onExpired?: () => void
}) {
  const t = (s: L10n) => s[lang]
  const [methodId, setMethodId] = useState('apple')
  const [stage, setStage] = useState<Stage>(() => {
    if (!direct) return { kind: 'review' }
    let stored: StoredAttempt | null = null
    if (directSessionKey) {
      try { stored = JSON.parse((persistentAttempt ? localStorage : sessionStorage).getItem(directSessionKey) || 'null') } catch { /* Start a new attempt if storage is unreadable. */ }
    }
    const cents = Math.round(balance * 100)
    if (stored?.cents !== cents) stored = null
    const attempt = {
      id: stored?.id ?? `table-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      orderNo,
      cents,
      tip: 0,
      method: { id: 'online', icon: <QrCode className="size-5" />, name: L('Online payment', '線上支付', '线上支付') },
    }
    if (stored?.result || stored?.awaitingResult) {
      return { kind: 'polling', attempt, result: stored.result === 'success' ? 'success' : 'unknown' }
    }
    return { kind: 'redirect', attempt }
  })
  const saveDirectAttempt = (attempt: Attempt, state: Pick<StoredAttempt, 'result' | 'awaitingResult'> = {}) => {
    if (directSessionKey) (persistentAttempt ? localStorage : sessionStorage).setItem(directSessionKey, JSON.stringify({ id: attempt.id, cents: attempt.cents, ...state }))
  }
  useEffect(() => {
    if (!resultSheet && direct && stage.kind === 'redirect') saveDirectAttempt(stage.attempt, { awaitingResult: true })
  }, [direct, directSessionKey, stage])

  useLayoutEffect(() => {
    if (direct) onCheckingChange?.(!resultSheet && stage.kind === 'polling')
  }, [direct, onCheckingChange, resultSheet, stage.kind])

  const successRef = useRef(onSuccess)
  successRef.current = onSuccess
  const unconfirmedRef = useRef(onUnconfirmed)
  unconfirmedRef.current = onUnconfirmed

  const completePayment = (attempt: Attempt) => successRef.current({
    id: attempt.id, orderNo: attempt.orderNo, methodId: attempt.method.id,
    name: attempt.method.name, amount: attempt.cents / 100, tip: attempt.tip, paidAt: new Date(),
  })

  const receiveResult = (attempt: Attempt, result: Result) => {
    if (direct) {
      // The table flow only receives a success notification from the gateway.
      result = result === 'success' ? 'success' : 'unknown'
      saveDirectAttempt(attempt, { result })
      if (result === 'success') { completePayment(attempt); return }
    }
    setStage({ kind: 'polling', attempt, result })
  }
  const [clock, setClock] = useState(Date.now())
  useEffect(() => { if (!expiresAt) return; const timer = setInterval(() => setClock(Date.now()), 1000); return () => clearInterval(timer) }, [expiresAt])
  useEffect(() => { if (expiresAt && clock >= expiresAt && !resultSheet && (stage.kind === 'redirect' || stage.kind === 'review')) onExpired?.() }, [clock, expiresAt, resultSheet, stage.kind])
  const [notice, setNotice] = useState<null | 'failed' | 'cancelled'>(null)
  const [picking, setPicking] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<string | null>(null)
  const [selectedTip, setSelectedTip] = useState(0)
  const paymentId = useId()
  const amountErrorId = useId()
  const attemptCount = useRef(0)

  const method = gateway ? { id: 'online', icon: <QrCode className="size-5" />, name: L('Online payment', '線上支付', '线上支付') } : METHODS.find((option) => option.id === methodId)!
  const polling = stage.kind === 'polling' || stage.kind === 'pending'
  const balanceCents = Math.round(balance * 100)
  const draftCents = balanceCents
  const error = draftCents === null || draftCents <= 0
    ? strings.amountInvalid
    : draftCents > balanceCents ? strings.amountOverBalance : null
  const amountCents = error ? null : draftCents
  const canTip = tipsEnabled && amountCents !== null
  const tip = canTip ? selectedTip : 0
  const charge = amountCents === null ? null : amountCents + tip

  useEffect(() => {
    if (resultSheet || stage.kind !== 'polling') return
    const { attempt, result } = stage
    const timer = setTimeout(() => {
      if (result === 'success') {
        completePayment(attempt)
      } else if (direct) {
        saveDirectAttempt(attempt)
        unconfirmedRef.current?.()
      } else if (result === 'unknown') {
        setStage({ kind: 'pending', attempt })
      } else {
        setNotice(result)
        setStage({ kind: 'review' })
      }
    }, direct && result === 'success' ? 0 : 1800)
    return () => clearTimeout(timer)
  }, [stage])

  if (resultSheet) return resultSheet

  if (stage.kind === 'redirect') {
    return (
      <ThirdPartyPage
        method={stage.attempt.method}
        amount={stage.attempt.cents / 100}
        expiresAt={expiresAt}
        showCancelPayment={direct}
        lang={lang}
        onReturn={(result) => receiveResult(stage.attempt, result)}
      />
    )
  }

  if (direct) return null

  return (
    <Page
      className="payment-design"
      title={t(strings.confirmPaymentTitle)}
      onBack={polling ? undefined : onBack}
      footer={
        <ActionBar label={t(strings.paymentAmount)} total={charge === null ? balance : charge / 100}><Button className="flex-1" disabled={polling || charge === null} aria-label={polling ? t(strings.paymentChecking) : undefined} onClick={() => {
          if (stage.kind !== 'review' || charge === null) return
          setNotice(null)
          setEditing(false)
          setStage({
            kind: 'redirect',
            attempt: { id: `${paymentId}-${Date.now()}-${++attemptCount.current}-${Math.random().toString(36).slice(2)}`, orderNo, cents: charge, tip, method },
          })
        }}>
          {polling ? t(strings.paymentCheckingShort) : charge === null ? t(strings.pay) : `${t(strings.pay)} ${money(charge / 100)}`}
        </Button></ActionBar>
      }
    >
      {notice && (
        <div className="px-5 pt-2">
          <InlineAlert tone={notice === 'failed' ? 'danger' : 'info'} title={notice === 'failed' ? t(strings.payFailed) : t(strings.payCancelled)} />
        </div>
      )}

      <Section>
        <dl>
          <div>
            <dt className="text-callout font-semibold text-ink-2">{t(strings.paymentAmount)}</dt>
            <dd className="mt-1 flex items-center gap-2">
              {editing ? (
                <label className={`flex min-w-0 flex-1 items-center gap-1.5 border-b py-1.5 ${error ? 'border-danger' : 'border-line focus-within:border-action'}`}>
                  <span className="text-title font-semibold" aria-hidden="true">$</span>
                  <input
                    aria-label={t(strings.paymentAmount)}
                    aria-invalid={!!error}
                    aria-describedby={error ? amountErrorId : undefined}
                    autoFocus
                    inputMode="decimal"
                    value={draft ?? String(balance)}
                    onFocus={(event) => event.currentTarget.select()}
                    onChange={(event) => {
                      setDraft(event.currentTarget.value)
                    }}
                    className="w-full min-w-0 bg-transparent text-title font-semibold tabular-nums outline-none"
                  />
                </label>
              ) : <span className="min-w-0 flex-1 text-display font-semibold tabular-nums">{amountCents === null ? '—' : money(amountCents / 100)}</span>}
            </dd>
            {error && <dd id={amountErrorId} className="mt-2 text-callout text-danger">{t(error)}</dd>}
          </div>
          <div className="section-divider space-y-2">
            <Row k={t(strings.balanceDue)} v={money(balance)} />
            <Row k={t(strings.balanceAfterPayment)} v={amountCents === null ? '—' : money((balanceCents - amountCents) / 100)} />
          </div>
        </dl>
        {canTip && (
          <fieldset disabled={polling} className="mt-4">
            <legend className="mb-2 text-callout font-semibold text-ink-2">{t(feeText.addTip)}</legend>
            <div className="flex flex-wrap gap-2">
              {[0, 500, 1000, 2000].map((value) => (
                <button type="button" key={value} aria-pressed={selectedTip === value} onClick={() => setSelectedTip(value)} className={`min-h-11 rounded-md px-4 text-body ${choiceBase} ${choiceState(selectedTip === value)}`}>
                  {value ? `+${money(value / 100)}` : t(feeText.noTip)}
                </button>
              ))}
            </div>
            {tip > 0 && <dl className="mt-3 space-y-2">
              <Row k={t(strings.tip)} v={money(tip / 100)} />
              <Row k={t(feeText.payTotal)} v={money(charge! / 100)} strong />
            </dl>}
          </fieldset>
        )}
      </Section>

      {polling && <Section><StatusPanel tone="info" icon={<Loader2 className="size-5 animate-spin text-info" aria-hidden="true" />} title={t(strings.confirmingPayment)} description={t(strings.paymentLockHint)} /></Section>}

      {stage.kind === 'pending' && <Section><p className="text-callout text-ink-2">{uiText(lang, 'the_payment_result_is_still_being_conf_2f3d9')}</p><div className="mt-3 flex flex-wrap gap-3"><TextButton tone="brand" underline onClick={() => setStage({ kind: 'polling', attempt: stage.attempt, result: 'unknown' })}>{uiText(lang, 'check_again_7fc92')}</TextButton><TextButton tone="brand" underline onClick={() => setStage({ kind: 'polling', attempt: stage.attempt, result: 'success' })}>{uiText(lang, 'simulate_confirmed_payment_3cfb9')}</TextButton><TextButton tone="muted" underline onClick={() => setStage({ kind: 'polling', attempt: stage.attempt, result: 'failed' })}>{uiText(lang, 'simulate_failure_2ff4f')}</TextButton></div></Section>}
      <Section title={t(strings.payMethod)}>
        {gateway ? <p className="text-body text-ink-2">{uiText(lang, 'complete_payment_through_the_gateway_8641e')}</p> : <button
          disabled={polling}
          onClick={() => setPicking(true)}
          className={`group flex w-full items-center gap-3 rounded-lg border border-line p-3 text-left transition active:bg-tile ${disabledControlClass}`}
        >
          <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-tile text-ink group-disabled:bg-white/50 group-disabled:text-disabled-ink">{method.icon}</span>
          <span className="min-w-0 flex-1 text-body font-medium">{t(method.name)}</span>
          <span className="flex items-center text-callout text-action group-disabled:text-disabled-ink">
            {t(strings.change)}
            <ChevronRight className="size-4" />
          </span>
        </button>}
      </Section>

      {picking && (
        <BottomSheet title={t(strings.payMethod)} onClose={() => setPicking(false)}>
          <div className="space-y-2">
            {METHODS.map((m) => (
              <ChoiceRow
                key={m.id}
                active={m.id === methodId}
                leading={m.icon}
                onClick={() => {
                  setMethodId(m.id)
                  setPicking(false)
                }}
              >
                {t(m.name)}
              </ChoiceRow>
            ))}
          </div>
        </BottomSheet>
      )}

    </Page>
  )
}

export function PaymentResultSheet({ result, lang, orderNo, onClose, onRetry, cancelledOrder = false }: {
  result: TablePaymentResult
  lang: Lang
  orderNo: number
  onClose?: () => void
  onRetry?: () => void
  cancelledOrder?: boolean
}) {
  const t = (s: L10n) => s[lang]
  const success = result.kind === 'success'
  const failed = result.kind === 'failed'
  const title = result.kind === 'expired' ? t(L('Payment expired', '支付已超時', '支付已超时'))
    : success ? t(L('Payment successful', '付款成功', '付款成功'))
    : failed ? t(L('Payment failed', '付款失敗', '付款失败')) : t(strings.payCancelled)
  const icon = success ? <Check className="size-5" aria-hidden="true" />
    : failed ? <CircleAlert className="size-5" aria-hidden="true" /> : <X className="size-5" aria-hidden="true" />
  return (
    <BottomSheet
      title={<span role="status" className="flex items-center gap-3">{icon}{title}</span>}
      onClose={onClose}
      footer={onClose && <Button autoFocus className="w-full" onClick={onRetry ?? onClose}>
        {result.kind === 'expired' || cancelledOrder ? t(L('Order again', '重新點餐', '重新点餐')) : onRetry ? t(L('Retry payment', '重新支付', '重新支付')) : t(strings.finish)}
      </Button>}
    >
      {success ? (
        <dl className="space-y-3 py-2">
          <Row k={t(L('Order number', '訂單號', '订单号'))} v={`#${orderNo}`} />
          <Row strong k={t(L('Paid this time', '本次付款', '本次付款'))} v={money(result.amount)} />
        </dl>
      ) : cancelledOrder ? (
        <p className="py-2 text-callout text-ink-2">{t(L('Payment and the pending order were cancelled. Please order again.', '付款及待支付訂單已取消，請重新點餐。', '付款及待支付订单已取消，请重新点餐。'))}</p>
      ) : result.kind === 'expired' ? (
        <p className="py-2 text-callout text-ink-2">{t(L('Payment expired. Your order was cancelled; please order again.', '支付已超時，訂單已取消，請重新下單。', '支付已超时，订单已取消，请重新下单。'))}</p>
      ) : (
        <p className="py-2 text-callout text-ink-2">
          {t(L('Your selections are saved.', '已保留本次點餐內容。', '已保留本次点餐内容。'))}
        </p>
      )}
    </BottomSheet>
  )
}

/** Simulated external payment app/page — deliberately styled apart from the H5. */
function ThirdPartyPage({
  method,
  amount,
  expiresAt,
  showCancelPayment,
  lang,
  onReturn,
}: {
  method: Method
  amount: number
  expiresAt?: number | null
  showCancelPayment: boolean
  lang: Lang
  onReturn: (result: Result) => void
}) {
  const t = (s: L10n) => s[lang]
  const returnResult = useRef<Result | null>(null)
  const { panel, dismiss } = useExitMotion(() => onReturn(returnResult.current ?? 'cancelled'), 'right')
  const returnToOrder = (result: Result) => {
    if (!showCancelPayment) { onReturn(result); return }
    returnResult.current ??= result
    dismiss()
  }
  const swipe = useBackSwipe(() => returnToOrder('cancelled'))
  const paymentTime = usePaymentCountdown(expiresAt)
  return (
    <div {...swipe} ref={panel} className={`${showCancelPayment ? 'animate-slide' : 'animate-sheet'} absolute inset-0 z-[52] flex touch-pan-y flex-col bg-tile`}>
      <header className="flex items-center justify-between px-5 pt-12 pb-3">
        <IconButton variant="plain" label={t(strings.providerCancel)} onClick={() => returnToOrder('cancelled')}>
          <X className="size-5" />
        </IconButton>
        <span className="text-body font-semibold">{t(strings.providerDemo)}</span>
        <span className="size-10" />
      </header>
      <div className="flex flex-1 flex-col items-center px-5 pt-16 text-center">
        <span className="flex size-16 items-center justify-center rounded-lg bg-ink text-white">{method.icon}</span>
        <p className="mt-6 text-callout text-ink-2">{t(strings.restaurant)} · {t(method.name)}</p>
        <p className="mt-2 text-display font-semibold tabular-nums">{money(amount)}</p>
        {paymentTime && <div className="mt-3"><PaymentCountdown time={paymentTime} lang={lang} /></div>}
      </div>
      <div className="space-y-3 px-5 pb-8">
        <div className="flex gap-3">
          {showCancelPayment && (
            <Button variant="secondary" onClick={() => returnToOrder('cancelled')} className="min-w-0 flex-1 border border-line bg-white px-3! max-[359px]:px-2! max-[359px]:text-callout">
              {uiText(lang, 'cancel_payment_2f54b')}
            </Button>
          )}
          <Button variant="dark" onClick={() => onReturn('success')} className="min-w-0 flex-1 px-3! max-[359px]:px-2! max-[359px]:text-callout">
            {t(strings.providerSuccess)}
          </Button>
        </div>
        <TextButton tone="muted" underline className="w-full py-2 underline-offset-4" onClick={() => returnToOrder('unknown')}>{uiText(lang, 'return_without_a_result_7a3a9')}</TextButton>
        <TextButton tone="muted" underline className="w-full py-2 underline-offset-4" onClick={() => returnToOrder('failed')}>
          {t(strings.simulateFail)}
        </TextButton>
      </div>
    </div>
  )
}

export function usePaymentCountdown(expiresAt?: number | null) {
  const [now, setNow] = useState(Date.now)
  useLayoutEffect(() => {
    if (!expiresAt) return
    const tick = () => setNow(Date.now())
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [expiresAt])
  if (!expiresAt) return null
  const seconds = Math.max(0, Math.ceil((expiresAt - now) / 1000))
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
}

export function PaymentCountdown({ time, lang, variant = 'card' }: { time: string; lang: Lang; variant?: 'card' | 'status-row' }) {
  const statusRow = variant === 'status-row'
  return (
    <p className={`payment-countdown flex items-center font-medium text-ink ${statusRow ? 'min-h-12 gap-2 bg-white text-headline' : 'min-h-11 gap-1.5 rounded-md border border-action/20 bg-brand-soft px-3 py-2 text-callout'}`}>
      <span className="flex min-w-0 items-center gap-2">
        <PaymentHourglass className={statusRow ? 'size-6' : 'size-5'} />
        {uiText(lang, statusRow ? 'awaiting_payment_99cbe' : 'payment_time_remaining')}
      </span>
      <strong className={`shrink-0 text-action tabular-nums ${statusRow ? 'text-2xl font-bold' : 'text-headline font-semibold'}`}>{time}</strong>
    </p>
  )
}

function PaymentHourglass({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`shrink-0 text-action ${className}`} aria-hidden="true" fill="none">
      <g className="payment-hourglass-body">
        <path className="payment-hourglass-top" fill="currentColor" d="M8.8 5.3h6.4v1.1c0 1.6-1.1 2.8-3.2 4.2C9.9 9.2 8.8 8 8.8 6.4V5.3Z" />
        <path className="payment-hourglass-bottom" fill="currentColor" d="M15.2 18.7H8.8v-1.1c0-1.6 1.1-2.8 3.2-4.2 2.1 1.4 3.2 2.6 3.2 4.2v1.1Z" />
        <path className="payment-hourglass-stream" d="M12 10.9v3.4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <path
          className="stroke-ink-2"
          d="M6 3h12M6 21h12M7 3v2.6c0 2.5 1.4 4 3.7 5.4l1.3 1-1.3 1C8.4 14.4 7 16 7 18.4V21M17 3v2.6c0 2.5-1.4 4-3.7 5.4L12 12l1.3 1c2.3 1.4 3.7 3 3.7 5.4V21"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  )
}
