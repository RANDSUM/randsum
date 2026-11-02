// What every React wrapper shares: set the element's properties after each
// render and listen for its events, so the same code runs on React 18 (which
// passes only attributes to custom elements) and React 19. Not a public entry.
import { createElement, useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import type { RefCallback } from 'react'

// useLayoutEffect warns during server rendering, where there is no element anyway
export const useLayoutEffectSafe: typeof useLayoutEffect =
  typeof document === 'undefined' ? useEffect : useLayoutEffect

type Listener = (event: Event) => void

/**
 * Returns a ref for the element. Each defined value in `properties` is
 * assigned to the element after every render (Lit skips unchanged values),
 * and each handler in `events` listens for its DOM event.
 */
export function useElement<E extends HTMLElement>(
  properties: Readonly<Record<string, unknown>>,
  events: Readonly<Record<string, Listener | undefined>> = {}
): { readonly ref: RefCallback<E>; readonly element: { readonly current: E | null } } {
  const element = useRef<E | null>(null)
  const handlers = useRef(events)
  handlers.current = events

  useLayoutEffectSafe(() => {
    const el = element.current
    if (el === null) return
    for (const [key, value] of Object.entries(properties)) {
      if (value !== undefined) Reflect.set(el, key, value)
    }
  })

  const names = Object.keys(events).sort().join(' ')
  useEffect(() => {
    const el = element.current
    if (el === null || names === '') return
    const bound = names.split(' ').map(name => {
      const listener: Listener = event => {
        handlers.current[name]?.(event)
      }
      el.addEventListener(name, listener)
      return () => {
        el.removeEventListener(name, listener)
      }
    })
    return () => {
      for (const off of bound) off()
    }
  }, [names])

  const ref = useCallback((el: E | null) => {
    element.current = el
  }, [])
  return { ref, element }
}

/** The detail of a CustomEvent, typed by the caller who knows the event. */
export function detail<T>(event: Event): T {
  if (!(event instanceof CustomEvent)) throw new TypeError('Expected a CustomEvent')
  const value: T = event.detail
  return value
}

/** A part element for React: its properties, plus the shared `roller`. */
export function renderPart(
  tag: string,
  ref: RefCallback<HTMLElement>,
  className: string | undefined
): ReturnType<typeof createElement> {
  return createElement(tag, { ref, className })
}
