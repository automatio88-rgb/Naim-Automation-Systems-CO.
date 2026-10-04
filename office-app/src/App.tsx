import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { queryClient } from './lib/query'
import { ThemeProvider, useTheme } from './lib/theme'
import { AuthProvider, useAuth } from './lib/auth'
import { BusinessProvider } from './lib/business'
import { TipProvider, Skeleton } from './components/ui'
import { Layout } from './components/layout'
import Login from './pages/login'

const P = {
  dashboard: lazy(() => import('./pages/dashboard')),
  myday: lazy(() => import('./pages/my-day')),
  leads: lazy(() => import('./pages/leads')),
  deals: lazy(() => import('./pages/deals')),
  clients: lazy(() => import('./pages/clients')),
  appointments: lazy(() => import('./pages/appointments')),
  projects: lazy(() => import('./pages/projects')),
  tasks: lazy(() => import('./pages/tasks')),
  documents: lazy(() => import('./pages/documents')),
  pos: lazy(() => import('./pages/pos')),
  invoices: lazy(() => import('./pages/invoices')),
  services: lazy(() => import('./pages/services')),
  memberships: lazy(() => import('./pages/memberships')),
  inventory: lazy(() => import('./pages/inventory')),
  purchases: lazy(() => import('./pages/purchases')),
  finance: lazy(() => import('./pages/finance')),
  expenses: lazy(() => import('./pages/expenses')),
  till: lazy(() => import('./pages/till')),
  payroll: lazy(() => import('./pages/payroll')),
  hr: lazy(() => import('./pages/hr')),
  reports: lazy(() => import('./pages/reports')),
  hermes: lazy(() => import('./pages/hermes')),
  roles: lazy(() => import('./pages/roles')),
  settings: lazy(() => import('./pages/settings')),
}

function PageFallback() {
  return <div className="space-y-4"><Skeleton className="h-10 w-64" /><div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28" />)}</div><Skeleton className="h-80" /></div>
}

function Gate() {
  const { session, loading } = useAuth()
  if (loading) return <div className="min-h-dvh grid place-items-center"><div className="size-10 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>
  if (!session) return <Login />
  const routes: [string, keyof typeof P][] = [
    ['/', 'dashboard'], ['/my-day', 'myday'], ['/leads', 'leads'], ['/deals', 'deals'], ['/clients', 'clients'], ['/appointments', 'appointments'],
    ['/projects', 'projects'], ['/tasks', 'tasks'], ['/documents', 'documents'], ['/pos', 'pos'], ['/invoices', 'invoices'], ['/services', 'services'],
    ['/memberships', 'memberships'], ['/inventory', 'inventory'], ['/purchases', 'purchases'], ['/finance', 'finance'], ['/expenses', 'expenses'],
    ['/till', 'till'], ['/payroll', 'payroll'], ['/hr', 'hr'], ['/reports', 'reports'], ['/hermes', 'hermes'], ['/roles', 'roles'], ['/settings', 'settings'],
  ]
  return (
    <BusinessProvider>
      <Routes>
        <Route element={<Layout />}>
          {routes.map(([path, k]) => {
            const C = P[k]
            return <Route key={path} path={path} element={<Suspense fallback={<PageFallback />}><C /></Suspense>} />
          })}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BusinessProvider>
  )
}

function Toasts() {
  const { resolved } = useTheme()
  return <Toaster theme={resolved} position="bottom-right" richColors closeButton toastOptions={{ style: { borderRadius: 16, fontFamily: 'var(--font-ui)' } }} />
}

export default function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TipProvider>
          <AuthProvider>
            <BrowserRouter><Gate /></BrowserRouter>
            <Toasts />
          </AuthProvider>
        </TipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}