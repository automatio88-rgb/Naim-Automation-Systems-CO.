import {
  LayoutDashboard, SunMedium, Radar, Handshake, Users, CalendarClock, FolderKanban, ListChecks, FileSignature,
  ShoppingBag, ReceiptText, Sparkles, BadgeCheck, Boxes, Truck, Landmark, Wallet, Banknote, HandCoins, UserRound,
  ChartNoAxesCombined, Bot, ShieldCheck, Settings2, PlaneTakeoff, UsersRound, History, type LucideIcon,
} from 'lucide-react'

export type NavItem = { to: string; label: string; icon: LucideIcon; module?: string; keywords?: string }
export const NAV: { group: string; items: NavItem[] }[] = [
  { group: 'Overview', items: [
    { to: '/', label: 'Command Center', icon: LayoutDashboard, keywords: 'home dashboard kpi' },
    { to: '/my-day', label: 'My Day', icon: SunMedium, module: 'appointments', keywords: 'today schedule' },
  ] },
  { group: 'Growth', items: [
    { to: '/leads', label: 'Lead Engine', icon: Radar, module: 'leads', keywords: 'leads funnel outreach replies campaigns actions' },
    { to: '/deals', label: 'Deals', icon: Handshake, module: 'deals', keywords: 'pipeline kanban sales' },
    { to: '/clients', label: 'Clients', icon: Users, module: 'clients', keywords: 'customers crm 360' },
  ] },
  { group: 'Operations', items: [
    { to: '/appointments', label: 'Appointments', icon: CalendarClock, module: 'appointments', keywords: 'calendar calls queue waitlist walk-in' },
    { to: '/projects', label: 'Projects', icon: FolderKanban, module: 'projects', keywords: 'delivery build' },
    { to: '/tasks', label: 'Tasks', icon: ListChecks, module: 'tasks', keywords: 'todo board' },
    { to: '/documents', label: 'Documents', icon: FileSignature, module: 'documents', keywords: 'signed portal contracts' },
  ] },
  { group: 'Commerce', items: [
    { to: '/pos', label: 'POS & Billing', icon: ShoppingBag, module: 'pos', keywords: 'sale checkout' },
    { to: '/invoices', label: 'Invoices', icon: ReceiptText, module: 'pos', keywords: 'billing payments mpesa' },
    { to: '/services', label: 'Services', icon: Sparkles, module: 'services', keywords: 'catalogue packages categories' },
    { to: '/memberships', label: 'Care Plans', icon: BadgeCheck, module: 'memberships', keywords: 'memberships subscriptions mrr retainers' },
    { to: '/inventory', label: 'Inventory', icon: Boxes, module: 'inventory', keywords: 'products stock' },
    { to: '/purchases', label: 'Purchases', icon: Truck, module: 'purchases', keywords: 'suppliers purchase orders po' },
  ] },
  { group: 'Money', items: [
    { to: '/finance', label: 'Finance', icon: Landmark, module: 'finance', keywords: 'cash flow receivables payables tax day close' },
    { to: '/expenses', label: 'Expenses', icon: Wallet, module: 'expenses', keywords: 'spend' },
    { to: '/till', label: 'Cash Till', icon: Banknote, module: 'cash_till', keywords: 'drawer float' },
    { to: '/payroll', label: 'Payroll', icon: HandCoins, module: 'payroll', keywords: 'salary advances payslips commission' },
  ] },
  { group: 'Team', items: [
    { to: '/hr', label: 'Staff & HR', icon: UserRound, module: 'staff', keywords: 'staff departments shifts attendance' },
    { to: '/leave', label: 'Leave Requests', icon: PlaneTakeoff, module: 'leave', keywords: 'leave holiday sick off time annual approve' },
  ] },
  { group: 'Intelligence', items: [
    { to: '/reports', label: 'Reports', icon: ChartNoAxesCombined, module: 'reports', keywords: 'analytics export' },
    { to: '/hermes', label: 'Hermes Fleet', icon: Bot, module: 'hermes', keywords: 'automation bots scout sage herald echo ledger' },
  ] },
  { group: 'System', items: [
    { to: '/users', label: 'Users', icon: UsersRound, module: 'users', keywords: 'users accounts invite logins team access' },
    { to: '/roles', label: 'Roles & Permissions', icon: ShieldCheck, module: 'settings', keywords: 'rbac access permissions matrix approve export' },
    { to: '/activity', label: 'Activity Logs', icon: History, module: 'activity_logs', keywords: 'audit trail history log who did what' },
    { to: '/settings', label: 'Settings', icon: Settings2, module: 'settings', keywords: 'company theme banking' },
  ] },
]
export const ALL_NAV = NAV.flatMap((g) => g.items)