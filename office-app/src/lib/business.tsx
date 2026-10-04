import { createContext, useContext, useState, type ReactNode } from 'react'
import { useList, type Row } from '@/services/db'

type Ctx = { businesses: Row[]; biz: string | null; setBiz: (id: string | null) => void; scope: (b: any, col?: string) => any }
const BizCtx = createContext<Ctx>(null as unknown as Ctx)

/** Main company + side businesses. `scope()` narrows a query to the selected business. */
export function BusinessProvider({ children }: { children: ReactNode }) {
  const { data = [] } = useList('businesses', { order: ['is_primary', false] })
  const [biz, setBizState] = useState<string | null>(() => localStorage.getItem('naim-biz'))
  const setBiz = (id: string | null) => { setBizState(id); id ? localStorage.setItem('naim-biz', id) : localStorage.removeItem('naim-biz') }
  const valid = biz && data.some((b) => b.id === biz) ? biz : null
  const scope = (b: any, col = 'business_id') => (valid ? b.eq(col, valid) : b)
  return <BizCtx.Provider value={{ businesses: data, biz: valid, setBiz, scope }}>{children}</BizCtx.Provider>
}
export const useBiz = () => useContext(BizCtx)