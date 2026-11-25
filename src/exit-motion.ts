import { useEffect, useRef } from 'react'

export function useExitMotion(onExit: (() => void) | undefined, direction: 'right' | 'down') {
  const panel = useRef<HTMLDivElement>(null)
  const backdrop = useRef<HTMLDivElement>(null)
  const animation = useRef<Animation | null>(null)
  const fade = useRef<Animation | null>(null)
  const latestExit = useRef(onExit)
  latestExit.current = onExit

  useEffect(() => () => {
    animation.current?.cancel()
    fade.current?.cancel()
  }, [])

  const dismiss = () => {
    const element = panel.current
    if (!latestExit.current || animation.current) return
    if (!element?.animate || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      latestExit.current()
      return
    }

    const exit = direction === 'right' ? 'translateX(100%)' : 'translateY(100%)'
    const timing = { duration: 220, easing: 'cubic-bezier(0.4, 0, 1, 1)', fill: 'forwards' } as const
    const motion = element.animate([{ transform: getComputedStyle(element).transform }, { transform: exit }], timing)
    const wasInert = element.inert
    element.inert = true
    animation.current = motion
    fade.current = backdrop.current?.animate([{ opacity: getComputedStyle(backdrop.current).opacity }, { opacity: 0 }], timing) ?? null
    motion.onfinish = () => {
      latestExit.current?.()
      // Some back actions open a sheet on top of this page, leaving the page mounted.
      requestAnimationFrame(() => {
        if (animation.current !== motion) return
        animation.current = null
        element.inert = wasInert
        motion.cancel()
        fade.current?.cancel()
        fade.current = null
      })
    }
  }

  return { panel, backdrop, dismiss }
}
