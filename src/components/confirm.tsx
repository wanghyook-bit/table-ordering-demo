import { uiText } from '../i18n'
import { useState } from 'react'
import { ChevronDown, ChevronRight, ChevronUp } from 'lucide-react'
import { strings, type L10n, type Lang } from '../data'
import type { CartLine } from '../cart'
import type { PriceQuote } from '../pricing'
import type { Mode } from './Welcome'
import { ItemList, OrderAmounts, calculateBill, countLabel, itemCount, type Round, type PaymentRecord } from './orders'
import { StoreCard } from './store'
import { Button, InlineAlert, OptionChip, Page, Row, Section, TextButton, fieldClass, money, textareaClass } from './ui'
import { FeeRows, feeText } from './pricing'
import { PaymentCountdown, usePaymentCountdown } from './pay'

export type Contact = { name: string; phone: string }

export function hasValidOrderContact(mode: Mode, contact: Contact) {
  return mode === 'dine' || /^\d{8}$/.test(contact.phone.replace(/[\s-]/g, ''))
}

export function ConfirmPage({
  lines,
  expiresAt,
  checkingPayment = false,
  onRequestCancelPayment,
  quote,
  repriced,
  mode,
  lang,
  isAddOn,
  previousRounds = [], payments = [],
  contact,
  table,
  setContact,
  setMode,
  prepay,
  guests,
  setGuests,
  tablePrepay, onAddMore, orderNote, setOrderNote,
  onBack,
  onSwitchTable,
  onSubmit,
}: {
  lines: CartLine[]
  expiresAt?: number | null
  checkingPayment?: boolean
  onRequestCancelPayment?: () => void
  quote: PriceQuote
  repriced: boolean
  mode: Mode
  lang: Lang
  isAddOn: boolean
  previousRounds?: Round[]
  payments?: PaymentRecord[]
  contact: Contact
  table: string | null
  setContact: (c: Contact) => void
  setMode: (m: Mode) => void
  prepay: boolean
  guests: number
  setGuests: (n: number) => void
  tablePrepay: boolean
  onAddMore: () => void
  orderNote: string
  setOrderNote: (s: string) => void
  onBack: () => void
  onSwitchTable: () => void
  onSubmit: () => void
}) {
  const t = (s: L10n) => s[lang]
  const [expanded, setExpanded] = useState(false)
  const [noteOpen, setNoteOpen] = useState(false)
  const paymentTime = usePaymentCountdown(expiresAt)
  const valid = hasValidOrderContact(mode, contact)
  const combined = table && previousRounds.length ? calculateBill([...previousRounds, { id: 0, lines, mode, quote, time: '' }], payments) : null

  return (
    <Page
      className="confirm-design"
      title={t(strings.confirmTitle)}
      onBack={onBack}
      backDisabled={checkingPayment}
      animateBack={!expiresAt}
      footer={
        <>
          {repriced && <InlineAlert tone="pending" title={t(feeText.reprice)} className="mb-2" />}
          <div className="confirm-actions">
            {expiresAt ? <Button variant="secondary" onClick={onRequestCancelPayment} disabled={checkingPayment} className="flex-1 cancel-payment">{uiText(lang, 'cancel_payment_2f54b')}</Button> : table && <Button variant="secondary" onClick={onAddMore} disabled={checkingPayment} className="flex-1">{uiText(lang, 'add_dishes_c537b')}</Button>}
            <Button onClick={onSubmit} disabled={!valid || checkingPayment} aria-label={checkingPayment ? t(strings.paymentChecking) : undefined} className="flex-1">
              {checkingPayment ? t(strings.paymentCheckingShort) : paymentTime ? (
                <>
                  {uiText(lang, 'pay_550a8')}
                  <span className="font-semibold tabular-nums" aria-hidden="true">{paymentTime}</span>
                </>
              ) : prepay && (!isAddOn || tablePrepay) ? t(strings.pay) : t(strings.submitOrder)}
            </Button>
          </div>
        </>
      }
    >
      {mode === 'takeaway' && (
        <Section>
          <StoreCard lang={lang} showDistance />
        </Section>
      )}

      {table ? (
        <Section>
          <div className="confirm-table"><div className="confirm-table-name"><span className="confirm-table-icon"><img src={`${import.meta.env.BASE_URL}confirm-assets/table.svg`} alt="" /></span><strong>{table}</strong></div><Button size="md" onClick={onSwitchTable} disabled={checkingPayment}>{uiText(lang, 'switch_table_7b2a0')}</Button></div>
        </Section>
      ) : !isAddOn ? (
        <>
        <Section title={uiText(lang, 'dining_option_b5bd3')}>
          <div className="flex gap-2">{(['dine','takeaway'] as const).map((option) => <OptionChip key={option} active={mode === option} onClick={() => setMode(option)} className="flex-1">{t(option === 'dine' ? strings.dineIn : strings.takeaway)}</OptionChip>)}</div>
        </Section>
        {mode === 'takeaway' && (
        <Section title={t(strings.contact)}>
          <div className="space-y-2">
            <Field value={contact.name} onChange={(v) => setContact({ ...contact, name: v })} placeholder={t(strings.namePh)} />
            <Field
              value={contact.phone}
              onChange={(v) => setContact({ ...contact, phone: v })}
              placeholder={t(strings.phonePh)}
              prefix="+852"
              inputMode="tel"
            />
          </div>
        </Section>)}
        </>
      ) : null}

      {paymentTime && <div className="px-gutter pt-stack"><PaymentCountdown time={paymentTime} lang={lang} variant="status-row" /></div>}
      <Section
        title={table ? (uiText(lang, 'items_2f38f')) : t(strings.yourItems)}
        trailing={<span className="text-caption text-ink-2 tabular-nums">{countLabel(itemCount(lines) + (table ? previousRounds.reduce((sum, round) => sum + itemCount(round.lines), 0) : 0), lang)}</span>}
      >
        <div className="confirm-item-groups">
          {table && previousRounds.map((round) => (
            <ItemList key={round.id} lines={round.lines} lang={lang} amounts={round.quote.rows} status="ordered" />
          ))}
          <div>
            <ItemList lines={expanded ? lines : lines.slice(0, 3)} lang={lang} amounts={quote.rows} status={table && previousRounds.length ? 'pending' : undefined} />
            {lines.length > 3 && <TextButton tone="muted" aria-expanded={expanded} onClick={() => setExpanded(!expanded)} className="mt-2 w-full justify-center gap-1">{expanded ? (uiText(lang, 'show_less_aff96')) : (uiText(lang, 'view_more_items_7fd3a'))}{expanded ? <ChevronUp className="size-4" aria-hidden="true" /> : <ChevronDown className="size-4" aria-hidden="true" />}</TextButton>}
          </div>
        </div>
      </Section>
      <Section title={uiText(lang, 'amount_details_25bdd')}>
        <OrderAmounts quote={combined?.quote ?? quote} tip={combined?.tip} total={combined?.total ?? quote.total / 100} paid={combined && combined.paid > 0 ? combined.paid : undefined} remaining={combined?.remaining ?? quote.total / 100} lang={lang} />
      </Section>
      {table && <Section><button type="button" className="confirm-note-toggle" onClick={() => setNoteOpen(!noteOpen)} aria-expanded={noteOpen}><strong>{uiText(lang, 'note_fc405')}</strong><span>{orderNote || (uiText(lang, 'preferences_or_requests_f292b'))} {noteOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</span></button>{noteOpen && <textarea value={orderNote} onChange={(e) => setOrderNote(e.target.value)} rows={2} placeholder={uiText(lang, 'preferences_or_requests_f292b')} className={`${textareaClass} mt-2`} />}</Section>}
    </Page>
  )
}

function Field({
  value,
  onChange,
  placeholder,
  prefix,
  inputMode,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  prefix?: string
  inputMode?: 'tel'
}) {
  return (
    <label className={`${fieldClass} flex items-center gap-2`}>
      {prefix && <span className="border-r border-line pr-2 text-body text-ink-2">{prefix}</span>}
      <input
        value={value}
        inputMode={inputMode}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-body outline-none placeholder:text-muted"
      />
    </label>
  )
}
