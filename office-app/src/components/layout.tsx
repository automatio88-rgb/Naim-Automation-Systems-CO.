import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Command } from 'cmdk'
import { Bell, Building2, CalendarPlus, Check, LogOut, Menu as MenuIcon, Monitor, Moon, Palette, Search, ShoppingBag, Sun, UserPlus, Zap } from 'lucide-react'
import { NAV, ALL_NAV } from '@/nav'
import { useAuth } from '@/lib/auth'
import { useTheme, PALETTES } from '@/lib/theme'
import { useBiz } from '@/lib/business'
import { useList, useRealtimeSync, updateWhere, type Row } from '@/services/db'
import { isLocalPreview } from '@/lib/supabase'
import { cn, ago } from '@/lib/utils'
import { useReveal } from '@/lib/motion'
import { Avatar, Badge, Button, Popover, Segmented, Sheet, Switch, Tip } from './ui'

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-3 px-5 h-[72px] shrink-0">
      <span className="size-9 rounded-[12px] grid place-items-center bg-primary text-primary-foreground font-display text-[19px] font-semibold shadow-e2">N</span>
      <span className="leading-tight">
        <span className="block font-display text-[17px] font-semibold tracking-[.01em] text-rail-foreground">NAIM COMMAND</span>
        <span className="block text-[11.5px] text-rail-muted">Naim Automation Systems</span>
      </span>
    </Link>
  )
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const { can } = useAuth()
  return (
    <nav className="flex-1 overflow-y-auto rail-scroll px-3 pb-4">
      {NAV.map((g) => {
        const items = g.items.filter((i) => can(i.module))
        if (!items.length) return null
        return (
          <div key={g.group} className="mt-4 first:mt-1">
            <div className="px-3 mb-1.5 text-[11.5px] font-medium text-rail-muted">{g.group}</div>
            {items.map((i) => (
              <NavLink key={i.to} to={i.to} end={i.to === '/'} onClick={onNavigate}
                className="nav-item flex items-center gap-3 h-9 px-3 rounded-[11px] text-[13.5px] font-medium transition-colors">
                <i.icon className="size-[17px] shrink-0" strokeWidth={1.8} />{i.label}
              </NavLink>
            ))}
          </div>
        )
      })}
    </nav>
  )
}

function RailFooter() {
  const { profile, signOut } = useAuth()
  const { resolved, set } = useTheme()
  return (
    <div className="border-t border-white/[.07] p-3 space-y-2">
      <div className="flex items-center gap-2.5 px-2 py-1.5">
        <Avatar name={profile?.full_name || profile?.email} size={34} />
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-medium text-rail-foreground truncate">{profile?.full_name || profile?.email}</div>
          <div className="text-[11.5px] text-rail-muted capitalize">{profile?.role}</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => set({ mode: resolved === 'dark' ? 'light' : 'dark' })} className="nav-item h-9 rounded-[11px] border border-white/[.09] flex items-center justify-center gap-2 text-[12.5px]">
          {resolved === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}{resolved === 'dark' ? 'Light' : 'Dark'}
        </button>
        <button onClick={signOut} className="h-9 rounded-[11px] flex items-center justify-center gap-2 text-[12.5px] bg-danger/20 text-[#f3b2ab] hover:bg-danger/30 transition-colors">
          <LogOut className="size-4" />Log out
        </button>
      </div>
    </div>
  )
}

function ThemeMenu() {
  const t = useTheme()
  return (
    <Popover trigger={<Button variant="ghost" size="icon" aria-label="Theme"><Palette /></Button>} className="w-[300px] p-4">
      <div className="text-[13px] font-medium mb-2">Appearance</div>
      <Segmented value={t.mode} onChange={(m) => t.set({ mode: m })} size="sm" items={[
        { id: 'light', label: <span className="inline-flex items-center gap-1.5"><Sun className="size-3.5" />Light</span> },
        { id: 'dark', label: <span className="inline-flex items-center gap-1.5"><Moon className="size-3.5" />Dark</span> },
        { id: 'system', label: <span className="inline-flex items-center gap-1.5"><Monitor className="size-3.5" />System</span> },
      ]} />
      <div className="text-[13px] font-medium mt-4 mb-2">Palette</div>
      <div className="grid grid-cols-3 gap-2">
        {PALETTES.map((p) => (
          <button key={p.id} onClick={() => t.set({ palette: p.id })} aria-pressed={t.palette === p.id}
            className={cn('rounded-[12px] p-2 text-left transition-colors', t.palette === p.id ? 'bg-foreground/[.08]' : 'hover:bg-foreground/[.04]')}>
            <span className="flex h-7 rounded-[8px] overflow-hidden"><span className="flex-1" style={{ background: p.rail }} /><span className="flex-1" style={{ background: p.swatch }} /></span>
            <span className="flex items-center gap-1 mt-1.5 text-[12px]">{t.palette === p.id && <Check className="size-3" />}{p.name}</span>
          </button>
        ))}
      </div>
      <label className="flex items-center justify-between mt-4 text-[13px]">Reduce motion<Switch checked={t.reduceMotion} onChange={(v) => t.set({ reduceMotion: v })} /></label>
    </Popover>
  )
}

function Notifications() {
  const { data = [] } = useList('notifications', { order: ['created_at'], limit: 30 })
  const unread = data.filter((n) => !n.read).length
  const nav = useNavigate()
  const go: Record<string, string> = { lead: '/leads', appointment: '/appointments', invoice: '/invoices', client: '/documents', automation_run: '/hermes' }
  return (
    <Popover trigger={
      <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
        <Bell />{unread > 0 && <span className="absolute top-1.5 right-1.5 min-w-4 h-4 px-1 rounded-full bg-danger text-white text-[10px] font-semibold grid place-items-center num">{unread}</span>}
      </Button>} className="w-[360px] p-0">
      <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
        <div className="font-medium">Notifications</div>
        {unread > 0 && <Button variant="link" size="sm" onClick={() => updateWhere('notifications', 'read', false, { read: true })}>Mark all read</Button>}
      </div>
      <div className="max-h-[420px] overflow-y-auto scroll-thin pb-2">
        {data.map((n) => (
          <button key={n.id} onClick={() => { updateWhere('notifications', 'id', n.id, { read: true }); nav(go[n.entity_type] || '/') }}
            className={cn('w-full text-left px-4 py-2.5 flex gap-3 hover:bg-foreground/[.04]', !n.read && 'bg-primary/[.07]')}>
            <span className={cn('mt-1.5 size-2 rounded-full shrink-0', n.read ? 'bg-transparent' : 'bg-primary')} />
            <span className="min-w-0">
              <span className="block text-[13.5px] font-medium">{n.title}</span>
              <span className="block text-[12.5px] text-muted-foreground line-clamp-2">{n.body}</span>
              <span className="block text-[11.5px] text-muted-foreground mt-0.5">{ago(n.created_at)}</span>
            </span>
          </button>
        ))}
        {!data.length && <div className="text-center text-[13px] text-muted-foreground py-8">You are all caught up</div>}
      </div>
    </Popover>
  )
}

function BizSwitch() {
  const { businesses, biz, setBiz } = useBiz()
  if (businesses.length < 2) return null
  const cur = businesses.find((b) => b.id === biz)
  return (
    <Popover align="start" trigger={
      <button className="hidden md:inline-flex items-center gap-2 h-9 pl-2.5 pr-3 rounded-full border border-border bg-card text-[13px] hover:bg-foreground/[.03] max-w-[220px]">
        <Building2 className="size-4 text-muted-foreground shrink-0" /><span className="truncate">{cur ? cur.name : 'All businesses'}</span>
      </button>} className="w-[280px] p-1.5">
      {[{ id: null, name: 'All businesses', kind: 'Combined view' } as Row, ...businesses].map((b) => (
        <button key={b.id ?? 'all'} onClick={() => setBiz(b.id)} className={cn('w-full text-left flex items-center gap-2.5 rounded-[10px] px-2.5 py-2 hover:bg-foreground/[.05]', biz === b.id && 'bg-foreground/[.07]')}>
          <span className="size-6 rounded-full shrink-0" style={{ background: b.accent || 'var(--fg-muted)' }} />
          <span className="min-w-0 flex-1"><span className="block text-[13.5px] truncate">{b.name}</span><span className="block text-[11.5px] text-muted-foreground">{b.kind === 'side_business' ? 'Side business' : b.kind === 'company' ? 'Main company' : b.kind}</span></span>
          {biz === b.id && <Check className="size-4" />}
        </button>
      ))}
    </Popover>
  )
}

function Palette_({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
  const nav = useNavigate()
  const { can } = useAuth()
  const [q, setQ] = useState('')
  const leads = useList('leads', { select: 'id,business_name,location,status', enabled: open && q.length > 1, filter: (b) => b.ilike('business_name', `%${q}%`).is('deleted_at', null), limit: 6, key: [q] })
  const clients = useList('clients', { select: 'id,business_name,contact_name', enabled: open && q.length > 1, filter: (b) => b.ilike('business_name', `%${q}%`).is('deleted_at', null), limit: 6, key: [q] })
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setOpen(!open) } }
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k)
  }, [open, setOpen])
  const go = (to: string) => { setOpen(false); setQ(''); nav(to) }
  const item = 'flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[14px] cursor-pointer data-[selected=true]:bg-foreground/[.06]'
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[75] bg-[rgb(12_9_6/.5)] backdrop-blur-[3px] flex items-start justify-center pt-[12vh] px-3" onClick={() => setOpen(false)}>
      <Command className="anim-dialog w-full max-w-[600px] rounded-dialog bg-popover border border-border shadow-e3 overflow-hidden" data-state="open" onClick={(e) => e.stopPropagation()} shouldFilter>
        <div className="flex items-center gap-3 px-4 border-b border-border">
          <Search className="size-4 text-muted-foreground" />
          <Command.Input autoFocus value={q} onValueChange={setQ} placeholder="Search modules, leads, clients" className="flex-1 h-14 bg-transparent outline-none text-[15px]" />
          <kbd className="text-[11px] text-muted-foreground border border-border rounded-md px-1.5 py-0.5">Esc</kbd>
        </div>
        <Command.List className="max-h-[420px] overflow-y-auto scroll-thin p-2" onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}>
          <Command.Empty className="py-8 text-center text-[13px] text-muted-foreground">No results</Command.Empty>
          {!!leads.data?.length && <Command.Group heading="Leads" className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[12px] [&_[cmdk-group-heading]]:text-muted-foreground">
            {leads.data.map((l) => <Command.Item key={l.id} value={'lead ' + l.business_name} onSelect={() => go(`/leads?lead=${l.id}`)} className={item}><span className="flex-1 truncate">{l.business_name}</span><span className="text-[12px] text-muted-foreground">{l.location}</span></Command.Item>)}
          </Command.Group>}
          {!!clients.data?.length && <Command.Group heading="Clients" className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[12px] [&_[cmdk-group-heading]]:text-muted-foreground">
            {clients.data.map((c) => <Command.Item key={c.id} value={'client ' + c.business_name} onSelect={() => go(`/clients?client=${c.id}`)} className={item}><span className="flex-1 truncate">{c.business_name}</span><span className="text-[12px] text-muted-foreground">{c.contact_name}</span></Command.Item>)}
          </Command.Group>}
          <Command.Group heading="Go to" className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[12px] [&_[cmdk-group-heading]]:text-muted-foreground">
            {ALL_NAV.filter((n) => can(n.module)).map((n) => (
              <Command.Item key={n.to} value={`${n.label} ${n.keywords || ''}`} onSelect={() => go(n.to)} className={item}><n.icon className="size-4 text-muted-foreground" />{n.label}</Command.Item>
            ))}
          </Command.Group>
        </Command.List>
      </Command>
    </div>
  )
}

function Topbar({ onMenu, onSearch }: { onMenu: () => void; onSearch: () => void }) {
  const nav = useNavigate()
  const { can } = useAuth()
  return (
    <header className="topbar sticky top-0 z-40 bg-background/80 backdrop-blur-xl">
      <div className="flex items-center gap-2 h-16 px-4 sm:px-6 lg:px-8">
        <Button variant="ghost" size="icon" className="lg:hidden -ml-2" onClick={onMenu} aria-label="Open navigation"><MenuIcon /></Button>
        <button onClick={onSearch} className="flex items-center gap-2.5 h-10 pl-3.5 pr-2 rounded-full bg-foreground/[.05] hover:bg-foreground/[.08] text-muted-foreground text-[13.5px] w-full max-w-[340px] transition-colors">
          <Search className="size-4" /><span className="flex-1 text-left truncate">Search everything</span>
          <kbd className="hidden sm:inline text-[11px] border border-border rounded-md px-1.5 py-0.5 bg-card">Ctrl K</kbd>
        </button>
        <BizSwitch />
        <div className="flex-1" />
        {isLocalPreview && <Tip label="Preview data — every demo row is flagged is_demo and can be purged"><span className="hidden xl:inline-flex"><Badge tone="warning" dot>Demo data</Badge></span></Tip>}
        <div className="hidden md:flex items-center gap-1.5">
          {can('appointments', 'create') && <Button size="sm" variant="dark" onClick={() => nav('/appointments?new=1')}><CalendarPlus />New appointment</Button>}
          {can('pos', 'create') && <Button size="sm" variant="outline" onClick={() => nav('/pos')}><ShoppingBag />New sale</Button>}
          {can('leads', 'create') && <Tip label="Add a lead"><Button size="icon-sm" variant="outline" onClick={() => nav('/leads?new=1')} aria-label="Add lead"><UserPlus /></Button></Tip>}
          {can('hermes') && <Tip label="Hermes fleet"><Button size="icon-sm" variant="outline" onClick={() => nav('/hermes')} aria-label="Hermes"><Zap /></Button></Tip>}
        </div>
        <ThemeMenu />
        <Notifications />
      </div>
    </header>
  )
}

export function Layout() {
  const [mobile, setMobile] = useState(false)
  const [search, setSearch] = useState(false)
  const loc = useLocation()
  const main = useRef<HTMLDivElement>(null)
  useRealtimeSync(true)
  useReveal(main, [loc.pathname])
  useEffect(() => { window.scrollTo({ top: 0 }) }, [loc.pathname])
  return (
    <div className="min-h-dvh lg:pl-[264px]">
      <aside className="rail-surface grain fixed inset-y-0 left-0 z-50 w-[264px] hidden lg:flex flex-col text-rail-foreground">
        <Brand /><NavList /><RailFooter />
      </aside>
      <Sheet open={mobile} onOpenChange={setMobile} title={null} side="left" width={284}>
        <div className="rail-surface grain relative h-full flex flex-col text-rail-foreground"><Brand /><NavList onNavigate={() => setMobile(false)} /><RailFooter /></div>
      </Sheet>
      <Topbar onMenu={() => setMobile(true)} onSearch={() => setSearch(true)} />
      <main ref={main} key={loc.pathname} className="px-4 sm:px-6 lg:px-8 pb-16 pt-2 max-w-[1600px]">
        <Outlet />
      </main>
      <Palette_ open={search} setOpen={setSearch} />
    </div>
  )
}