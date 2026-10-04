import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { gsap } from './gsap'

export type Mode = 'light' | 'dark' | 'system'
export const PALETTES = [
  { id: 'gold', name: 'Naim Gold', swatch: '#C8A24A', rail: '#211812' },
  { id: 'maroon', name: 'Maroon', swatch: '#8E3B46', rail: '#2a1216' },
  { id: 'coral', name: 'Coral', swatch: '#E2725B', rail: '#2b1712' },
  { id: 'ocean', name: 'Ocean', swatch: '#2F6FE4', rail: '#0f1e3a' },
  { id: 'emerald', name: 'Emerald', swatch: '#1F9D72', rail: '#0d241c' },
  { id: 'graphite', name: 'Graphite', swatch: '#2f343b', rail: '#15171a' },
] as const
export type PaletteId = (typeof PALETTES)[number]['id']

type State = { mode: Mode; palette: PaletteId; reduceMotion: boolean }
type Ctx = State & { resolved: 'light' | 'dark'; set: (p: Partial<State>) => void }
const ThemeCtx = createContext<Ctx>(null as unknown as Ctx)

const load = (): State => {
  try { return { mode: 'system', palette: 'gold', reduceMotion: false, ...JSON.parse(localStorage.getItem('naim-theme') || '{}') } }
  catch { return { mode: 'system', palette: 'gold', reduceMotion: false } }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(load)
  const [sysDark, setSysDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const on = (e: MediaQueryListEvent) => setSysDark(e.matches)
    mq.addEventListener('change', on); return () => mq.removeEventListener('change', on)
  }, [])
  const resolved = state.mode === 'system' ? (sysDark ? 'dark' : 'light') : state.mode
  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', resolved === 'dark')
    root.dataset.palette = state.palette
    if (state.reduceMotion) root.dataset.motion = 'reduce'; else delete root.dataset.motion
    localStorage.setItem('naim-theme', JSON.stringify(state))
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', PALETTES.find((p) => p.id === state.palette)?.rail || '#211812')
    gsap.matchMediaRefresh()
  }, [state, resolved])
  const value = useMemo<Ctx>(() => ({ ...state, resolved, set: (p) => setState((s) => ({ ...s, ...p })) }), [state, resolved])
  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>
}
export const useTheme = () => useContext(ThemeCtx)