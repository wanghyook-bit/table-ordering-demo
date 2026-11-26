import { allOptions, dishOptions, type Dish, type Lang, type Option, type OptionGroup } from './data'

export type CartLine = { key: string; dish: Dish; opts: string[]; note: string; qty: number }

export const lineKey = (dishId: string, opts: string[], note: string) => `${dishId}|${[...opts].sort().join(',')}|${note.trim()}`
export const unitPrice = (dish: Dish, opts: string[]) => dish.price + opts.reduce((s, id) => s + (allOptions[id]?.price ?? 0), 0)
export const isCustomizable = (dish: Dish) => (dishOptions[dish.id] ?? []).some((group) => group.options.length > 0)
export const optionBounds = (group: OptionGroup) => ({
  min: group.min ?? (group.type === 'single' && group.options.length ? 1 : 0),
  max: group.max ?? (group.type === 'single' ? 1 : group.options.length),
})

export function optsLabel(opts: string[], note: string, lang: Lang) {
  const selected = opts.map((id) => allOptions[id]).filter(Boolean)
  const selectedIds = new Set(opts)
  const childIds = new Set(selected.flatMap((option) => (option.groups ?? []).flatMap((group) => group.options.map(({ id }) => id))))
  const formatOption = (option: Option): string => {
    const modifiers = (option.groups ?? []).flatMap((group) =>
      group.options.filter(({ id }) => selectedIds.has(id)).map(formatOption),
    )
    const label = option.name[lang]
    if (!modifiers.length) return label
    return lang === 'en' ? `${label} (${modifiers.join(', ')})` : `${label}（${modifiers.join('、')}）`
  }
  return [...selected.filter(({ id }) => !childIds.has(id)).map(formatOption), note.trim()].filter(Boolean).join(' · ')
}
