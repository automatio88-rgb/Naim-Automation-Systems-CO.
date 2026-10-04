import { useRef, type RefObject } from 'react'
import { gsap, useGSAP, ScrollTrigger, motion, prefersReduced } from './gsap'

/** Page entrance: [data-reveal] children rise in, [data-scroll] blocks reveal as they scroll into view. */
export function useReveal(scope: RefObject<HTMLElement | null>, deps: unknown[] = []) {
  useGSAP(() => {
    const root = scope.current
    if (!root) return
    const items = gsap.utils.toArray<HTMLElement>(root.querySelectorAll('[data-reveal]:not([data-revealed])'))
    const later = gsap.utils.toArray<HTMLElement>(root.querySelectorAll('[data-scroll]:not([data-revealed])'))
    const reduced = prefersReduced()
    items.forEach((el) => el.setAttribute('data-revealed', ''))
    later.forEach((el) => el.setAttribute('data-revealed', ''))
    if (items.length) {
      if (reduced) gsap.fromTo(items, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.15 })
      else gsap.fromTo(items, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: motion.emphDecel, ease: 'md-emph-decel', stagger: 0.04, clearProps: 'transform' })
    }
    if (later.length) {
      gsap.set(later, { autoAlpha: 0, y: reduced ? 0 : 22 })
      ScrollTrigger.batch(later, {
        start: 'top 92%',
        once: true,
        onEnter: (batch) => gsap.to(batch, { autoAlpha: 1, y: 0, duration: reduced ? 0.15 : motion.emph, ease: 'md-emph-decel', stagger: 0.07, clearProps: 'transform' }),
      })
      ScrollTrigger.refresh()
    }
  }, { scope, dependencies: deps })
}

/** Numbers count up from their previous value when data changes. */
export function useCountUp(ref: RefObject<HTMLElement | null>, value: number, format: (n: number) => string) {
  const prev = useRef(0)
  useGSAP(() => {
    const el = ref.current
    if (!el) return
    if (prefersReduced() || prev.current === value) { el.textContent = format(value); prev.current = value; return }
    const o = { v: prev.current }
    gsap.to(o, { v: value, duration: 0.9, ease: 'power3.out', onUpdate: () => { el.textContent = format(o.v) } })
    prev.current = value
  }, { dependencies: [value] })
}

/** Bars grow from their origin (funnels, progress). Animates transform only. */
export function useGrow(scope: RefObject<HTMLElement | null>, selector: string, deps: unknown[], axis: 'x' | 'y' = 'x') {
  useGSAP(() => {
    const els = scope.current?.querySelectorAll(selector)
    if (!els?.length || prefersReduced()) return
    gsap.fromTo(els, axis === 'x' ? { scaleX: 0 } : { scaleY: 0 }, { scaleX: 1, scaleY: 1, transformOrigin: axis === 'x' ? 'left center' : 'center bottom', duration: 0.8, ease: 'md-emph-decel', stagger: 0.06 })
  }, { scope, dependencies: deps })
}