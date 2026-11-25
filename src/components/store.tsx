import { useEffect, useState } from 'react'
import { Clock, MapPin, Phone } from 'lucide-react'
import { strings, type L10n, type Lang } from '../data'
import { IconButton, Tag } from './ui'

const STORE = { lat: 22.2819, lng: 114.158, phone: '+85221234567' }

/** Distance from the guest to the store (geolocation; falls back to a typical walk-in distance). */
function useDistance(enabled: boolean) {
  const [km, setKm] = useState(0.35)
  useEffect(() => {
    if (!enabled || !navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const r = (d: number) => (d * Math.PI) / 180
        const a =
          Math.sin(r(coords.latitude - STORE.lat) / 2) ** 2 +
          Math.cos(r(STORE.lat)) * Math.cos(r(coords.latitude)) * Math.sin(r(coords.longitude - STORE.lng) / 2) ** 2
        setKm(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
      },
      () => {},
      { timeout: 4000 },
    )
  }, [enabled])
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`
}

export function StoreCard({ lang, showDistance }: { lang: Lang; showDistance: boolean }) {
  const t = (s: L10n) => s[lang]
  const distance = useDistance(showDistance)
  return (
    <div className="flex items-start gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-body font-semibold">{t(strings.restaurant)}</p>
        <p className="mt-0.5 text-callout text-muted">{t(strings.address)}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {showDistance && (
            <Tag>
              <MapPin className="size-3" />
              {distance}
            </Tag>
          )}
          <Tag tone="info">
            <Clock className="size-3" />
            {t(strings.pickupReadyEstimate)}
          </Tag>
        </div>
      </div>
      <IconButton label={t(strings.callStore)} onClick={() => (window.location.href = `tel:${STORE.phone}`)}>
        <Phone className="size-4.5 text-action" />
      </IconButton>
    </div>
  )
}
