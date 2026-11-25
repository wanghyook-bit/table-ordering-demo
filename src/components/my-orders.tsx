import { uiText } from '../i18n'
import { strings, type Lang } from '../data'
import { Button, DishImage, Empty, money, Page, Tag } from './ui'
import { formatOrderTime, itemCount, orderDisplayState, type Round } from './orders'

type Status = 'waiting' | 'accepted' | 'cancelled' | null

export function MyOrders({ rounds, status, total, paid, settled, manualSettlement, table, canAddDishes, lang, onClose, onDetails, onAddMore, backDisabled = false }: {
  rounds: Round[]; status: Status; total: number; paid: number; settled: boolean; manualSettlement: boolean;
  table: string | null; canAddDishes: boolean; lang: Lang; onClose: () => void; onDetails: () => void; onAddMore: () => void
  backDisabled?: boolean
}) {
  const lines = rounds.flatMap(round => round.lines)
  const count = itemCount(lines)
  const state = status ? orderDisplayState(status, total <= paid, !!table && manualSettlement && !settled, lang) : null
  const images = lines.flatMap(line => Array.from({ length: Math.min(line.qty, 5) }, () => line)).slice(0, 5)
  const orderTime = formatOrderTime(rounds[0])
  return <Page className="my-orders-page" title={strings.orders[lang]} onBack={onClose} backDisabled={backDisabled}>
    {!state ? <Empty title={strings.noOrders[lang]} /> : <section className="my-orders-card">
      <div className="my-orders-heading"><h2>{strings.restaurant[lang]}</h2><Tag tone={state.tone}>{state.label}</Tag></div>
      <div className="my-orders-images">{images.map((line, index) => <DishImage key={`${index}-${line.key}`} src={line.dish.image} dishId={line.dish.id} alt={line.dish.name[lang]} className="my-orders-image" />)}</div>
      {orderTime && <div className="my-orders-time"><span>{uiText(lang, 'order_time_38773')}</span><time dateTime={rounds[0]?.createdAt}>{orderTime}</time></div>}
      <div className="my-orders-total"><span>{lang === 'en' ? `${count} ${count === 1 ? 'item' : 'items'}` : `共 ${count} 件`}</span><strong>{money(total)}</strong></div>
      <div className="my-orders-actions">{table && canAddDishes && status === 'accepted' && <Button size="md" variant="secondary" onClick={onAddMore}>{strings.addDishes[lang]}</Button>}<Button size="md" onClick={onDetails}>{uiText(lang, 'view_details_fe8b1')}</Button></div>
    </section>}
  </Page>
}
