import { uiText } from './i18n'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Globe,
  ReceiptText,
  Search,
  ShoppingBag,
  Signal,
  Trash2,
  UtensilsCrossed,
  Wifi,
} from 'lucide-react'
import { HOME_AVATAR, HOME_HERO, categories, dishOptions, dishes, strings, type Dish, type L10n, type Lang } from './data'
import { isCustomizable, lineKey, type CartLine } from './cart'
import { BottomSheet, Button, LanguageContext, ChoiceRow, Empty, IconButton, LANGS, OptionChip, Stepper, TextButton, Thumb, money, tagClass } from './components/ui'
import { FeeRows, feeText } from './components/pricing'
import { couponIssue, quoteCart, storeRules, toCents, type CouponId, type PriceQuote, type QuoteOptions } from './pricing'
import { CartBar, CartRow, DishCard, DishPage, SearchOverlay } from './components/menu'
import { Welcome, type Mode } from './components/Welcome'
import { OrderDetail, OrderAmounts, calculateBill, type PaymentRecord, type Round } from './components/orders'
import { ConfirmPage, hasValidOrderContact, type Contact } from './components/confirm'
import { PaymentFlow, PaymentResultSheet, type TablePaymentResult } from './components/pay'
import { MemberPage, type Member } from './components/member'
import { MyOrders } from './components/my-orders'
import { useBackSwipe, useBrowserBack } from './gestures'

// One table session = one order number; rounds are first order + add-ons
const ORDER_NO = 1041
const PICKUP = 'T021'
const RECEIPT_NO = '0001'
const entry = new URLSearchParams(window.location.search)
const table = entry.get('code') === 'table' ? entry.get('table')?.trim() || 'A08' : null
const storeCode = entry.get('code') === 'store'
const demo = entry.get('demo') === 'fees' || (entry.get('demo') === 'postpay' && !table)
const manualAcceptance = entry.get('accept') === 'manual'
const prepay = entry.get('payment') === 'prepay'
const gateway = entry.get('channel') === 'gateway'
const online = entry.get('online') !== '0' && entry.get('ordering') !== 'only'
const readonly = entry.get('ordering') === 'readonly'
const storeState = entry.get('store')
const canOrder = !readonly && storeState !== 'closed' && storeState !== 'offline'
const manualSettlement = entry.get('settlement') === 'manual'
const sessionKey = `ordering-a3:${window.location.search}`
const paymentSessionKey = `${sessionKey}:payment`
const sessionStore = table && prepay ? localStorage : sessionStorage
function restoreSession() {
  try {
    const saved = JSON.parse(sessionStore.getItem(sessionKey) || 'null')
    return saved ? { ...saved, payments: (saved.payments ?? []).map((payment: PaymentRecord) => ({ ...payment, paidAt: new Date(payment.paidAt) })) } : null
  } catch { return null }
}

function demoCart(): CartLine[] {
  if (!demo) return []
  return dishes.filter((dish) => dish.id === 'r1' || dish.id === 'sw1').map((dish) => {
    const opts = (dishOptions[dish.id] ?? []).filter((group) => group.type === 'single').map((group) => group.options[0].id)
    return { key: lineKey(dish.id, opts, ''), dish, opts, note: '', qty: 1 }
  })
}

type OrderRequest = { status: 'waiting' | 'cancelled'; round: Round }

type Sheet = null | 'language' | 'cart' | 'categories' | 'leave-payment'
type Page = null | 'search' | 'confirm' | 'orders' | 'my-orders' | 'pay' | 'member' | { dish: Dish }

export default function App() {
  // Keep the 390 × 844 preview intact when the desktop side panel is short.
  const [previewScale, setPreviewScale] = useState(1)
  useEffect(() => {
    const updatePreviewScale = () => {
      const desktop = window.matchMedia('(min-width: 640px) and (pointer: fine)').matches
      setPreviewScale(desktop ? Math.min(1, Math.max(0.1, (window.innerHeight - 48) / 844), Math.max(0.1, (window.innerWidth - 48) / 390)) : 1)
    }
    updatePreviewScale()
    window.addEventListener('resize', updatePreviewScale)
    return () => window.removeEventListener('resize', updatePreviewScale)
  }, [])
  useBrowserBack()
  // Hong Kong default: Traditional Chinese
  const [savedSession] = useState(restoreSession)
  const [lang, setLang] = useState<Lang>(() => ['en', 'hk', 'zh'].includes(savedSession?.lang) ? savedSession.lang : (['en', 'hk', 'zh'].includes(localStorage.getItem('ordering-language') || '') ? localStorage.getItem('ordering-language') as Lang : 'hk'))
  const t = (s: L10n) => s[lang]
  const langAttr = LANGS.find((l) => l.code === lang)!.attr
  useEffect(() => { document.title = strings.restaurant[lang]; document.documentElement.lang = langAttr }, [lang, langAttr])

  const [entered, setEntered] = useState(!!table || (savedSession?.entered ?? (!!storeCode || demo)))
  const [member, setMember] = useState<Member | null>(null)
  const [memberLoggedIn, setMemberLoggedIn] = useState(false)
  const [mode, setMode] = useState<Mode>(savedSession?.mode ?? (demo && !table ? 'takeaway' : 'dine'))
  const [lines, setLines] = useState<CartLine[]>(savedSession?.lines ?? demoCart())
  const [coupon, setCoupon] = useState<CouponId | null>(savedSession?.coupon ?? null)
  const [couponNotice, setCouponNotice] = useState<ReturnType<typeof couponIssue>>(null)
  const [packagingCents, setPackagingCents] = useState(storeRules.packagingCents)
  const [reviewQuote, setReviewQuote] = useState<PriceQuote | null>(null)
  const [repriced, setRepriced] = useState(false)
  const [rounds, setRounds] = useState<Round[]>(savedSession?.rounds ?? [])
  const [payments, setPayments] = useState<PaymentRecord[]>(savedSession?.payments ?? [])
  const [request, setRequest] = useState<OrderRequest | null>(savedSession?.request ?? null)
  const [animateOrderSuccess, setAnimateOrderSuccess] = useState(false)
  const [lastPaidAmount, setLastPaidAmount] = useState<number | null>(null)
  const [contact, setContact] = useState<Contact>(savedSession?.contact ?? { name: '', phone: '' })
  const [guests, setGuests] = useState(savedSession?.guests ?? 1)
  const [orderNote, setOrderNote] = useState(savedSession?.orderNote ?? '')
  const [settled, setSettled] = useState(savedSession?.settled ?? false)
  const [pendingRound, setPendingRound] = useState<Round | null>(savedSession?.pendingRound ?? null)
  const [prepayExpiresAt, setPrepayExpiresAt] = useState<number | null>(savedSession?.prepayExpiresAt ?? null)
  const [paymentAttempt, setPaymentAttempt] = useState(0)
  const [paymentResult, setPaymentResult] = useState<TablePaymentResult | null>(savedSession?.paymentResult ?? null)
  const [sheet, setSheet] = useState<Sheet>(null)
  const [page, setPage] = useState<Page>(savedSession?.paymentResult ? (savedSession.pendingRound && savedSession.paymentResult.kind !== 'success' ? 'confirm' : 'orders') : savedSession?.tablePaymentOpen ? 'pay' : savedSession?.pendingRound ? 'confirm' : savedSession?.request || savedSession?.rounds?.length ? 'orders' : null)
  const [toast, setToast] = useState<string | null>(null)
  const [detailFromList, setDetailFromList] = useState(false)
  const [active, setActive] = useState('all')
  const [scrollY, setScrollY] = useState(0)
  const [categoryPinned, setCategoryPinned] = useState(false)
  const [bump, setBump] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const categoryNavRef = useRef<HTMLElement>(null)
  const categoryTabsRef = useRef<HTMLDivElement>(null)
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({})
  const menuSwipe = useBackSwipe(!table && entered && !page && !sheet ? () => {
    setEntered(false)
    setActive('all')
    scrollRef.current?.scrollTo({ top: 0 })
  } : undefined)

  const tablePaymentOpen = !!table && page === 'pay'
  useEffect(() => {
    sessionStore.setItem(sessionKey, JSON.stringify({ entered, mode, lines, coupon, rounds, payments, request, contact, guests, settled, orderNote, pendingRound, paymentResult, tablePaymentOpen, prepayExpiresAt, lang }))
    if (paymentResult) sessionStore.removeItem(paymentSessionKey)
  }, [entered, mode, lines, coupon, rounds, payments, request, contact, guests, settled, orderNote, pendingRound, paymentResult, tablePaymentOpen, prepayExpiresAt, lang])

  useEffect(() => {
    if (!pendingRound || !prepayExpiresAt || (page === 'pay' && !paymentResult) || paymentResult?.kind === 'expired' || paymentResult?.kind === 'success' || paymentResult?.kind === 'cancelled') return
    const tick = () => { if (Date.now() >= prepayExpiresAt) { setPaymentResult({ kind: 'expired' }); setPage('confirm') } }
    tick(); const timer = setInterval(tick, 1000); return () => clearInterval(timer)
  }, [pendingRound, prepayExpiresAt, page, paymentResult])

  const count = lines.reduce((s, l) => s + l.qty, 0)
  const pricingOptions: QuoteOptions = { mode, coupon: null, addOn: rounds.length > 0, packagingCents }
  const quote = quoteCart(lines, pricingOptions)
  const invalidCoupon = coupon ? couponIssue(lines, pricingOptions, coupon) : null

  useEffect(() => {
    if (!invalidCoupon) return
    setCoupon(null)
    setCouponNotice(invalidCoupon)
  }, [invalidCoupon])

  const tally = (ls: CartLine[]) => {
    const m: Record<string, number> = {}
    for (const l of ls) m[l.dish.id] = (m[l.dish.id] ?? 0) + l.qty
    return m
  }
  const qtyByDish = useMemo(() => tally(lines), [lines])
  // Dishes already sent to the kitchen — marked on the menu when ordering more
  const orderedByDish = useMemo(() => tally(rounds.flatMap((r) => r.lines)), [rounds])
  const bill = calculateBill(rounds, payments)

  const addLine = (dish: Dish, opts: string[], note: string, qty: number) => {
    const key = lineKey(dish.id, opts, note)
    setBump((b) => b + 1)
    setLines((ls) => {
      const found = ls.find((l) => l.key === key)
      if (found) return ls.map((l) => (l.key === key ? { ...l, qty: l.qty + qty } : l))
      return [...ls, { key, dish, opts, note: note.trim(), qty }]
    })
  }
  const changeLine = (key: string, delta: number) => {
    if (delta > 0) setBump((b) => b + 1)
    setLines((ls) => ls.map((l) => (l.key === key ? { ...l, qty: l.qty + delta } : l)).filter((l) => l.qty > 0))
  }
  // Customisable dishes open the detail page; simple ones add straight away.
  const lockedMessage = uiText(lang, 'ordering_unavailable_4f1f3')
  const quickAdd = (dish: Dish) => { if (!canOrder) { setToast(lockedMessage); return } return isCustomizable(dish) ? setPage({ dish }) : addLine(dish, [], '', 1) }

  useEffect(() => {
    if (!toast) return
    const id = setTimeout(() => setToast(null), 2200)
    return () => clearTimeout(id)
  }, [toast])

  const stickyOffset = () => {
    const nav = categoryNavRef.current
    return nav ? nav.offsetHeight + (parseFloat(getComputedStyle(nav).top) || 0) : 0
  }

  const scrollTo = (id: string) => {
    const el = scrollRef.current
    if (!el) return
    const target = sectionRefs.current[id]
    setActive(id)
    if (id === 'all') el.scrollTo({ top: 0, behavior: 'smooth' })
    if (target) el.scrollTo({ top: Math.max(0, target.offsetTop - stickyOffset() + 4), behavior: 'smooth' })
  }

  const onScroll = () => {
    const el = scrollRef.current
    if (!el) return
    setScrollY(el.scrollTop)
    const nav = categoryNavRef.current
    if (nav) {
      const top = parseFloat(getComputedStyle(nav).top) || 0
      setCategoryPinned(el.scrollTop > 0 && nav.getBoundingClientRect().top <= el.getBoundingClientRect().top + top + 1)
    }
    const offset = stickyOffset() + 12
    const first = sectionRefs.current[categories[0].id]
    if (first && el.scrollTop < first.offsetTop - offset - 30) return setActive('all')
    const activationLine = el.getBoundingClientRect().top + offset
    let current = 'all'
    for (const c of categories) {
      const sec = sectionRefs.current[c.id]
      if (sec && sec.getBoundingClientRect().top <= activationLine) current = c.id
    }
    setActive(current)
  }

  const barSolid = scrollY > 140

  useEffect(() => {
    const container = categoryTabsRef.current
    const selected = container?.querySelector<HTMLElement>('[aria-pressed="true"]')
    if (!container || !selected) return
    const left = selected.getBoundingClientRect().left - container.getBoundingClientRect().left + container.scrollLeft
    const right = left + selected.offsetWidth
    if (left < container.scrollLeft || right > container.scrollLeft + container.clientWidth) {
      container.scrollTo({ left: left - (container.clientWidth - selected.offsetWidth) / 2, behavior: 'smooth' })
    }
  }, [active])

  const acceptOrder = (round: Round) => {
    setRounds((previous) => previous.some((item) => item.id === round.id) ? previous : [...previous, round])
    if (table) setSettled(false)
    setRequest(null)
    setAnimateOrderSuccess(true)
  }

  const submitOrder = () => {
    if (pendingRound && prepayExpiresAt && Date.now() < prepayExpiresAt) { setPaymentResult(null); setPaymentAttempt(v => v + 1); setPage('pay'); return }
    if (!lines.length || pendingRound || request?.status === 'waiting' || !canOrder) return
    if (!hasValidOrderContact(mode, contact)) return
    const latestPackaging = entry.get('reprice') === '1' && quote.packaging > 0 ? storeRules.packagingCents + 100 : packagingCents
    const latestQuote = quoteCart(lines, { ...pricingOptions, packagingCents: latestPackaging })
    if (!reviewQuote || JSON.stringify(latestQuote) !== JSON.stringify(reviewQuote)) {
      setPackagingCents(latestPackaging)
      setReviewQuote(latestQuote)
      setRepriced(true)
      return
    }
    const round = {
      id: rounds.length + 1,
      lines,
      mode,
      quote: latestQuote,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: new Date().toISOString(),
    }
    if (prepay && (!rounds.length || !!table) && online) {
      setPendingRound(round)
      if (table) setPrepayExpiresAt(Date.now() + 15 * 60 * 1000)
      setPage('pay')
      return
    }
    if (manualAcceptance && !rounds.length) setRequest({ status: 'waiting', round })
    else acceptOrder(round)
    setLines([])
    setCoupon(null)
    setCouponNotice(null)
    // Post-pay submissions only create the round. Payment is a separate action
    // from Order details, where the amount due is always the table bill remaining.
    setPage('orders')
  }

  const resetSession = () => {
    setRounds([])
    setPayments([])
    setLastPaidAmount(null)
    setAnimateOrderSuccess(false)
    setLines([])
    setCoupon(null)
    setCouponNotice(null)
    setRequest(null)
    setPendingRound(null)
    setSettled(false)
    setPaymentResult(null)
    setContact({ name: '', phone: '' })
    setOrderNote('')
    setPage(null)
    setEntered(!!table || storeCode)
    scrollRef.current?.scrollTo({ top: 0 })
  }

  const darkStatus = (entered && page === null) || page === 'my-orders' || page === 'member' || page === 'orders' || page === 'confirm'
  const categoryPillClass = (isActive: boolean) => `flex h-11 shrink-0 items-center rounded-full text-body whitespace-nowrap transition-colors ${isActive ? 'font-semibold text-brand' : 'text-muted'}`

  return (
    <LanguageContext.Provider value={lang}><div className="flex min-h-dvh items-center justify-center sm:pointer-fine:p-6">
      <div id="ordering-frame" lang={langAttr} style={{ zoom: previewScale }} className="relative h-dvh w-full shrink-0 overflow-hidden bg-white sm:pointer-fine:h-[844px] sm:pointer-fine:w-[390px] sm:pointer-fine:rounded-device sm:pointer-fine:shadow-float">
        <StatusBar dark={darkStatus} solid={barSolid && !page && entered} />

        {!entered && (
          <Welcome
            lang={lang}
            onLanguage={() => setSheet('language')}
            onEnter={(m) => {
              setMode(table ? 'dine' : m)
              setEntered(true)
            }}
          />
        )}

        <div {...menuSwipe} ref={scrollRef} inert={!entered || page !== null} onScroll={onScroll} className={`no-scrollbar h-full overflow-y-auto ${count > 0 ? 'pb-28' : 'pb-6'}`}>
          {(readonly || storeState === 'closed' || storeState === 'offline') && <div role="status" className="relative z-10 bg-pending-soft px-5 py-3 text-center text-callout font-medium text-pending">{storeState === 'closed' ? (uiText(lang, 'the_store_is_closed_and_cannot_take_or_42d99')) : storeState === 'offline' ? (uiText(lang, 'the_store_is_offline_and_cannot_take_o_55628')) : (uiText(lang, 'menu_browsing_only_f84fe'))}</div>}
          {/* Hero */}
          <header className="relative z-0 bg-brand-wash sm:pointer-fine:pt-11">
              <div className="relative aspect-[16/9] overflow-hidden bg-tile">
              <img src={HOME_HERO} fetchPriority="high" width={960} height={534} alt="" className="h-full w-full object-cover" />
              <div className="home-banner-copy" aria-label={t(strings.restaurant)}>
                <strong className={lang === 'en' ? 'home-banner-name is-english' : 'home-banner-name'}>{t(strings.restaurant)}</strong>
                <span className="home-banner-subtitle">{{en:'HK CAFE · SINCE 1997', hk:'港式茶餐廳 · 始於 1997', zh:'港式茶餐厅 · 始于 1997'}[lang]}</span>
                <span className="home-banner-left">{{en:'CHAR SIU & EGG RICE', hk:'經典叉燒煎蛋飯', zh:'经典叉烧煎蛋饭'}[lang]}</span>
                <span className="home-banner-right">{{en:'PORK CHOP RICE & LEMON TEA', hk:'豬扒飯配凍檸茶', zh:'猪扒饭配冻柠茶'}[lang]}</span>
              </div>
              {!table && <button type="button" aria-label={t(strings.backHome)} onClick={() => { setEntered(false); setActive('all'); scrollRef.current?.scrollTo({ top: 0 }) }} className="absolute top-3 left-3 grid size-11 place-items-center text-white drop-shadow-md sm:pointer-fine:top-14">
                <ChevronLeft className="size-6" aria-hidden="true" />
              </button>}
              <div className="absolute top-3 right-4 flex h-11 items-center gap-0.5 rounded-full border border-white/20 bg-black/25 p-0.5 backdrop-blur-md">
                <IconButton variant="image" label={t(strings.orders)} badge={rounds.length ? 1 : 0} onClick={() => setPage('my-orders')}>
                  <ReceiptText className="size-4.5" />
                </IconButton>
                <span className="h-5 w-px shrink-0 bg-white/30" aria-hidden="true" />
                <IconButton variant="image" label={t(strings.language)} onClick={() => setSheet('language')}>
                  <Globe className="size-4.5" />
                </IconButton>
              </div>
            </div>
          </header>

          {!table && <section className="relative z-10 bg-white px-5 pt-6 pb-1 max-[359px]:px-4">
            <div className="relative flex min-h-10 items-center justify-between gap-2">
              <h1 className="min-w-0 text-hero font-semibold tracking-[-0.02em]">{t(strings.restaurant)}</h1>
              {!table && !rounds.length && request?.status !== 'waiting' && <div role="group" aria-label={t(strings.switchMode)} className="grid shrink-0 auto-cols-fr grid-flow-col items-center gap-2">
                {([
                  ['dine', strings.dineIn],
                  ['takeaway', strings.takeaway],
                ] as const).map(([value, label]) => (
                  <OptionChip key={value} active={mode === value} onClick={() => setMode(value)} className="min-w-16 px-3">{t(label)}</OptionChip>
                ))}
              </div>}
            </div>
          </section>}

          {table && (
            <div className="mx-5 mt-3">
              <div className="member-entry flex min-h-18 items-center justify-between gap-3 rounded-card border border-line bg-white p-4">
                <button type="button" onClick={() => setPage('member')} className="flex min-h-11 min-w-0 flex-1 items-center gap-3 text-left active:opacity-70">
                  <img src={HOME_AVATAR} alt="" className="size-10 shrink-0 rounded-full object-cover" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-callout font-semibold">{memberLoggedIn && member ? member.name : uiText(lang, 'welcome_please_sign_in_3b8ad')}</span>
                    <span className="mt-1 block text-caption text-ink-2">{memberLoggedIn ? (uiText(lang, 'member_7930b')) : (uiText(lang, 'member_benefits_a61a2'))}</span>
                  </span>
                  <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-ink-2" />
                </button>
                <button type="button" aria-label={uiText(lang, 'switch_table_7b2a0')} onClick={() => setToast(uiText(lang, 'scan_the_qr_code_on_your_new_table_to__cb2aa'))} className="flex min-h-11 shrink-0 items-center justify-end border-l border-line pl-3 text-right text-ink active:opacity-70">
                  <span className="text-headline font-semibold tabular-nums">{table}</span>
                </button>
              </div>
            </div>
          )}

          {/* Sticky category pills */}
          <nav ref={categoryNavRef} aria-label={t(strings.categories)} className={`sticky top-0 z-20 mt-3 flex items-center bg-white px-5 py-1 transition-shadow sm:pointer-fine:top-11 ${categoryPinned ? 'shadow-divider' : ''}`}>
            <div className="z-10 flex shrink-0 items-center bg-white pr-2">
              <button type="button" aria-label={t(strings.search)} onClick={() => setPage('search')} className="-ml-2.5 grid size-11 shrink-0 place-items-center text-ink transition-opacity active:opacity-60">
                <Search className="size-6" aria-hidden="true" />
              </button>
              <button type="button" aria-pressed={active === 'all'} aria-current={active === 'all' ? 'true' : undefined} onClick={() => scrollTo('all')} className={categoryPillClass(active === 'all')}><span className={`flex h-9 items-center rounded-full px-4 ${active === 'all' ? 'bg-brand-soft text-brand-strong' : ''}`}>{t(strings.all)}</span></button>
            </div>
            <div ref={categoryTabsRef} data-horizontal-scroll className="no-scrollbar flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
              {categories.map((c) => (
                <button key={c.id} type="button" aria-pressed={active === c.id} aria-current={active === c.id ? 'true' : undefined} onClick={() => scrollTo(c.id)} className={categoryPillClass(active === c.id)}><span className={`flex h-9 items-center rounded-full px-4 ${active === c.id ? 'bg-brand-soft text-brand-strong' : ''}`}>{t(c.name)}</span></button>
              ))}
            </div>
          </nav>

          {categories.map((c) => (
            <section
              key={c.id}
              ref={(el) => {
                sectionRefs.current[c.id] = el
              }}
              className="px-5 pt-2 max-[359px]:px-3"
            >
              <h2 className="mb-3 font-serif text-title font-bold">{t(c.name)}</h2>
              <div className="grid grid-cols-2 gap-3 max-[359px]:gap-x-2">
                {dishes
                  .filter((d) => d.category === c.id)
                  .map((d) => (
                    <DishCard
                      key={d.id}
                      dish={d}
                      lang={lang}
                      qty={qtyByDish[d.id] ?? 0}
                      ordered={orderedByDish[d.id] ?? 0}
                      onOpen={() => setPage({ dish: d })}
                      onAdd={() => quickAdd(d)}
                    />
                  ))}
              </div>
            </section>
          ))}
        </div>

        {entered && !page && count > 0 && <CartBar count={count} total={quote.total / 100} lang={lang} bump={bump} onOpen={() => request?.status === 'waiting' ? setPage('orders') : setSheet('cart')} />}

        {/* ---------- Full-screen pages ---------- */}
        {page === 'search' && (
          <SearchOverlay
            lang={lang}
            qtyOf={(id) => qtyByDish[id] ?? 0}
            orderedOf={(id) => orderedByDish[id] ?? 0}
            onClose={() => setPage(null)}
            onOpen={(d) => setPage({ dish: d })}
            onAdd={quickAdd}
          />
        )}

        {page && typeof page === 'object' && (
          <DishPage
            key={page.dish.id}
            dish={page.dish}
            lang={lang}
            ordered={orderedByDish[page.dish.id] ?? 0}
            cartLines={lines.filter(line => line.dish.id === page.dish.id)}
            onClose={() => setPage(null)}
            onAdd={(opts, note, qty, originalKey) => {
              if (!canOrder) { setToast(lockedMessage); setPage(null); return }
              if (originalKey) {
                const key = lineKey(page.dish.id, opts, note)
                setLines(current => {
                  const remaining = current.filter(line => line.key !== originalKey)
                  const match = remaining.find(line => line.key === key)
                  return match ? remaining.map(line => line.key === key ? { ...line, qty: line.qty + qty } : line) : [...remaining, { key, dish: page.dish, opts, note: note.trim(), qty }]
                })
              } else addLine(page.dish, opts, note, qty)
              setPage(null)
              setToast(originalKey ? ({ en: 'Changes saved', hk: '已儲存修改', zh: '已保存修改' }[lang]) : t(strings.added))
            }}
          />
        )}

        {page === 'member' && <MemberPage lang={lang} member={member} loggedIn={memberLoggedIn} onRegister={(next) => { setMember(next); setMemberLoggedIn(true); setToast(uiText(lang, 'membership_ready_4f377')) }} onLogout={() => setMemberLoggedIn(false)} onClose={() => setPage(null)} />}

        <div className="contents" inert={paymentResult !== null || tablePaymentOpen}>
          {(page === 'confirm' || (tablePaymentOpen && pendingRound)) && (
            <ConfirmPage
              lines={lines}
              expiresAt={pendingRound && !tablePaymentOpen && !paymentResult ? prepayExpiresAt : null}
              onCancelPayment={() => { setPaymentResult({ kind: 'cancelled' }); setPage('confirm') }}
              quote={pendingRound?.quote ?? reviewQuote ?? quote}
              repriced={repriced}
              mode={mode}
              lang={lang}
              isAddOn={rounds.length > 0}
              previousRounds={rounds}
              payments={payments}
              contact={contact}
              table={table}
              setContact={setContact}
              guests={guests}
              setGuests={setGuests}
              tablePrepay={!!table && prepay}
              orderNote={orderNote}
              setOrderNote={setOrderNote}
              onSwitchTable={() => setToast(uiText(lang, 'scan_the_qr_code_on_your_new_table_to__cb2aa'))}
              onAddMore={() => setPage(null)}
              prepay={prepay && online}
              setMode={(next) => { setMode(next); setReviewQuote(quoteCart(lines, { ...pricingOptions, mode: next })); setRepriced(false) }}
              onBack={() => {
                if (pendingRound && prepayExpiresAt) { setSheet('leave-payment'); return }
                setPage(null)
                setSheet('cart')
              }}
              onSubmit={submitOrder}
            />
          )}

          {page === 'my-orders' && <MyOrders rounds={request ? [request.round] : rounds} status={request?.status ?? (rounds.length ? 'accepted' : null)} total={request ? calculateBill([request.round], payments).total : bill.total} paid={bill.paid} settled={settled} manualSettlement={manualSettlement} table={table} canAddDishes={canOrder} lang={lang} onClose={() => setPage(null)} onDetails={() => { setDetailFromList(true); setPage('orders') }} onAddMore={() => setPage(null)} />}

          {(page === 'orders' || (tablePaymentOpen && !pendingRound)) && (
            <OrderDetail
              rounds={request ? [request.round] : rounds}
              bill={request ? calculateBill([request.round], payments) : bill}
              payments={payments}
              animateSuccess={animateOrderSuccess}
              lastPaidAmount={lastPaidAmount}
              mode={rounds[0]?.mode ?? mode}
              orderNo={ORDER_NO}
              pickup={PICKUP}
              receiptNo={RECEIPT_NO}
              lang={lang}
              status={request?.status ?? (rounds.length ? 'accepted' : null)}
              table={table}
              tablePrepay={!!table && prepay}
              guests={guests}
              orderNote={orderNote}
              online={online}
              canAddDishes={!!table && canOrder}
              manualSettlement={manualSettlement}
              settled={settled}
              onSettle={() => setSettled(true)}
              onAccept={() => {
                if (request?.status === 'waiting') acceptOrder(request.round)
              }}
              onReject={() => {
                if (request?.status === 'waiting') setRequest({ ...request, status: 'cancelled' })
              }}
              onClose={() => {
                setLastPaidAmount(null)
                setAnimateOrderSuccess(false)
                setPage(detailFromList ? 'my-orders' : null)
                setDetailFromList(false)
              }}
              onAddMore={() => {
                if (!table || !canOrder) return
                setLastPaidAmount(null)
                setAnimateOrderSuccess(false)
                setDetailFromList(false)
                setPage(null)
              }}
              onPay={() => {
                if (!request && rounds.length && bill.remaining > 0) {
                  setLastPaidAmount(null)
                  setAnimateOrderSuccess(false)
                  setPage('pay')
                }
              }}
              onFinish={table ? () => setPage(null) : resetSession}
            />
          )}
        </div>

        {(paymentResult || (page === 'pay' && (pendingRound || bill.remaining > 0))) && (
          <PaymentFlow
            key={paymentAttempt}
            resultSheet={paymentResult ? (
              <PaymentResultSheet
                result={paymentResult}
                expiresAt={pendingRound ? prepayExpiresAt : null}
                cancelledOrder={paymentResult.kind === 'cancelled' && !!pendingRound && !!table}
                lang={lang}
                orderNo={ORDER_NO}
                onClose={() => {
                  setPaymentResult(null)
                  if (paymentResult.kind === 'expired' || (paymentResult.kind === 'cancelled' && pendingRound && table)) { setPendingRound(null); setPrepayExpiresAt(null); setLines([]); setReviewQuote(null); setPage(null) }
                }}
                onRetry={paymentResult.kind !== 'success' && paymentResult.kind !== 'expired' && !(paymentResult.kind === 'cancelled' && pendingRound && table) && (pendingRound || bill.remaining > 0) && (!prepayExpiresAt || Date.now() < prepayExpiresAt) ? () => {
                  setPaymentResult(null)
                  setPaymentAttempt((attempt) => attempt + 1)
                  setPage('pay')
                } : undefined}
              />
            ) : undefined}
            expiresAt={pendingRound ? prepayExpiresAt : null}
            onExpired={() => { setPaymentResult({ kind: 'expired' }); setPage('confirm') }}
            balance={pendingRound ? pendingRound.quote.total / 100 : bill.remaining}
            gateway={gateway || !!table}
            direct={!!table}
            directSessionKey={table ? paymentSessionKey : undefined}
            persistentAttempt={!!table && prepay}
            onFailure={table ? (kind) => {
              if (pendingRound) {
                sessionStore.removeItem(paymentSessionKey)
                setPaymentResult(prepayExpiresAt && Date.now() >= prepayExpiresAt ? { kind: 'expired' } : null)
                setPage('confirm')
              } else { setPaymentResult({ kind }); setPage('orders') }
            } : undefined}
            tipsEnabled={storeRules.tips}
            orderNo={ORDER_NO}
            lang={lang}
            onBack={() => { if (pendingRound) { setPendingRound(null); setPage('confirm') } else setPage('orders') }}
            onSuccess={(payment) => {
              const principal = toCents(payment.amount) - payment.tip
              const expected = pendingRound?.quote.total ?? toCents(bill.remaining)
              if (payment.orderNo !== ORDER_NO || payment.tip < 0 || principal <= 0 || principal > expected || ((table || pendingRound) && principal !== expected)) return
              setPayments((previous) => previous.some(({ id }) => id === payment.id) ? previous : [...previous, payment])
              if (pendingRound) {
                acceptOrder(pendingRound)
                setPendingRound(null)
                setPrepayExpiresAt(null)
                setLines([])
                setCoupon(null)
                setCouponNotice(null)
              }
              if (table) {
                if (pendingRound) { sessionStore.removeItem(paymentSessionKey); setPaymentResult(null) }
                else setPaymentResult({ kind: 'success', amount: payment.amount })
                setPage('orders')
              } else {
                setSettled(true)
                setLastPaidAmount(payment.amount)
                setPage('orders')
              }
            }}
          />
        )}

        {/* ---------- Sheets ---------- */}
        {sheet === 'leave-payment' && (
          <BottomSheet title={uiText(lang, 'leave_payment_788c0')} onClose={() => setSheet(null)} footer={<div className="flex gap-3"><Button variant="secondary" className="flex-1" onClick={() => setSheet(null)}>{uiText(lang, 'keep_waiting_c27e1')}</Button><Button className="flex-1" onClick={() => { setSheet(null); setPaymentResult({ kind: 'cancelled' }); setPage('confirm') }}>{uiText(lang, 'cancel_order_aba37')}</Button></div>}>
            <p className="text-callout text-ink-2">{uiText(lang, 'your_order_is_awaiting_payment_you_can_dec85')}</p>
          </BottomSheet>
        )}
        {sheet === 'language' && (
          <BottomSheet title={t(strings.language)} onClose={() => setSheet(null)}>
            <div className="space-y-2">
              {LANGS.map((l) => (
                <ChoiceRow
                  key={l.code}
                  lang={l.attr}
                  active={lang === l.code}
                  leading={l.short}
                  onClick={() => {
                    setLang(l.code)
                    localStorage.setItem('ordering-language', l.code)
                    setSheet(null)
                  }}
                >
                  {l.name}
                </ChoiceRow>
              ))}
            </div>
          </BottomSheet>
        )}

        {sheet === 'cart' && (
          <BottomSheet
            title={t(strings.cart)}
            titleAccessory={<span className={tagClass('brand')}>{mode === 'dine' ? <UtensilsCrossed className="size-3.5" /> : <ShoppingBag className="size-3.5" />}{mode === 'dine' ? t(strings.dineIn) : t(strings.takeaway)}</span>}
            onClose={() => setSheet(null)}
            headerActions={lines.length > 0 && (
              <TextButton tone="muted" className="gap-1.5 rounded-full px-2.5 active:bg-tile" onClick={() => setLines([])}>
                <Trash2 className="size-4" />
                {t(strings.clear)}
              </TextButton>
            )}
            footer={
              lines.length > 0 && (
                <div className="flex items-center gap-4">
                  <div className="shrink-0">
                    <p aria-label={`${t(strings.total)} ${money(quote.total / 100)}`} className="text-title font-semibold tabular-nums">{money(quote.total / 100)}</p>
                  </div>
                  <Button
                    onClick={() => {
                      setReviewQuote(quote)
                      setRepriced(false)
                      setSheet(null)
                      setPage('confirm')
                    }}
                    className="flex-1"
                  >
                    {t(strings.continueOrder)}
                  </Button>
                </div>
              )
            }
          >
            {lines.length === 0 ? (
              <Empty title={t(strings.emptyCart)} />
            ) : (
              <>
                <ul className="confirm-items">
                  {lines.map((l) => (
                    <CartRow key={l.key} line={l} lang={lang} amount={quote.rows[l.key]}>
                      <Stepper qty={l.qty} onMinus={() => changeLine(l.key, -1)} onPlus={() => changeLine(l.key, 1)} />
                    </CartRow>
                  ))}
                </ul>
                <div className="cart-amount-section">
                  <OrderAmounts quote={quote} total={quote.total / 100} remaining={quote.total / 100} lang={lang} showSummary={false} />
                </div>
              </>
            )}
          </BottomSheet>
        )}

        {sheet === 'categories' && (
          <BottomSheet title={t(strings.categories)} onClose={() => setSheet(null)}>
            <ul className="divide-y divide-line">
              {categories.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => {
                      setSheet(null)
                      setTimeout(() => scrollTo(c.id), 50)
                    }}
                    className="flex w-full items-center gap-3 py-3 text-left"
                  >
                    <Thumb src={c.thumb} />
                    <span className="min-w-0 flex-1 text-body font-medium">{t(c.name)}</span>
                    <ChevronRight className="size-4 text-muted" />
                  </button>
                </li>
              ))}
            </ul>
          </BottomSheet>
        )}

        {toast && (
          <div className="animate-pop absolute inset-x-0 top-14 z-[60] flex justify-center px-5">
            <div className="flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-callout text-white shadow-float">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-brand">
                <Check className="size-3" strokeWidth={3} />
              </span>
              {toast}
            </div>
          </div>
        )}
      </div>
    </div></LanguageContext.Provider>
  )
}

function StatusBar({ dark, solid }: { dark: boolean; solid: boolean }) {
  return (
    <div
      className={`pointer-events-none absolute inset-x-0 top-0 z-[55] hidden h-11 items-center justify-between px-8 pt-1 font-sans text-body font-semibold transition-colors duration-200 sm:pointer-fine:flex ${
        dark ? 'text-ink' : 'text-white'
      } ${solid ? 'bg-white' : ''}`}
    >
      <span>9:41</span>
      <span className="flex items-center gap-1.5">
        <Signal className="size-4" strokeWidth={2.5} />
        <Wifi className="size-4" strokeWidth={2.5} />
        <span className="relative flex h-3 w-6 items-center rounded-[4px] border-[1.5px] border-current p-[1.5px] opacity-90">
          <span className="h-full w-[75%] rounded-[1.5px] bg-current" />
        </span>
      </span>
    </div>
  )
}

