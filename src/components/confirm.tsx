import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { strings, type L10n, type Lang } from '../data'
import type { CartLine } from '../cart'
import type { PriceQuote } from '../pricing'
import type { Mode } from './Welcome'
import { RoundGroup, calculateBill, countLabel, itemCount, type Round, type PaymentRecord } from './orders'
import { StoreCard } from './store'
import { ActionBar, Button, InlineAlert, OptionChip, Page, Row, Section, TableIdentity, TextButton, fieldClass, money, textareaClass } from './ui'
import { FeeRows, feeText } from './pricing'

export type Contact = { name: string; phone: string }

export function hasValidOrderContact(mode: Mode, contact: Contact) {
  return mode === 'dine' || /^\d{8}$/.test(contact.phone.replace(/[\s-]/g, ''))
}

export function ConfirmPage({
  lines,
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
  onSubmit,
}: {
  lines: CartLine[]
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
  onSubmit: () => void
}) {
  const t = (s: L10n) => s[lang]
  const [expanded, setExpanded] = useState(false)
  const valid = hasValidOrderContact(mode, contact)
  const combined = table && previousRounds.length ? calculateBill([...previousRounds, { id: 0, lines, mode, quote, time: '' }], payments) : null

  return (
    <Page
      title={isAddOn ? t(strings.confirmAddTitle) : t(strings.confirmTitle)}
      onBack={onBack}
      footer={
        <>
          {repriced && <InlineAlert tone="pending" title={t(feeText.reprice)} className="mb-2" />}
          <ActionBar
            label={t(combined ? strings.balanceDue : strings.total)}
            total={combined ? combined.remaining : quote.total / 100}
          >
            {table && <Button variant="secondary" onClick={onAddMore} className="flex-1">{lang === 'en' ? 'Add dishes' : '加菜'}</Button>}
            <Button onClick={onSubmit} disabled={!valid} className="flex-1">{prepay && (!isAddOn || tablePrepay) ? t(strings.pay) : t(strings.submitOrder)}</Button>
          </ActionBar>
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
          <TableIdentity table={table} mode="dine" guests={guests} lang={lang} />
        </Section>
      ) : !isAddOn ? (
        <>
        <Section title={lang === 'en' ? 'Dining option' : '用餐方式'}>
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

      <Section
        title={table ? (lang === 'en' ? 'Items' : '餐品詳情') : t(strings.yourItems)}
        trailing={<span className="text-caption text-ink-2 tabular-nums">{countLabel(itemCount(lines) + (table ? previousRounds.reduce((sum, round) => sum + itemCount(round.lines), 0) : 0), lang)}</span>}
      >
        <div className="space-y-5">
          {table && previousRounds.map((round, index) => (
            <RoundGroup
              key={round.id}
              index={index + 1}
              lines={round.lines}
              lang={lang}
              amounts={round.quote.rows}
              status="ordered"
            />
          ))}
          <div>
            <RoundGroup
              index={previousRounds.length + 1}
              lines={expanded ? lines : lines.slice(0, 3)}
              lang={lang}
              amounts={quote.rows}
              status={table && previousRounds.length ? 'pending' : undefined}
              showRound={!!table && previousRounds.length > 0}
            />
            {lines.length > 3 && <TextButton tone="muted" aria-expanded={expanded} onClick={() => setExpanded(!expanded)} className="mt-2 w-full justify-center gap-1">{expanded ? (lang === 'en' ? 'Show less' : '收起') : (lang === 'en' ? 'View more items' : '展開查看更多菜品')}{expanded ? <ChevronUp className="size-4" aria-hidden="true" /> : <ChevronDown className="size-4" aria-hidden="true" />}</TextButton>}
          </div>
        </div>
      </Section>
      <Section title={t(strings.receiptBreakdown)}>
        {combined && combined.paid > 0 ? (
          <>
            <FeeRows quote={combined.quote} tip={combined.tip} lang={lang} />
            <dl className="mt-3 space-y-2 border-t border-line pt-3">
              <Row k={t(feeText.estimate)} v={money(combined.total)} />
              <Row k={t(strings.confirmedPaid)} v={money(combined.paid)} />
              <Row k={t(strings.balanceDue)} v={money(combined.remaining)} strong />
            </dl>
          </>
        ) : (
          <FeeRows quote={combined?.quote ?? quote} tip={combined?.tip} lang={lang} totalLabel={t(feeText.estimate)} />
        )}
      </Section>
      {table && <Section title={lang === 'en' ? 'Order note' : '訂單備註'}><textarea value={orderNote} onChange={(e) => setOrderNote(e.target.value)} rows={2} placeholder={lang === 'en' ? 'Preferences or requests' : '口味、偏好等要求'} className={textareaClass} /></Section>}
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
    <label className={`${fieldClass} flex items-center gap-2 focus-within:ring-2 focus-within:ring-brand/10`}>
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
