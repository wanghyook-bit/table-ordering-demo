import { useEffect, useRef, type TouchEvent } from 'react'

type BackHandler = { priority: number; sequence: number; action: () => void }
const backHandlers = new Set<BackHandler>()
let handlerSequence = 0

export function useBrowserBack() {
  useEffect(() => {
    const addGuard = () => window.history.pushState({ ...window.history.state, h5BackGuard: true }, '')
    if (!window.history.state?.h5BackGuard) addGuard()
    const onPopState = () => {
      const handler = [...backHandlers].sort((first, second) => second.priority - first.priority || second.sequence - first.sequence)[0]
      if (!handler) return
      addGuard()
      handler.action()
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])
}

function useBackHandler(action: (() => void) | undefined, priority: number) {
  const latest = useRef(action)
  latest.current = action
  const enabled = action !== undefined
  useEffect(() => {
    if (!enabled) return
    const handler: BackHandler = { priority, sequence: ++handlerSequence, action: () => latest.current?.() }
    backHandlers.add(handler)
    return () => { backHandlers.delete(handler) }
  }, [enabled, priority])
}

export function useBackSwipe(onBack?: () => void, blockBrowserBack = false) {
  useBackHandler(onBack ?? (blockBrowserBack ? () => {} : undefined), 10)
  const start = useRef<{ x: number; y: number; edge: boolean; horizontal: boolean } | null>(null)
  useEffect(() => {
    const preventHorizontalScroll = (event: globalThis.TouchEvent) => {
      if (!start.current || event.touches.length !== 1) return
      const dx = event.touches[0].clientX - start.current.x
      const dy = event.touches[0].clientY - start.current.y
      const backDirection = dx < 0 || (start.current.edge && dx > 0)
      if (backDirection && Math.abs(dx) >= 18 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        start.current.horizontal = true
      }
      if (start.current.horizontal && event.cancelable) event.preventDefault()
    }
    document.addEventListener('touchmove', preventHorizontalScroll, { passive: false })
    return () => document.removeEventListener('touchmove', preventHorizontalScroll)
  }, [])
  return {
    onTouchStart: (event: TouchEvent<HTMLElement>) => {
      start.current = null
      if (!onBack || event.touches.length !== 1) return
      const target = event.target as HTMLElement
      if (target.closest('input, textarea, select, [data-horizontal-scroll]')) return
      const touch = event.touches[0]
      const bounds = event.currentTarget.getBoundingClientRect()
      const left = touch.clientX - bounds.left
      start.current = { x: touch.clientX, y: touch.clientY, edge: left <= 24, horizontal: false }
    },
    onTouchEnd: (event: TouchEvent<HTMLElement>) => {
      if (!start.current || !onBack) return
      const touch = event.changedTouches[0]
      const dx = touch.clientX - start.current.x
      const dy = touch.clientY - start.current.y
      if (Math.abs(dx) >= 70 && Math.abs(dx) > Math.abs(dy) * 1.5 && (dx < 0 || (start.current.edge && dx > 0))) {
        event.stopPropagation()
        onBack()
      }
      start.current = null
    },
    onTouchCancel: () => { start.current = null },
  }
}

export function useSheetSwipe(onClose: () => void, onExpand: () => void) {
  useBackHandler(onClose, 20)
  const start = useRef<{ x: number; y: number } | null>(null)
  return {
    onTouchStart: (event: TouchEvent<HTMLElement>) => {
      event.stopPropagation()
      start.current = null
      const target = event.target as HTMLElement
      if (!target.closest('[data-sheet-handle]') || target.closest('button, input, textarea, select')) return
      if (event.touches.length === 1) start.current = { x: event.touches[0].clientX, y: event.touches[0].clientY }
    },
    onTouchEnd: (event: TouchEvent<HTMLElement>) => {
      event.stopPropagation()
      if (!start.current) return
      const dx = event.changedTouches[0].clientX - start.current.x
      const dy = event.changedTouches[0].clientY - start.current.y
      if (Math.abs(dy) > 70 && Math.abs(dy) > Math.abs(dx) * 1.5) {
        if (dy > 0) onClose()
        else onExpand()
      }
      start.current = null
    },
    onTouchCancel: () => { start.current = null },
  }
}
