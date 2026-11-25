import { uiText } from '../i18n'
/**
 * Harbour Jade UI kit — the only place visual primitives are defined.
 *
 * Tokens (see index.css @theme):
 *   radius   sm 8 · md 12 (controls) · card 16 · xl 24 (sheets) · full (pills)
 *   text     display-lg 44 · display 32 · hero 26 · title 20 · headline 17 · body 15 · callout 14 · caption 12
 *   spacing  page gutter 20 · card padding 16 · card gap 12 · control height 44 · primary button 52
 *   colour   brand = action + brand emphasis only · success / pending / info / danger = status
 *   sizes    icon buttons 44 · quantity circles 32 · list thumb 56
 */
import { createContext, useContext, useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { AlertCircle, Check, ChevronLeft, Info, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react'
import { useBackSwipe, useSheetSwipe } from '../gestures'
import type { Lang } from '../data'

export const LanguageContext = createContext<Lang>('hk')
const accessibilityText = { back: { en: 'Back', hk: '返回', zh: '返回' }, close: { en: 'Close', hk: '關閉', zh: '关闭' }, increase: { en: 'Increase', hk: '增加', zh: '增加' }, decrease: { en: 'Decrease', hk: '減少', zh: '减少' }, remove: { en: 'Remove', hk: '移除', zh: '移除' } }

/* ---------- Money ---------- */

const num = (n: number) => n.toFixed(2).replace(/\.?0+$/, '')
export const money = (n: number) => `$${num(n)}`

export const fieldClass = 'min-h-12 rounded-md border border-line bg-white px-4 text-body outline-none transition-[border-color,box-shadow] focus:border-brand focus:ring-2 focus:ring-brand/10 aria-invalid:border-danger aria-invalid:ring-danger/10'

export const textareaClass = 'w-full resize-none rounded-md border border-line bg-white p-4 text-body outline-none placeholder:text-muted transition-[border-color,box-shadow] focus:border-brand focus:ring-2 focus:ring-brand/10 aria-invalid:border-danger aria-invalid:ring-danger/10'

type NoticeTone = 'info' | 'pending' | 'danger' | 'success'

const noticeTone: Record<NoticeTone, string> = {
  info: 'bg-info-soft text-info',
  pending: 'bg-pending-soft text-pending',
  danger: 'bg-danger-soft text-danger',
  success: 'bg-success-soft text-success',
}

export function InlineAlert({ tone = 'info', title, children, className = '' }: { tone?: NoticeTone; title: ReactNode; children?: ReactNode; className?: string }) {
  const Icon = tone === 'danger' || tone === 'pending' ? AlertCircle : tone === 'success' ? Check : Info
  return (
    <div role={tone === 'danger' ? 'alert' : 'status'} className={`flex items-start gap-2 rounded-md px-4 py-3 text-callout ${noticeTone[tone]} ${className}`}>
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0"><p className="font-semibold">{title}</p>{children && <div className="mt-1">{children}</div>}</div>
    </div>
  )
}

export function StatusPanel({ tone = 'info', icon, title, description, variant = 'card' }: { tone?: NoticeTone; icon: ReactNode; title: ReactNode; description?: ReactNode; variant?: 'card' | 'row' }) {
  const iconTone =
    tone === 'danger' ? 'bg-danger-soft text-danger'
      : tone === 'success' ? 'bg-success-soft text-success'
        : tone === 'pending' ? 'bg-pending-soft text-pending'
          : 'bg-info-soft text-info'
  return (
    <div role="status" className={`flex gap-3 ${variant === 'card' ? 'items-start rounded-md bg-tile px-4 py-4' : 'items-center'}`}>
      <span className={`grid size-10 shrink-0 place-items-center rounded-full ${iconTone}`}>{icon}</span>
      <div className="min-w-0">
        <p className="text-headline font-semibold">{title}</p>
        {description && <p className="mt-1 text-callout text-ink-2">{description}</p>}
      </div>
    </div>
  )
}

/** "$" is the same size as the figures but regular weight. */
export function Price({ value, className = '' }: { value: number; className?: string }) {
  return (
    <span className={`tabular-nums ${className}`}>
      <span className="font-normal">$</span>
      {num(value)}
    </span>
  )
}

/* ---------- Language ---------- */

export const LANGS: { code: Lang; short: string; name: string; attr: string }[] = [
  { code: 'hk', short: '繁', name: '繁體中文', attr: 'zh-HK' },
  { code: 'zh', short: '简', name: '简体中文', attr: 'zh-CN' },
  { code: 'en', short: 'EN', name: 'English', attr: 'en' },
]

/* ---------- Buttons ---------- */

type BtnVariant = 'primary' | 'secondary' | 'warm' | 'dark'
const btnVariant: Record<BtnVariant, string> = {
  primary: 'bg-brand text-white active:bg-brand-strong',
  secondary: 'bg-tile text-ink active:bg-line',
  warm: 'glass-entry border border-white/65 text-white active:ring-1 active:ring-white/80',
  dark: 'bg-ink text-white active:bg-black',
}

export function Button({
  variant = 'primary',
  size = 'lg',
  className = '',
  children,
  ...rest
}: { variant?: BtnVariant; size?: 'md' | 'lg' } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center gap-2 rounded-full text-center font-medium leading-tight transition active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:pointer-events-none disabled:opacity-50 disabled:active:scale-100 ${
        size === 'lg' ? 'min-h-button-lg px-5 text-body' : 'min-h-11 px-4 text-callout'
      } ${btnVariant[variant]} ${className}`}
    >
      {children}
    </button>
  )
}

/* ---------- Text actions ---------- */

type TextTone = 'brand' | 'brandStrong' | 'neutral' | 'muted'
const textTone: Record<TextTone, string> = {
  brand: 'text-brand',
  brandStrong: 'text-brand-strong',
  neutral: 'text-ink',
  muted: 'text-ink-2',
}

/**
 * Borderless text action: links, "view more", simulated steps.
 * Height and focus ring are shared; colour, size, weight and underline are the only variants.
 */
export function TextButton({
  tone = 'neutral',
  size = 'callout',
  weight = 'normal',
  underline = false,
  compact = false,
  className = '',
  children,
  ...rest
}: { tone?: TextTone; size?: 'callout' | 'body'; weight?: 'normal' | 'medium'; underline?: boolean; compact?: boolean } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...rest}
      className={`inline-flex items-center ${compact ? '' : 'min-h-11'} ${size === 'body' ? 'text-body' : 'text-callout'} ${weight === 'medium' ? 'font-medium' : ''} ${textTone[tone]} ${underline ? 'underline' : ''} focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:pointer-events-none disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  )
}

type IconVariant = 'light' | 'dark' | 'tile' | 'plain' | 'image'
const iconVariant: Record<IconVariant, string> = {
  light: 'bg-white/85 text-ink backdrop-blur-md',
  dark: 'bg-black/30 text-white backdrop-blur-md',
  tile: 'bg-tile text-ink',
  plain: 'text-ink',
  image: 'text-white drop-shadow-md',
}

export function IconButton({
  variant = 'tile',
  label,
  badge,
  className = '',
  children,
  ...rest
}: { variant?: IconVariant; label: string; badge?: number } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      aria-label={label}
      // `relative` only when not positioned by the caller — otherwise it overrides `absolute`
      className={`${/\b(absolute|fixed)\b/.test(className) ? '' : 'relative'} inline-flex size-11 shrink-0 items-center justify-center rounded-full transition active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:pointer-events-none disabled:opacity-40 disabled:active:scale-100 ${iconVariant[variant]} ${className}`}
    >
      {children}
      {!!badge && <Badge className="absolute -top-0.5 -right-0.5">{badge}</Badge>}
    </button>
  )
}

export function BackButton({ onClick, onImage = false, className = '' }: { onClick: () => void; onImage?: boolean; className?: string }) {
  const lang = useContext(LanguageContext)
  return (
    <button type="button" aria-label={accessibilityText.back[lang]} onClick={onClick} className={`grid size-11 shrink-0 place-items-center rounded-full active:bg-black/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:pointer-events-none disabled:opacity-40 ${onImage ? 'text-white' : 'text-ink'} ${className}`}>
      <ChevronLeft className={`size-6 ${onImage ? 'drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]' : ''}`} />
    </button>
  )
}

export function Badge({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-brand px-1 text-caption font-semibold text-white tabular-nums ring-2 ring-white ${className}`}
    >
      {children}
    </span>
  )
}

/* ---------- Quantity ---------- */

/** Light stepper used everywhere. At qty 1 (when removable) the minus becomes a trash icon. */
export function Stepper({ qty, onMinus, onPlus, min = 0 }: { qty: number; onMinus: () => void; onPlus: () => void; min?: number }) {
  const trash = min === 0 && qty === 1
  const buttonClass = 'group grid size-11 shrink-0 place-items-center rounded-full disabled:opacity-40'
  const lang = useContext(LanguageContext)
  return (
    <div className="flex shrink-0 items-center gap-0.5">
      <button
        onClick={onMinus}
        disabled={qty <= min}
        aria-label={trash ? accessibilityText.remove[lang] : accessibilityText.decrease[lang]}
        className={buttonClass}
      >
        <span className="grid size-8 place-items-center rounded-full bg-tile text-ink-2 transition group-active:bg-line">
          {trash ? <Trash2 className="size-4" /> : <Minus className="size-4" strokeWidth={2.25} />}
        </span>
      </button>
      <span className="min-w-4 text-center text-body font-medium tabular-nums">{qty}</span>
      <button
        onClick={onPlus}
        aria-label={accessibilityText.increase[lang]}
        className={buttonClass}
      >
        <span className="grid size-8 place-items-center rounded-full bg-brand-soft text-brand transition group-active:bg-brand/20">
          <Plus className="size-4" strokeWidth={2.25} />
        </span>
      </button>
    </div>
  )
}

/** Same footprint as the stepper's plus, solid to signal the primary action. */
export function AddButton({ onClick, label, qty }: { onClick: () => void; label: string; qty: number }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="group relative flex h-11 min-w-10 shrink-0 items-center justify-end rounded-full"
    >
      {qty > 0 && <span className="-mr-2 flex h-7 items-center rounded-l-full bg-brand-soft pr-2.5 pl-2 text-caption font-semibold text-brand-strong tabular-nums">×{qty}</span>}
      <span className="relative grid size-8 place-items-center rounded-full bg-brand text-white transition group-active:scale-95 group-active:bg-brand-strong">
        <Plus className="size-4" strokeWidth={2.5} />
      </span>
    </button>
  )
}

/* ---------- Tags ---------- */

type TagTone = 'brand' | 'solid' | 'neutral' | 'overlay' | 'success' | 'pending' | 'info' | 'danger'
const tagTone: Record<TagTone, string> = {
  brand: 'bg-brand-soft text-brand',
  solid: 'bg-brand text-white',
  neutral: 'bg-tile text-ink-2',
  overlay: 'bg-black/35 text-white backdrop-blur-md',
  success: 'bg-success-soft text-success',
  pending: 'bg-pending-soft text-pending',
  info: 'bg-info-soft text-info',
  danger: 'bg-danger-soft text-danger',
}
export const tagClass = (tone: TagTone = 'neutral', compact = false) =>
  `inline-flex shrink-0 items-center gap-1 rounded-sm text-caption font-medium whitespace-nowrap ${compact ? 'h-5 px-1.5' : 'h-6 px-2'} ${tagTone[tone]}`

export function Tag({ tone, compact, className = '', children }: { tone?: TagTone; compact?: boolean; className?: string; children: ReactNode }) {
  return <span className={`${tagClass(tone, compact)} ${className}`}>{children}</span>
}

/* ---------- Selectable option (chips) ---------- */

/**
 * One selection state table for every single/multi-choice control: OptionChip, ChoiceRow,
 * dining mode and payment tips. Shapes may differ; border, radius, type size and padding do not.
 */
export const choiceState = (active: boolean) => (active
  ? 'border-brand bg-brand-soft font-medium text-ink'
  : 'border-line bg-white text-ink')

export const choiceBase = 'border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:pointer-events-none disabled:border-line disabled:bg-tile disabled:text-muted disabled:opacity-60'

export function OptionChip({ active, onClick, disabled, className = '', children }: { active: boolean; onClick: () => void; disabled?: boolean; className?: string; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-md px-4 text-body ${choiceBase} ${choiceState(active)} ${className}`}
    >
      {children}
    </button>
  )
}

/* ---------- Imagery ---------- */

export function DishImage({ src, alt, className = '' }: { src?: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false)
  if (!src || failed)
    return (
      <div className={`flex items-center justify-center bg-line ${className}`} role="img" aria-label={alt}>
        <ShoppingBag className="h-1/3 w-1/3 text-muted/40" strokeWidth={1.5} />
      </div>
    )
  return <img src={src} alt={alt} decoding="async" onError={() => setFailed(true)} className={`object-cover ${className}`} />
}

/** 56px list thumbnail — the only thumbnail size outside the menu grid. */
export function Thumb({ src }: { src?: string }) {
  return <DishImage src={src} alt="" className="size-14 shrink-0 rounded-md" />
}

export function Logo({ size = 72 }: { size?: 64 | 72 }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full bg-brand font-serif font-bold text-white ring-4 ring-white shadow-soft"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      悅
    </span>
  )
}

/* ---------- Layout ---------- */

export function BottomSheet({
  title,
  titleAccessory,
  onClose,
  children,
  footer,
  headerActions,
}: {
  title: ReactNode
  titleAccessory?: ReactNode
  onClose?: () => void
  children: ReactNode
  footer?: ReactNode
  headerActions?: ReactNode
}) {
  const lang = useContext(LanguageContext)
  const [expanded, setExpanded] = useState(false)
  const swipe = useSheetSwipe(() => onClose?.(), () => setExpanded(true))
  return (
    <div {...(onClose ? swipe : {})} className="absolute inset-0 z-50 flex flex-col justify-end">
      <div className="animate-fade absolute inset-0 bg-black/40" onClick={onClose} />
      <div className={`animate-sheet relative flex flex-col rounded-t-xl bg-white transition-[height,max-height] duration-300 ease-out ${expanded ? 'h-[94%] max-h-[94%]' : 'max-h-[86%]'}`}>
        <div data-sheet-handle className="touch-pan-x">
        <div className="mx-auto mt-2 h-1 w-9 rounded-full bg-line" />
        <div className="flex items-center justify-between gap-4 px-5 pt-3 pb-2">
          <div className="flex min-w-0 items-center gap-2"><h2 className="text-headline font-semibold">{title}</h2>{titleAccessory}</div>
          <div className="flex shrink-0 items-center gap-2">
            {headerActions}
            {onClose && <IconButton variant="plain" label={accessibilityText.close[lang]} onClick={onClose}>
              <X className="size-5" />
            </IconButton>}
          </div>
        </div>
        </div>
        <div data-sheet-scroll className={`no-scrollbar flex-1 overflow-y-auto px-5 pt-2 ${footer ? 'pb-5' : 'pb-[calc(32px+env(safe-area-inset-bottom))]'}`}>{children}</div>
        {footer && <div className="border-t border-line px-5 pt-3 pb-[calc(24px+env(safe-area-inset-bottom))]">{footer}</div>}
      </div>
    </div>
  )
}

/** Two-column label / value row for totals. */
export function Row({ k, v, strong }: { k: ReactNode; v: ReactNode; strong?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between gap-4 ${strong ? 'text-headline font-semibold text-ink' : 'text-body text-ink-2'}`}>
      <dt>{k}</dt>
      <dd className={`tabular-nums ${strong ? '' : 'text-ink'}`}>{v}</dd>
    </div>
  )
}

/** Selectable list row used by language / dining-mode sheets. */
export function ChoiceRow({
  active,
  onClick,
  leading,
  children,
  lang,
  disabled,
}: {
  active: boolean
  onClick: () => void
  leading: ReactNode
  children: ReactNode
  lang?: string
  disabled?: boolean
}) {
  return (
    <button
      lang={lang}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={`flex min-h-14 w-full items-center gap-3 rounded-md px-4 py-2 text-left text-body ${choiceBase} ${choiceState(active)}`}
    >
      <span
        className={`flex size-8 shrink-0 items-center justify-center rounded-full text-callout font-semibold ${
          active ? 'bg-brand text-white' : 'bg-tile text-ink-2'
        }`}
      >
        {leading}
      </span>
      <span className="min-w-0 flex-1">{children}</span>
      <span className={`grid size-5 shrink-0 place-items-center rounded-full border-2 ${active ? 'border-brand' : 'border-line'}`}>
        {active && <span className="size-2.5 rounded-full bg-brand" />}
      </span>
    </button>
  )
}

/** Friendly empty-state illustration: a bowl with a little face and rising steam. */
export function EmptyArt() {
  return (
    <svg width="120" height="104" viewBox="0 0 120 104" fill="none" aria-hidden="true">
      <path d="M48 14c-4 5 4 8 0 14M60 8c-4 5 4 8 0 14M72 14c-4 5 4 8 0 14" stroke="var(--color-line)" strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="60" cy="96" rx="34" ry="5" fill="var(--color-tile)" />
      <path d="M16 46h88c0 24-19.7 44-44 44S16 70 16 46Z" fill="var(--color-brand-soft)" />
      <rect x="12" y="40" width="96" height="10" rx="5" fill="var(--color-brand)" />
      <circle cx="47" cy="64" r="3.5" fill="var(--color-ink)" />
      <circle cx="73" cy="64" r="3.5" fill="var(--color-ink)" />
      <path d="M53 76c4-3 10-3 14 0" stroke="var(--color-ink)" strokeWidth="3" strokeLinecap="round" />
      <circle cx="38" cy="72" r="4" fill="var(--color-brand)" opacity=".25" />
      <circle cx="82" cy="72" r="4" fill="var(--color-brand)" opacity=".25" />
    </svg>
  )
}

export function Empty({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center py-10 text-center">
      <EmptyArt />
      <p className="mt-4 text-body text-ink-2">{title}</p>
    </div>
  )
}

/* ---------- Page scaffolding (confirm · order detail · payment) ---------- */

/** Full-screen page: back + title header, scrollable body of <Section>s, optional action footer. */
export function Page({ title, onBack, footer, children, className = "" }: { title: string; onBack?: () => void; footer?: ReactNode; children: ReactNode; className?: string }) {
  const swipe = useBackSwipe(onBack, !onBack)
  return (
    <div {...swipe} className={`animate-slide absolute inset-0 z-50 flex touch-pan-y flex-col bg-tile ${className}`}>
      <header className="relative z-10 flex shrink-0 items-center gap-2 border-b border-line bg-white px-3 pt-2 pb-2 shadow-divider sm:pointer-fine:pt-11">
        {onBack ? <BackButton onClick={onBack} /> : <span className="size-11 shrink-0" />}
        <h1 className="text-headline font-semibold">{title}</h1>
      </header>
      <div className="no-scrollbar flex-1 overflow-y-auto pb-4">{children}</div>
      {footer && <footer className="border-t border-line bg-white px-gutter pt-stack pb-[max(28px,env(safe-area-inset-bottom))]">{footer}</footer>}
    </div>
  )
}

/**
 * Content block on the light-grey page: optional label above, white card with 16px padding.
 * Consecutive cards sit 12px apart; the last card keeps at least 24px clear of the footer.
 */
export function Section({ title, trailing, children }: { title?: ReactNode; trailing?: ReactNode; children: ReactNode }) {
  return (
    <section className="px-gutter pt-stack last:pb-6">
      {(title || trailing) && (
        <div className="mb-2 flex items-center justify-between gap-3 px-1">
          {title ? <h2 className="text-body font-semibold text-ink-2">{title}</h2> : <span />}
          {trailing}
        </div>
      )}
      <div className="rounded-card bg-white p-card">{children}</div>
    </section>
  )
}

/** Compact table identity — must never outrank the order status it sits beside. */
export function TableIdentity({ table, mode, guests, lang }: { table: string; mode: 'dine' | 'takeaway'; guests: number; lang: Lang }) {
  const modeLabel = mode === 'dine' ? (uiText(lang, 'dine_in_51682')) : (uiText(lang, 'takeaway_f1b48'))
  return (
    <p className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-callout text-ink-2">
      <span className="font-semibold text-ink tabular-nums">{table}</span>
      <span aria-hidden="true" className="text-muted">·</span>
      <span>{modeLabel}</span>
      {mode === 'dine' && (
        <>
          <span aria-hidden="true" className="text-muted">·</span>
          <span>{guests} {lang === 'en' ? (guests === 1 ? 'guest' : 'guests') : '人'}</span>
        </>
      )}
    </p>
  )
}

/**
 * Footer pattern used by every action page: amount with its meaning, primary action on the right.
 * `label` is required so a bare number can never appear in a bottom bar.
 */
export function ActionBar({ label, total, children, hint, hideLabel = false }: { label: string; total: number; children: ReactNode; hint?: ReactNode; hideLabel?: boolean }) {
  return (
    <div className="flex items-center gap-4">
      <div className="min-w-0 shrink-0">
        <p className={hideLabel ? "sr-only" : "text-caption text-ink-2"}>{label}</p>
        <Price value={total} className="text-title font-semibold" />
        {hint && <p className="mt-0.5 text-caption text-ink-2">{hint}</p>}
      </div>
      <div className="flex min-w-0 flex-1 gap-3">{children}</div>
    </div>
  )
}
