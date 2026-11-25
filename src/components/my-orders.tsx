import { uiText } from '../i18n'
import { strings, type Lang } from '../data'
import { Button, DishImage, Empty, money, Page } from './ui'
import { formatOrderTime, itemCount, type Round } from './orders'

type Status = 'waiting' | 'accepted' | 'cancelled' | null

export function MyOrders({ rounds, status, total, paid, settled, manualSettlement, table, canAddDishes, lang, onClose, onDetails, onAddMore }: {
  rounds: Round[]; status: Status; total: number; paid: number; settled: boolean; manualSettlement: boolean;
  table: string | null; canAddDishes: boolean; lang: Lang; onClose: () => void; onDetails: () => void; onAddMore: () => void
}) {
  const lines = rounds.flatMap(round => round.lines)
  const count = itemCount(lines)
  const completed = status === 'accepted' && total <= paid && (!table || !manualSettlement || settled)
  const label = status === 'waiting' ? (uiText(lang, 'awaiting_acceptance_be684'))
    : status === 'cancelled' ? (uiText(lang, 'cancelled_5899a'))
    : completed ? (uiText(lang, 'completed_f1a22'))
    : total <= paid ? (uiText(lang, 'paid_86900'))
    : (uiText(lang, 'awaiting_payment_99cbe'))
  const images = lines.flatMap(line => Array.from({ length: Math.min(line.qty, 5) }, () => line)).slice(0, 5)
  const orderTime = formatOrderTime(rounds[0])
  return <Page className="my-orders-page" title={strings.orders[lang]} onBack={onClose}>
    {!status ? <Empty title={strings.noOrders[lang]} /> : <section className="my-orders-card">
      <div className="my-orders-heading"><h2>{strings.restaurant[lang]}</h2><span className={completed ? 'my-orders-status complete' : 'my-orders-status'}>{label}</span></div>
      <div className="my-orders-images">{images.map((line, index) => <DishImage key={`${index}-${line.key}`} src={line.dish.image} alt={line.dish.name[lang]} className="my-orders-image" />)}</div>
      {orderTime && <div className="my-orders-time"><span>{uiText(lang, 'order_time_38773')}</span><time dateTime={rounds[0]?.createdAt}>{orderTime}</time></div>}
      <div className="my-orders-total"><span>{lang === 'en' ? `${count} ${count === 1 ? 'item' : 'items'}` : `共 ${count} 件`}</span><strong>{money(total)}</strong></div>
      <div className="my-orders-actions">{table && canAddDishes && status === 'accepted' && <Button variant="secondary" onClick={onAddMore}>{strings.addDishes[lang]}</Button>}<Button onClick={onDetails}>{uiText(lang, 'view_details_fe8b1')}</Button></div>
    </section>}
  </Page>
}
