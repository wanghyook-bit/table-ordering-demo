import { allOptions, dishOptions, type Dish, type Lang } from './data'

export type CartLine = { key: string; dish: Dish; opts: string[]; note: string; qty: number }

export const lineKey = (dishId: string, opts: string[], note: string) => `${dishId}|${[...opts].sort().join(',')}|${note.trim()}`
export const unitPrice = (dish: Dish, opts: string[]) => dish.price + opts.reduce((s, id) => s + (allOptions[id]?.price ?? 0), 0)
export const isCustomizable = (dish: Dish) => (dishOptions[dish.id] ?? []).some((group) => group.options.length > 0)
export const optsLabel = (opts: string[], note: string, lang: Lang) =>
  [...opts.map((id) => allOptions[id]?.name[lang]).filter(Boolean), note.trim()].filter(Boolean).join(' · ')
