import { uiText } from '../i18n'
import { useState, type ReactNode } from 'react'
import { ChevronDown, ChevronRight, CupSoda, Pencil, Search, ShoppingBag } from 'lucide-react'
import { dishHints, dishes, dishOptions, dishTags, optionTree, strings, type Dish, type L10n, type Lang, type OptionGroup } from '../data'
import { useBackSwipe } from '../gestures'
import { useExitMotion } from '../exit-motion'
import { isCustomizable, optionBounds, optsLabel, unitPrice, type CartLine } from '../cart'
import { AddButton, BackButton, Button, DishImage, Empty, OptionChip, Price, Stepper, Tag, TextButton, Thumb, fieldFocusClass, textareaClass } from './ui'

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
    <span className={`inline-flex max-w-full items-center gap-1 whitespace-nowrap rounded-full border border-white/80 bg-cream text-caption font-semibold text-cocoa shadow-soft ${compact ? 'min-h-5 px-1.5' : 'min-h-6 px-2'}`}>
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
  template,
  compactBadges,
  prioritizeImage,
  onOpen,
  onAdd,
}: {
  dish: Dish
  lang: Lang
  qty: number
  ordered: number
  template: 'list' | 'grid' | 'large'
  compactBadges: boolean
  prioritizeImage: boolean
  onOpen: () => void
  onAdd: () => void
}) {
  const compactTags = template === 'list' || compactBadges
  return (
    // Cards share a row height. Long names can wrap without displacing the price row.
    <article className={`menu-dish-card flex h-full min-w-0 flex-col overflow-hidden rounded-card border border-line bg-white ${dish.soldOut ? 'opacity-60' : ''}`}>
      <button onClick={onOpen} aria-label={`${uiText(lang, 'view_details_fe8b1')} · ${dish.name[lang]}`} className="menu-dish-media relative block overflow-hidden">
        <DishImage
          src={dish.image}
          alt={dish.name[lang]}
          fullSize={template === 'large'}
          defer={!prioritizeImage}
          loading={prioritizeImage ? 'eager' : 'lazy'}
          fetchPriority={prioritizeImage ? 'high' : 'low'}
          className="menu-dish-image aspect-[4/3] w-full transition duration-500 hover:scale-105"
        />
        {(ordered > 0 || (dish.tag && !dish.soldOut)) && (
          <span className="menu-dish-badges absolute inset-x-2 top-2 flex flex-wrap items-start justify-between gap-1">
            {ordered > 0 && <Tag tone="brand" compact={compactTags}>{strings.ordered[lang]} {ordered}</Tag>}
            {dish.tag && !dish.soldOut && <span className="menu-dish-feature-tag ml-auto"><DishTag kind={dish.tag} lang={lang} compact={compactTags} /></span>}
          </span>
        )}
        {dish.soldOut && (
          <span className="absolute inset-0 flex items-center justify-center bg-white/40">
            <Tag tone="overlay">{strings.soldOut[lang]}</Tag>
          </span>
        )}
      </button>
      <div className="menu-dish-detail">
        <button onClick={onOpen} className="menu-dish-name mt-3 flex min-h-11 flex-col items-start px-3 text-left">
          <h3 className="break-words text-body font-semibold">{dish.name[lang]}</h3>
          {dish.unit.en === '2 pcs' && <span className="mt-0.5 text-callout text-ink-2">{dish.unit[lang]}</span>}
        </button>
        <div className="menu-dish-actions mt-auto flex min-h-12 items-center gap-x-0.5 px-3 pb-2">
          <p className="menu-dish-price flex min-w-max flex-1 items-baseline gap-0.5 text-headline font-semibold whitespace-nowrap">
            <Price value={dish.price} className="shrink-0" />
          </p>
          {!dish.soldOut && <DishAddButton dish={dish} lang={lang} qty={qty} onClick={onAdd} compactOptions={template === 'grid'} />}
        </div>
      </div>
    </article>
  )
}

function DishAddButton({ dish, lang, qty, onClick, compactOptions }: { dish: Dish; lang: Lang; qty: number; onClick: () => void; compactOptions?: boolean }) {
  const customizable = isCustomizable(dish)
  const action = customizable ? `${strings.customize[lang]} · ${dish.name[lang]}` : strings.add[lang]
  const label = qty > 0 ? `${action} · ${strings.selected[lang]} ${qty}` : action
  const optionsLabel = customizable ? { en: 'Options', zh: '选规格', hk: '選規格' }[lang] : undefined
  return <AddButton onClick={onClick} label={label} qty={qty} optionsLabel={optionsLabel} compactOptions={compactOptions} />
}

type DishSelections = Record<string, string[]>

function activeOptionGroups(groups: OptionGroup[], selection: DishSelections): OptionGroup[] {
  return groups.flatMap((group) => [
    group,
    ...group.options.flatMap((option) =>
      selection[group.id]?.includes(option.id) ? activeOptionGroups(option.groups ?? [], selection) : [],
    ),
  ])
}

function optionRuleLabels(group: OptionGroup, lang: Lang) {
  const { min, max } = optionBounds(group)
  const unit = group.unit === 'portion' ? '份' : lang === 'hk' ? '項' : '项'
  const minLabel = lang === 'en' ? `Required: ${min}` : `${lang === 'hk' ? '必選' : '必选'} ${min} ${unit}`
  const maxLabel = lang === 'en' ? `Max. ${max}` : `${lang === 'hk' ? '最多選' : '最多选'} ${max} ${unit}`
  return [
    ...(min > 0 ? [minLabel] : []),
    ...(group.max !== undefined && max !== min ? [maxLabel] : []),
  ]
}

function DishOptionSection({ group, selection, lang, onToggle }: {
  group: OptionGroup
  selection: DishSelections
  lang: Lang
  onToggle: (group: OptionGroup, optionId: string) => void
}) {
  const selected = selection[group.id] ?? []
  const { max } = optionBounds(group)
  const rules = optionRuleLabels(group, lang)
  const children = group.options.filter((option) => selected.includes(option.id) && option.groups?.length)
  return (
    <section>
      <h2 className="mb-2 flex flex-wrap items-center gap-2 text-body font-semibold text-ink">
        {group.name[lang]}
        {rules.map((rule) => (
          <span key={rule} className="rounded-sm bg-tile px-2 py-0.5 text-caption font-medium text-ink-2">{rule}</span>
        ))}
      </h2>
      <div className="flex flex-wrap gap-2">
        {group.options.map((option, index) => {
          const active = selected.includes(option.id)
          return (
            <OptionChip key={option.id} active={active} disabled={!active && group.type === 'multi' && selected.length >= max} onClick={() => onToggle(group, option.id)} className="dish-option">
              {group.size && <CupSoda aria-hidden="true" size={14 + index * 3} className="shrink-0" />}
              {option.name[lang]}
              {option.price ? <span className={active ? '' : 'text-muted'}>+${option.price}</span> : null}
            </OptionChip>
          )
        })}
      </div>
      {children.map((option) => (
        <div key={option.id} className="mt-4 space-y-4 border-l border-line pl-3">
          {group.type === 'multi' && <h3 className="text-callout font-medium text-ink-2">{option.name[lang]}</h3>}
          {option.groups?.map((child) => <DishOptionSection key={child.id} group={child} selection={selection} lang={lang} onToggle={onToggle} />)}
        </div>
      ))}
    </section>
  )
}

/** Full-screen dish page: photo, options and product-specific requests. */
export function DishPage({
  dish,
  lang,
  ordered,
  initialLine,
  onClose,
  onAdd,
}: {
  dish: Dish
  lang: Lang
  ordered: number
  initialLine?: CartLine
  onClose: () => void
  onAdd: (opts: string[], note: string, qty: number) => void
}) {
  const groups = dishOptions[dish.id] ?? []
  const [sel, setSel] = useState<DishSelections>(() => {
    if (initialLine) {
      const configured = [...groups, ...optionTree(groups).flatMap((option) => option.groups ?? [])]
      return Object.fromEntries(configured.map((group) => [
        group.id, group.options.filter((option) => initialLine.opts.includes(option.id)).map((option) => option.id),
      ]))
    }
    return Object.fromEntries(groups.filter((group) => group.type === 'single' && optionBounds(group).min > 0).map((group) => [group.id, [group.options[0].id]]))
  })
  const { panel, dismiss } = useExitMotion(onClose, 'right')
  const swipe = useBackSwipe(dismiss)
  const [note, setNote] = useState(initialLine?.note ?? '')
  const [noteOpen, setNoteOpen] = useState(false)
  const [n, setN] = useState(initialLine?.qty ?? 1)
  const activeGroups = activeOptionGroups(groups, sel)
  const opts = activeGroups.flatMap((group) => sel[group.id] ?? [])
  const valid = activeGroups.every((group) => {
    const { min, max } = optionBounds(group)
    const count = sel[group.id]?.length ?? 0
    return count >= min && count <= max
  })
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

  const toggle = (group: OptionGroup, id: string) => setSel((current) => {
    const selected = current[group.id] ?? []
    const { min, max } = optionBounds(group)
    const removing = selected.includes(id)
    if (removing && group.type === 'single' && min > 0) return current
    if (!removing && group.type === 'multi' && selected.length >= max) return current
    const next = { ...current, [group.id]: removing ? selected.filter((value) => value !== id) : group.type === 'single' ? [id] : [...selected, id] }
    return Object.fromEntries(activeOptionGroups(groups, next).map(({ id: groupId }) => [groupId, next[groupId] ?? []]))
  })

  return (
    <div {...swipe} ref={panel} className="animate-slide absolute inset-0 z-50 flex touch-pan-y flex-col bg-white">
      {/* Pinned top-left, outside the scroll area, so it never covers content */}
      <BackButton onImage onClick={dismiss} className="absolute top-2 left-3 z-10 sm:pointer-fine:top-11" />
      <div className="no-scrollbar flex-1 overflow-y-auto pb-6">
        <div className="bg-tile">
          <DishImage src={dish.image} dishId={dish.id} alt={dish.name[lang]} fullSize loading="eager" fetchPriority="high" className="aspect-[16/10] w-full" />
        </div>
        <div className="border-b border-line px-5 pt-5 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            {ordered > 0 && <Tag tone="brand" compact>{t(strings.ordered)} {ordered}</Tag>}
            {dish.tag && <DishTag kind={dish.tag} lang={lang} compact />}
            <h1 className="min-w-0 text-title leading-tight font-semibold">{dish.name[lang]}</h1>
          </div>
          {(dish.unit.en === 'basket' || dish.unit.en === '2 pcs') && (
            <p className="mt-1 text-callout text-ink-2">
              {dish.unit.en === 'basket' && lang === 'en' ? 'Per basket' : dish.unit.en === 'basket' ? `每${dish.unit[lang]}` : dish.unit[lang]}
            </p>
          )}
        </div>

        <div className="dish-detail-sections bg-white px-5 pt-3">
          <div className="flex min-h-11 items-center justify-between gap-3">
            <h2 className="text-body font-semibold text-ink">{t(strings.quantity)}</h2>
            {dish.soldOut ? <span className="text-callout text-muted">{t(strings.soldOut)}</span> : (
              <Stepper min={1} qty={n} onMinus={() => setN((v) => v - 1)} onPlus={() => setN((v) => v + 1)} />
            )}
          </div>
          {groups.map((group) => <DishOptionSection key={group.id} group={group} selection={sel} lang={lang} onToggle={toggle} />)}
          <section>
            <button type="button" className="confirm-note-toggle" aria-expanded={noteOpen} onClick={() => setNoteOpen(!noteOpen)}>
              <strong>{t(strings.specialRequest)}</strong>
              <span>{note || uiText(lang, 'preferences_or_requests_f292b')} {noteOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</span>
            </button>
            {noteOpen && <div className="mt-2">
              {note.length > 0 && <p className="mb-1 text-right text-caption text-ink-2 tabular-nums">{note.length} / {MAX_DISH_NOTE}</p>}
              <textarea rows={2} value={note} maxLength={MAX_DISH_NOTE} onChange={(event) => setNote(event.target.value)} placeholder={dishHints[dish.id] ? t(dishHints[dish.id]) : uiText(lang, 'preferences_or_requests_f292b')} aria-label={t(strings.specialRequest)} className={textareaClass} />
              {quickNotes.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{quickNotes.map((quick) => {
                const label = t(quick)
                return <OptionChip key={quick.en} active={noteTokens.includes(label)} onClick={() => toggleQuickNote(label)} className="dish-option">{label}</OptionChip>
              })}</div>}
            </div>}
          </section>
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-3 border-t border-line bg-white px-5 pt-3 pb-[max(28px,env(safe-area-inset-bottom))]">
        <div className="min-w-16 shrink-0">
          <span className="sr-only">{strings.subtotal[lang]}</span>
          <Price value={price * n} className="block text-title font-semibold" />
        </div>
        <Button disabled={dish.soldOut || !valid} onClick={() => { if (valid && !dish.soldOut) onAdd(opts, note, n) }} className="min-w-0 flex-1">
          {dish.soldOut ? t(strings.soldOut) : initialLine ? ({en: 'Save changes', hk: '儲存修改', zh: '保存修改'}[lang]) : t(strings.add)}
        </Button>
      </div>
    </div>
  )
}

export function SearchOverlay({
  lang,
  inactive = false,
  qtyOf,
  orderedOf,
  onClose,
  onOpen,
  onAdd,
}: {
  lang: Lang
  inactive?: boolean
  qtyOf: (id: string) => number
  orderedOf: (id: string) => number
  onClose: () => void
  onOpen: (d: Dish) => void
  onAdd: (d: Dish) => void
}) {
  const [q, setQ] = useState('')
  const { panel, dismiss } = useExitMotion(onClose, 'right')
  const swipe = useBackSwipe(inactive ? undefined : dismiss)
  const s = q.trim().toLowerCase()
  // Match across all three languages so a guest can type in any script.
  const results = dishes.filter(
    (d) => !s || [d.name.en.toLowerCase(), d.name.hk, d.name.zh, d.desc.en.toLowerCase()].some((v) => v.includes(s)),
  )
  return (
    <div {...swipe} ref={panel} inert={inactive} className="animate-slide absolute inset-0 z-50 flex touch-pan-y flex-col bg-white">
      <div className="relative z-10 flex items-center gap-3 border-b border-line bg-white px-5 pt-3 pb-3 sm:pointer-fine:pt-14">
        <label className={`flex h-11 flex-1 items-center gap-2 rounded-md border border-transparent bg-tile px-4 ${fieldFocusClass}`}>
          <Search className="size-4.5 shrink-0 text-muted" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={strings.findDish[lang]}
            className="min-w-0 flex-1 bg-transparent text-body outline-none placeholder:text-muted"
          />
        </label>
        <TextButton tone="brand" size="body" weight="medium" className="min-w-11 shrink-0" onClick={dismiss}>
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
                      {d.unit.en === '2 pcs' && <span className="block text-callout text-ink-2">{d.unit[lang]}</span>}
                      <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                        <Price value={d.price} className="text-body font-semibold" />
                        {ordered > 0 && <Tag tone="brand">{strings.ordered[lang]} {ordered}</Tag>}
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
export function CartRow({ line, lang, amount, children, onEdit }: { line: CartLine; lang: Lang; amount: number; children?: ReactNode; onEdit: () => void }) {
  const label = optsLabel(line.opts, line.note, lang)
  return <li className="cart-item">
    <DishImage src={line.dish.image} dishId={line.dish.id} alt={line.dish.name[lang]} className="confirm-item-image" />
    <div className="cart-item-info">
      <button type="button" className="flex min-h-11 w-full items-center justify-between gap-2 text-left" onClick={onEdit}>
        <span className="min-w-0">
          <span className="cart-item-name block">{line.dish.name[lang]}</span>
          {label && <span className="confirm-options block">{label}</span>}
        </span>
        <Pencil className="size-4 shrink-0 text-ink-2" aria-hidden="true" />
        <span className="sr-only">{uiText(lang, 'edit_cart_item')}</span>
      </button>
      <div className="cart-item-bottom"><Price value={amount / 100} className="cart-item-price" />{children}</div>
    </div>
  </li>
}

/** Floating cart bar: count + total + solid brand checkout button. */
export function CartBar({ count, total, lang, bump, feedback, onOpen, onCheckout }: { count: number; total: number; lang: Lang; bump: number; feedback?: string; onOpen: () => void; onCheckout: () => void }) {
  return (
    <div className="animate-pop absolute inset-x-5 bottom-[max(20px,env(safe-area-inset-bottom))] z-30">
      <div className="glass-bar flex items-center gap-3 rounded-full border border-white/75 p-2 text-ink shadow-float">
        <button onClick={onOpen} className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <span className="sr-only">{strings.cart[lang]}</span>
          <span key={bump} className="animate-pop relative flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-soft text-ink">
            <ShoppingBag className="size-5" />
            <span className="absolute -top-1 -right-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-action px-1 text-caption font-semibold text-white tabular-nums ring-2 ring-white">
              {count}
            </span>
          </span>
          <span className="min-w-0">
            <span className="sr-only">{uiText(lang, 'total_7f9d9')}</span>
            <Price value={total} className="block truncate text-headline font-semibold" />
            {feedback && <span aria-hidden="true" className="menu-cart-feedback block text-caption font-medium leading-tight text-success">{feedback}</span>}
          </span>
        </button>
        <Button size="md" onClick={onCheckout} className="px-6">
          {strings.review[lang]}
        </Button>
      </div>
    </div>
  )
}
