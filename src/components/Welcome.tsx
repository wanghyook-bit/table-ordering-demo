import { ArrowRight, Globe, ShoppingBag, UtensilsCrossed } from 'lucide-react'
import { HERO, strings, type Lang } from '../data'
import { Button, LANGS } from './ui'

export type Mode = 'dine' | 'takeaway'

/** Full-bleed entry: restaurant name + two entries. Choosing one enters the menu directly. */
export function Welcome({ lang, onLanguage, onEnter }: { lang: Lang; onLanguage: () => void; onEnter: (m: Mode) => void }) {
  const t = (s: { en: string; hk: string; zh: string }) => s[lang]
  return (
    <div className="absolute inset-0 z-[45] overflow-hidden bg-ink text-white">
      <img src={HERO} fetchPriority="high" alt="Warm restaurant interior" className="absolute inset-0 h-full w-full scale-[1.15] object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/25 to-black/85" />

      <button
        onClick={onLanguage}
        aria-label={t(strings.language)}
        className="absolute top-3 right-5 flex h-11 items-center gap-1 rounded-full bg-black/30 px-4 text-callout font-medium backdrop-blur-md focus-visible:outline-brand-soft sm:pointer-fine:top-12"
      >
        <Globe className="size-4" />
        {LANGS.find((l) => l.code === lang)!.short}
      </button>

      <div className="absolute inset-x-0 bottom-0 px-5 pb-[clamp(64px,12dvh,112px)]">
        <p className="text-caption tracking-[0.24em] text-white/70 uppercase">{t(strings.meta)}</p>
        <h1 className="mt-3 font-serif text-display-lg font-bold tracking-wide">{t(strings.restaurant)}</h1>
        <div className="mt-8 mb-6 h-px w-12 bg-white/40" />
        <div className="grid grid-cols-2 gap-3">
          <Button onClick={() => onEnter('dine')} className="min-h-15! justify-between max-[359px]:px-3">
            <span className="flex items-center gap-2">
              <UtensilsCrossed className="size-4.5" />
              {t(strings.dineIn)}
            </span>
            <ArrowRight className="size-4" />
          </Button>
          <Button variant="warm" onClick={() => onEnter('takeaway')} className="min-h-15! justify-between max-[359px]:px-3">
            <span className="flex items-center gap-2">
              <ShoppingBag className="size-4.5" />
              {t(strings.takeaway)}
            </span>
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
