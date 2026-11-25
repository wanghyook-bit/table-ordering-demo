import { uiText } from '../i18n'
import { useState, type ReactNode } from 'react'
import { Check, CupSoda, Search, ShoppingBag } from 'lucide-react'
import { dishHints, dishes, dishOptions, dishTags, strings, type Dish, type L10n, type Lang, type OptionGroup } from '../data'
import { useBackSwipe } from '../gestures'
import { isCustomizable, optsLabel, unitPrice, type CartLine } from '../cart'
import { AddButton, BackButton, Button, DishImage, Empty, OptionChip, Price, Stepper, Tag, TextButton, Thumb, textareaClass } from './ui'

const MAX_DISH_NOTE = 200
const QUICK_NOTES: L10n[] = [
  { en: 'Not spicy', hk: '不辣', zh: '不辣' },
  { en: 'Mild', hk: '微辣', zh: '微辣' },
  { en: 'Medium', hk: '中辣', zh: '中辣' },
  { en: 'Hot', hk: '特辣', zh: '特辣' },
  { en: 'No spring onion', hk: '走蔥', zh: '走葱' },
  { en: 'Less oil', hk: '少油', zh: '少油' },
  { en: 'Sauce on the side', hk: '醬料分開', zh: '酱料分开' },
]

const dishTagIcons: Record<keyof typeof dishTags, string> = {
  signature: '1F95F',
  sharing: '1F372',
  popular: '1F35C',
  seasonal: '1F96C',
}

function DishTag({ kind, lang, compact = false }: { kind: keyof typeof dishTags; lang: Lang; compact?: boolean }) {
  return (
    <span className={`inline-flex max-w-full items-center gap-1 rounded-full border border-white/80 bg-cream text-caption font-semibold text-cocoa shadow-soft ${compact ? 'min-h-5 px-1.5' : 'min-h-6 px-2'}`}>
      <img src={`${import.meta.env.BASE_URL}dish-icons/${dishTagIcons[kind]}.svg`} alt="" className={compact ? 'size-3.5 shrink-0' : 'size-4 shrink-0'} />
      {dishTags[kind][lang]}
    </span>
  )
}

export function DishCard({
  dish,
  lang,
  qty,
  ordered,
  onOpen,
  onAdd,
}: {
  dish: Dish
  lang: Lang
  qty: number
  ordered: number
  onOpen: () => void
  onAdd: () => void
}) {
  return (
    // h-full + mt-auto footer: cards in a row share height, long names grow the card instead of clipping
    <article className={`flex h-full min-w-0 flex-col overflow-hidden rounded-lg border border-line bg-white shadow-soft ${dish.soldOut ? 'opacity-60' : ''}`}>
      <button onClick={onOpen} className="relative block overflow-hidden">
        <DishImage src={dish.image} alt={dish.name[lang]} className="aspect-[4/3] w-full transition duration-500 hover:scale-105" />
        <span className="absolute inset-x-2 top-2 flex items-start justify-between gap-1">
          {ordered > 0 ? (
            <Tag tone="success">
              <Check className="size-3" strokeWidth={3} />
              {strings.ordered[lang]} {ordered}
            </Tag>
          ) : (
            <span />
          )}
          {dish.tag && !dish.soldOut && <DishTag kind={dish.tag} lang={lang} />}
        </span>
        {dish.soldOut && (
          <span className="absolute inset-0 flex items-center justify-center bg-white/40">
            <Tag tone="overlay">{strings.soldOut[lang]}</Tag>
          </span>
        )}
      </button>
      <button onClick={onOpen} className="mt-3 flex min-h-10 items-start px-3 text-left">
        <h3 className="break-words text-body font-semibold">{dish.name[lang]}</h3>
      </button>
      <div className="mt-auto flex min-h-12 items-center gap-0.5 px-3 pb-2">
        <p className="flex min-w-0 flex-1 items-baseline gap-0.5 text-headline font-semibold whitespace-nowrap">
          <Price value={dish.price} className="shrink-0" />
          {(dish.unit.en === 'basket' || dish.unit.en === '2 pcs') && <span className="truncate text-caption font-normal text-ink-2">/{dish.unit[lang]}</span>}
        </p>
        {!dish.soldOut && <DishAddButton dish={dish} lang={lang} qty={qty} onClick={onAdd} />}
      </div>
    </article>
  )
}

function DishAddButton({ dish, lang, qty, onClick }: { dish: Dish; lang: Lang; qty: number; onClick: () => void }) {
  const action = isCustomizable(dish) ? strings.customize : strings.add
  if (isCustomizable(dish)) return (
    <button type="button" onClick={onClick} aria-label={`${action[lang]} · ${dish.name[lang]}${qty > 0 ? ` · ${strings.inCart[lang]} ×${qty}` : ''}`} className="group relative flex h-11 shrink-0 items-center justify-end rounded-full">
      {qty > 0 && <span className="-mr-2 flex h-7 items-center rounded-l-full bg-brand-soft pr-2.5 pl-2 text-caption font-semibold text-brand-strong tabular-nums">×{qty}</span>}
      <span className="relative flex h-8 items-center justify-center rounded-full bg-brand px-3 text-caption font-semibold whitespace-nowrap text-white transition group-active:scale-95 group-active:bg-brand-strong">
        {lang === 'en' ? 'Options' : lang === 'zh' ? '选规格' : '選規格'}
      </span>
    </button>
  )
  return <AddButton onClick={onClick} label={`${action[lang]}${qty > 0 ? ` · ${strings.inCart[lang]} ×${qty}` : ''}`} qty={qty} />
}

/** Full-screen dish page: photo, options and product-specific requests. */
export function DishPage({
  dish,
  lang,
  ordered,
  onClose,
  onAdd,
}: {
  dish: Dish
  lang: Lang
  ordered: number
  onClose: () => void
  onAdd: (opts: string[], note: string, qty: number) => void
}) {
  const groups = dishOptions[dish.id] ?? []
  const [sel, setSel] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(groups.map((g) => [g.id, g.type === 'single' ? [g.options[0].id] : []])),
  )
  const swipe = useBackSwipe(onClose)
  const [note, setNote] = useState('')
  const [n, setN] = useState(1)
  const opts = Object.values(sel).flat()
  const price = unitPrice(dish, opts)
  const t = (s: L10n) => s[lang]
  const noteTokens = note.split(/[，,\s]+/).filter(Boolean)
  const appropriateNotes = dish.category === 'sets' ? [] : dish.category === 'sweets' ? [] : QUICK_NOTES
  const quickNotes = appropriateNotes.filter((quick) => !groups.some((group) => group.options.some((option) => t(option.name) === t(quick))))
  const toggleQuickNote = (label: string) => setNote((current) => {
    const tokens = current.split(/[，,\s]+/).filter(Boolean)
    if (tokens.includes(label)) return tokens.filter((token) => token !== label).join('，')
    return [...tokens, label].join('，').slice(0, MAX_DISH_NOTE)
  })

  const toggle = (g: OptionGroup, id: string) =>
    setSel((s) => {
      if (g.type === 'single') return { ...s, [g.id]: [id] }
      const cur = s[g.id] ?? []
      return { ...s, [g.id]: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id] }
    })

  return (
    <div {...swipe} className="animate-slide absolute inset-0 z-50 flex touch-pan-y flex-col bg-white">
      {/* Pinned top-left, outside the scroll area, so it never covers content */}
      <BackButton onImage onClick={onClose} className="absolute top-2 left-3 z-10 sm:pointer-fine:top-11" />
      <div className="no-scrollbar flex-1 overflow-y-auto pb-6">
        <div className="bg-tile">
          <DishImage src={dish.image} alt={dish.name[lang]} className="aspect-[16/10] w-full" />
        </div>
        <div className="border-b border-line px-5 pt-5 pb-4">
          {(dish.tag || ordered > 0) && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {ordered > 0 && <Tag tone="success" compact>{t(strings.ordered)} {ordered}</Tag>}
              {dish.tag && <DishTag kind={dish.tag} lang={lang} compact />}
            </div>
          )}
          <h1 className="text-title leading-tight font-semibold">{dish.name[lang]}</h1>
          <p className="mt-1.5 text-callout text-ink-2">{dish.desc[lang]}</p>
        </div>

        <div className="space-y-3 bg-white px-5 pt-3">
          <div className="flex min-h-11 items-center justify-between gap-3">
            <h2 className="text-body font-semibold text-ink">{t(strings.quantity)}</h2>
            {dish.soldOut ? <span className="text-callout text-muted">{t(strings.soldOut)}</span> : (
              <Stepper min={1} qty={n} onMinus={() => setN((v) => v - 1)} onPlus={() => setN((v) => v + 1)} />
            )}
          </div>
          {groups.map((g) => (
            <section key={g.id}>
              <h2 className="mb-2 flex flex-wrap items-baseline gap-x-2 text-body font-semibold text-ink">{t(g.name)} <span className="text-caption font-normal text-ink-2">{g.type === 'single' ? (uiText(lang, 'required_choose_one_967f7')) : (uiText(lang, 'optional_1eb0b'))}</span></h2>
              <div className="flex flex-wrap gap-2">
                {g.options.map((o, index) => {
                  const on = !!sel[g.id]?.includes(o.id)
                  return (
                    <OptionChip key={o.id} active={on} onClick={() => toggle(g, o.id)}>
                      {g.size && <CupSoda aria-hidden="true" size={14 + index * 3} className="shrink-0" />}
                      {t(o.name)}
                      {o.price ? <span className={on ? '' : 'text-muted'}>+${o.price}</span> : null}
                    </OptionChip>
                  )
                })}
              </div>
            </section>
          ))}
          <section>
            <div className="mb-2 flex items-center justify-between gap-3">
              <h2 className="text-body font-semibold text-ink">{t(strings.specialRequest)}</h2>
              {note.length > 0 && <span className="text-caption text-ink-2 tabular-nums">{note.length} / {MAX_DISH_NOTE}</span>}
            </div>
            <textarea
              rows={2}
              value={note}
              maxLength={MAX_DISH_NOTE}
              onChange={(event) => setNote(event.target.value)}
              placeholder={dishHints[dish.id] ? t(dishHints[dish.id]) : ''}
              aria-label={t(strings.specialRequest)}
              className={textareaClass}
            />
            {quickNotes.length > 0 && <div className="mt-3 flex flex-wrap gap-2">
              {quickNotes.map((quick) => {
                const label = t(quick)
                return <OptionChip key={quick.en} active={noteTokens.includes(label)} onClick={() => toggleQuickNote(label)}>{label}</OptionChip>
              })}
            </div>}
          </section>
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-3 border-t border-line bg-white px-5 pt-3 pb-[max(28px,env(safe-area-inset-bottom))]">
        <div className="min-w-16 shrink-0">
          <span className="block text-caption text-ink-2">{strings.subtotal[lang]}</span>
          <Price value={price * n} className="block text-title font-semibold" />
        </div>
        <Button disabled={dish.soldOut} onClick={() => onAdd(opts, note, n)} className="min-w-max flex-1 disabled:opacity-50 max-[359px]:basis-full">
          {dish.soldOut ? t(strings.soldOut) : t(strings.add)}
        </Button>
      </div>
    </div>
  )
}

export function SearchOverlay({
  lang,
  qtyOf,
  orderedOf,
  onClose,
  onOpen,
  onAdd,
}: {
  lang: Lang
  qtyOf: (id: string) => number
  orderedOf: (id: string) => number
  onClose: () => void
  onOpen: (d: Dish) => void
  onAdd: (d: Dish) => void
}) {
  const [q, setQ] = useState('')
  const swipe = useBackSwipe(onClose)
  const s = q.trim().toLowerCase()
  // Match across all three languages so a guest can type in any script.
  const results = dishes.filter(
    (d) => !s || [d.name.en.toLowerCase(), d.name.hk, d.name.zh, d.desc.en.toLowerCase()].some((v) => v.includes(s)),
  )
  return (
    <div {...swipe} className="animate-fade absolute inset-0 z-50 flex touch-pan-y flex-col bg-white">
      <div className="relative z-10 flex items-center gap-3 border-b border-line bg-white px-5 pt-3 pb-3 shadow-divider sm:pointer-fine:pt-14">
        <label className="flex h-11 flex-1 items-center gap-2 rounded-md bg-tile px-4">
          <Search className="size-4.5 shrink-0 text-muted" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={strings.findDish[lang]}
            className="min-w-0 flex-1 bg-transparent text-body outline-none placeholder:text-muted"
          />
        </label>
        <TextButton tone="brand" size="body" weight="medium" className="min-w-11 shrink-0" onClick={onClose}>
          {strings.cancel[lang]}
        </TextButton>
      </div>
      <div className="no-scrollbar flex-1 overflow-y-auto px-5 pb-8">
        {results.length === 0 ? (
          <Empty title={strings.noResults[lang]} />
        ) : (
          <ul className="divide-y divide-line">
            {results.map((d) => {
              const qty = qtyOf(d.id)
              const ordered = orderedOf(d.id)
              return (
                <li key={d.id} className={`flex items-center gap-3 py-3 ${d.soldOut ? 'opacity-60' : ''}`}>
                  <button onClick={() => onOpen(d)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                    <Thumb src={d.image} />
                    <span className="min-w-0">
                      <span className="block text-body font-medium">{d.name[lang]}</span>
                      <span className="mt-1 flex items-center gap-2">
                        <Price value={d.price} className="text-body font-semibold" />
                        {ordered > 0 && (
                          <Tag tone="success">
                            {strings.ordered[lang]} {ordered}
                          </Tag>
                        )}
                      </span>
                    </span>
                  </button>
                  {d.soldOut ? (
                    <Tag>{strings.soldOut[lang]}</Tag>
                  ) : (
                    <DishAddButton dish={d} lang={lang} qty={qty} onClick={() => onAdd(d)} />
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

/** Flat list row for a cart line (thumb · name · options · price · trailing control). */
export function CartRow({ line, lang, amount, children }: { line: CartLine; lang: Lang; amount: number; children?: ReactNode }) {
  const label = optsLabel(line.opts, line.note, lang)
  return <li className="cart-item">
    <DishImage src={line.dish.image} alt={line.dish.name[lang]} className="confirm-item-image" />
    <div className="cart-item-info">
      <p className="cart-item-name">{line.dish.name[lang]}</p>
      {label && <p className="confirm-options">{label}</p>}
      <div className="cart-item-bottom"><Price value={amount / 100} className="cart-item-price" />{children}</div>
    </div>
  </li>
}

/** Floating cart bar: count + total + solid brand checkout button. */
export function CartBar({ count, total, lang, bump, onOpen }: { count: number; total: number; lang: Lang; bump: number; onOpen: () => void }) {
  return (
    <div className="animate-pop absolute inset-x-5 bottom-[max(20px,env(safe-area-inset-bottom))] z-30">
      <div className="glass-bar flex items-center gap-3 rounded-full border border-white/75 p-2 text-ink shadow-float">
        <button onClick={onOpen} className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <span key={bump} className="animate-pop relative flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-soft text-ink">
            <ShoppingBag className="size-5" />
            <span className="absolute -top-1 -right-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-brand px-1 text-caption font-semibold text-white tabular-nums ring-2 ring-white">
              {count}
            </span>
          </span>
          <span className="min-w-0">
            <span className="sr-only">{uiText(lang, 'total_7f9d9')}</span>
            <Price value={total} className="block truncate text-headline font-semibold" />
          </span>
        </button>
        <Button size="md" onClick={onOpen} className="px-6">
          {strings.review[lang]}
        </Button>
      </div>
    </div>
  )
}
