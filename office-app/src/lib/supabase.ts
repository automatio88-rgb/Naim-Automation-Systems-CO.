import { createClient } from '@supabase/supabase-js'

const envUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** No env vars → the app talks to the same-origin Supabase-compatible preview backend. */
export const isLocalPreview = !envUrl
export const realtimeEnabled = !isLocalPreview

export const supabase = createClient(envUrl || window.location.origin, envKey || 'local-preview-anon-key', {
  auth: { persistSession: true, autoRefreshToken: true, storageKey: 'naim-command-auth' },
  realtime: { params: { eventsPerSecond: 5 } },
})