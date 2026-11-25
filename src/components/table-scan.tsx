import { useRef, useState } from 'react'
import { ArrowRight, QrCode, Scan } from 'lucide-react'
import type { Lang } from '../data'
import { uiText } from '../i18n'
import { BottomSheet, Button } from './ui'

export function TableScanSheet({ lang, table, canSwitch, onClose, onConfirm }: {
  lang: Lang
  table: string
  canSwitch: boolean
  onClose: () => void
  onConfirm: (table: string) => void
}) {
  const [scannedTable, setScannedTable] = useState<string | null>(null)
  const actions = useRef<HTMLDivElement>(null)

  if (!canSwitch) {
    return (
      <BottomSheet modal title={uiText(lang, 'switch_table_7b2a0')} onClose={onClose}>
        <p className="text-callout text-ink-2">{uiText(lang, 'table_switch_requires_staff')}</p>
      </BottomSheet>
    )
  }

  return (
    <BottomSheet
      modal
      title={uiText(lang, 'scan_table_qr')}
      onClose={onClose}
      footer={
        <div ref={actions} className="flex gap-3">
          {scannedTable && (
            <Button variant="secondary" className="flex-1" onClick={() => {
              setScannedTable(null)
              actions.current?.querySelector<HTMLButtonElement>('button:last-child')?.focus()
            }}>
              {uiText(lang, 'scan_again')}
            </Button>
          )}
          <Button
            className="flex-1"
            onClick={() => scannedTable ? onConfirm(scannedTable) : setScannedTable(table === 'A09' ? 'A08' : 'A09')}
          >
            {uiText(lang, scannedTable ? 'confirm_table_switch' : 'simulate_table_scan')}
          </Button>
        </div>
      }
    >
      <div role="status">
        {scannedTable ? (
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-card border border-line bg-tile px-4 py-5">
            <dl className="min-w-0">
              <dt className="text-callout text-ink-2">{uiText(lang, 'current_table')}</dt>
              <dd className="mt-1 text-title font-semibold break-all tabular-nums">{table}</dd>
            </dl>
            <ArrowRight className="size-5 shrink-0 text-muted" aria-hidden="true" />
            <dl className="min-w-0 text-right">
              <dt className="text-callout text-ink-2">{uiText(lang, 'new_table')}</dt>
              <dd className="mt-1 text-title font-semibold text-action tabular-nums">{scannedTable}</dd>
            </dl>
          </div>
        ) : (
          <>
            <div className="relative grid h-44 place-items-center rounded-card bg-ink text-white" aria-hidden="true">
              <Scan className="col-start-1 row-start-1 size-32 text-white/80" strokeWidth={0.65} />
              <QrCode className="col-start-1 row-start-1 size-14 text-white/65" strokeWidth={1.5} />
              <span className="col-start-1 row-start-1 h-px w-24 bg-action" />
            </div>
            <p className="mt-3 text-center text-callout text-ink-2">{uiText(lang, 'scan_the_qr_code_on_your_new_table_to__cb2aa')}</p>
          </>
        )}
      </div>
    </BottomSheet>
  )
}
