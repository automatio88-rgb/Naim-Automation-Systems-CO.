import { useState } from 'react'
import { Clock, FlaskConical, Package, Percent, Plus, Sparkles, Tag } from 'lucide-react'
import { useList, remove, invalidate, type Row } from '@/services/db'
import { useAuth } from '@/lib/auth'
import { useBiz } from '@/lib/business'
import { cn, kes, humanize, sum } from '@/lib/utils'
import { Badge, Button, Card, ChevronFilter, Kpi, PageHeader, Select, TabPanel, Tabs } from '@/components/ui'
import { DataTable } from '@/components/data-table'
import { RecordForm } from '@/components/form'
import { Package360 } from '@/components/catalog360'

const marginPct = (r: Row) => (Number(r.price_kes) ? Math.round(((Number(r.price_kes) - Number(r.cost_kes || 0)) / Number(r.price_kes)) * 100) : 0)
const marginTone = (m: number) => (m >= 60 ? 'success' : m >= 35 ? 'warning' : 'danger') as any
const pkgValue = (p: Row, svc: Row[]) => sum(p.items || [], (it: Row) => Number(it.qty || 1) * Number(svc.find((s) => s.id === it.service_id)?.price_kes || 0))

export default function Services() {
  const { can } = useAuth()
  const { businesses } = useBiz()
  const svc = useList('services', { select: '*, service_categories(name,color), businesses(name)', filter: (b) => b.is('deleted_at', null), order: ['name', true] })
  const cats = useList('service_categories', { order: ['sort', true] })
  const pkgs = useList('packages', { order: ['price_kes', true] })
  const recipes = useList('service_recipes', { select: 'service_id,qty,products(cost_kes)' })
  const [tab, setTab] = useState('services')
  const [f, setF] = useState('all')
  const [fCat, setFCat] = useState('')
  const [fBiz, setFBiz] = useState('')
  const [fKind, setFKind] = useState('')
  const [cf, setCf] = useState('all')
  const [pf, setPf] = useState('all')
  const [edit, setEdit] = useState<Row | null | undefined>(undefined)
  const [editCat, setEditCat] = useState<Row | null | undefined>(undefined)
  const [editPkg, setEditPkg] = useState<Row | null | undefined>(undefined)
  const [openPkg, setOpenPkg] = useState<string | null>(null)
  const catOpts = (cats.data || []).map((c) => ({ value: c.id, label: c.name }))
  const bizOpts = businesses.map((b) => ({ value: b.id, label: b.name }))
  const rows = svc.data || []
  const C = cats.data || [], PK = pkgs.data || []
  const recipeCost = (id: string) => sum((recipes.data || []).filter((r) => r.service_id === id), (r: Row) => Number(r.qty) * Number(r.products?.cost_kes || 0))
  const hasRecipe = (id: string) => (recipes.data || []).some((r) => r.service_id === id)
  const cost = (r: Row) => (hasRecipe(r.id) ? recipeCost(r.id) : Number(r.cost_kes || 0))
  const withCost: Row[] = rows.map((r: Row) => ({ ...r, actual_cost: cost(r), margin: marginPct({ ...r, cost_kes: cost(r) }) }))
  const view = withCost.filter((r) => (f === 'all' || (f === 'active' ? r.active : !r.active)) && (!fCat || r.category_id === fCat) && (!fBiz || r.business_id === fBiz)
    && (!fKind || (fKind === 'recurring' ? r.is_recurring : fKind === 'online' ? r.bookable_online : fKind === 'project' ? !!r.delivery_days : !!r.duration_min && !r.delivery_days)))
  const active = withCost.filter((r) => r.active)
  const avgMargin = active.length ? Math.round(sum(active, 'margin') / active.length) : 0
  const pkgLabel = tab === 'categories' ? 'service category' : tab === 'packages' ? 'package' : 'service'
  return (
    <div>
      <PageHeader title="Services" sub="What we sell: builds, automations, training and care"
        actions={can('services', 'create') && <Button onClick={() => (tab === 'categories' ? setEditCat(null) : tab === 'packages' ? setEditPkg(null) : setEdit(null))}><Plus />Add {pkgLabel}</Button>} />
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4 mb-5">
        <Kpi solid tone="brand" label="Services" value={rows.length} foot={`${active.length} active`} icon={<Sparkles />} onClick={() => setTab('services')} />
        <Kpi solid tone="info" label="Categories" value={C.length} icon={<Tag />} onClick={() => setTab('categories')} />
        <Kpi solid tone="violet" label="Packages" value={PK.length} icon={<Package />} onClick={() => setTab('packages')} />
        <Kpi solid tone="success" label="Average price" value={active.length ? sum(active, 'price_kes') / active.length : 0} format={(n) => kes(n)} />
        <Kpi solid tone={avgMargin >= 50 ? 'teal' : 'warning'} label="Average margin" value={avgMargin} format={(n) => `${Math.round(n)}%`} icon={<Percent />} />
        <Kpi solid tone="danger" label="Low margin (<35%)" value={active.filter((r) => r.margin < 35).length} onClick={() => { setTab('services'); setF('active') }} />
      </div>
      <Tabs value={tab} onChange={setTab} items={[{ id: 'services', label: 'Services', count: rows.length }, { id: 'categories', label: 'Categories', count: C.length }, { id: 'packages', label: 'Packages', count: PK.length }]}>
        <TabPanel id="services">
          <div className="mb-4"><ChevronFilter value={f} onChange={setF} items={[{ id: 'all', label: 'All', count: rows.length }, { id: 'active', label: 'Active', tone: 'success', count: active.length }, { id: 'hidden', label: 'Hidden', tone: 'neutral', count: rows.length - active.length }]} /></div>
          <DataTable rows={view} loading={svc.isLoading} onRow={setEdit} searchKeys={['name', 'description', 'service_categories.name']} exportName="services" initialSort={['price_kes', 'desc']}
            filters={<>
              <Select size="sm" value={fCat} onChange={setFCat} allowClear="All categories" options={catOpts} />
              <Select size="sm" value={fBiz} onChange={setFBiz} allowClear="All businesses" options={bizOpts} />
              <Select size="sm" value={fKind} onChange={setFKind} allowClear="Any kind" options={[{ value: 'project', label: 'Projects (days)' }, { value: 'session', label: 'Sessions (minutes)' }, { value: 'recurring', label: 'Recurring' }, { value: 'online', label: 'Bookable online' }]} />
            </>} onClearFilters={() => { setFCat(''); setFBiz(''); setFKind(''); setF('all') }}
            onView={setEdit} onEdit={can('services', 'edit') ? setEdit : undefined} onDelete={can('services', 'delete') ? async (r) => { await remove('services', r.id, true) } : undefined}
            importTable="services" importFields={['name', 'price_kes', 'cost_kes', 'duration_min', 'delivery_days', 'commission_pct', 'description']} importDefaults={{ active: true }} onImported={() => invalidate(['services'])}
            cols={[
              { key: 'name', label: 'Service', sort: true, render: (r) => <div><div className="font-medium inline-flex items-center gap-1.5">{r.name}{hasRecipe(r.id) && <FlaskConical className="size-3.5 tone-violet ink" aria-label="Uses products" />}</div><div className="text-[12px] text-muted-foreground line-clamp-1 max-w-[320px]">{r.description}</div></div> },
              { key: 'service_categories.name', label: 'Category', render: (r) => r.service_categories ? <span className="inline-flex items-center gap-2"><span className="size-2 rounded-full" style={{ background: r.service_categories.color }} />{r.service_categories.name}</span> : '—' },
              { key: 'businesses.name', label: 'Business', hideBelow: 'lg' },
              { key: 'duration', label: 'Duration', hideBelow: 'md', render: (r) => <span className="inline-flex items-center gap-1 num"><Clock className="size-3.5 text-muted-foreground" />{r.delivery_days ? `${r.delivery_days} d` : r.duration_min ? `${r.duration_min} min` : '—'}{r.buffer_min ? <span className="text-muted-foreground"> +{r.buffer_min}</span> : null}</span>, csv: (r) => (r.delivery_days ? `${r.delivery_days} days` : `${r.duration_min || 0} min`) },
              { key: 'actual_cost', label: 'Actual cost', align: 'right', hideBelow: 'md', sort: true, render: (r) => kes(r.actual_cost) },
              { key: 'margin', label: 'Margin', align: 'right', sort: true, render: (r) => <Badge tone={marginTone(r.margin)}>{r.margin}%</Badge>, csv: (r) => `${r.margin}%` },
              { key: 'commission_pct', label: 'Comm.', hideBelow: 'lg', align: 'right', render: (r) => `${Number(r.commission_pct || 0)}%` },
              { key: 'active', label: 'Status', render: (r) => <div className="flex flex-col gap-0.5 items-start"><Badge tone={r.active ? 'success' : 'neutral'} dot>{r.active ? 'Active' : 'Hidden'}</Badge>{r.bookable_online && <span className="text-[11px] text-muted-foreground">Online booking</span>}</div>, csv: (r) => (r.active ? 'Active' : 'Hidden') },
              { key: 'price_kes', label: 'Price', align: 'right', sort: true, render: (r) => <span className="font-medium">{kes(r.price_kes)}</span> },
            ]} />
        </TabPanel>
        <TabPanel id="categories">
          <div className="mb-4"><ChevronFilter value={cf} onChange={setCf} items={[{ id: 'all', label: 'All', count: C.length }, { id: 'active', label: 'Active', tone: 'success', count: C.filter((c) => c.active !== false).length }, { id: 'inactive', label: 'Inactive', count: C.filter((c) => c.active === false).length }]} /></div>
          <DataTable rows={C.filter((c) => cf === 'all' || (cf === 'active' ? c.active !== false : c.active === false))} loading={cats.isLoading} onRow={setEditCat} searchKeys={['name']} exportName="service-categories" initialSort={['sort', 'asc']}
            onEdit={can('services', 'edit') ? setEditCat : undefined} onDelete={can('services', 'delete') ? async (r) => { await remove('service_categories', r.id) } : undefined} canDelete={(r) => !rows.some((s) => s.category_id === r.id)}
            importTable="service_categories" importFields={['name', 'color', 'sort']} onImported={() => invalidate(['service_categories'])}
            cols={[
              { key: 'name', label: 'Category', sort: true, render: (r) => <span className="inline-flex items-center gap-2.5 font-medium"><span className="size-6 rounded-[8px]" style={{ background: r.color }} />{r.name}</span> },
              { key: 'sort', label: 'Order', align: 'right', sort: true, render: (r) => <span className="num">{r.sort}</span> },
              { key: 'n', label: 'Services', align: 'right', sort: (r) => rows.filter((s) => s.category_id === r.id).length, render: (r) => <span className="num">{rows.filter((s) => s.category_id === r.id).length}</span> },
              { key: 'rev', label: 'Avg price', align: 'right', hideBelow: 'md', render: (r) => { const s = rows.filter((x) => x.category_id === r.id); return s.length ? kes(sum(s, 'price_kes') / s.length) : '—' } },
              { key: 'active', label: 'Status', render: (r) => <Badge tone={r.active !== false ? 'success' : 'neutral'} dot>{r.active !== false ? 'Active' : 'Inactive'}</Badge> },
            ]} />
        </TabPanel>
        <TabPanel id="packages">
          <div className="mb-4"><ChevronFilter value={pf} onChange={setPf} items={[{ id: 'all', label: 'All', count: PK.length }, { id: 'active', label: 'Active', tone: 'success', count: PK.filter((p) => p.active).length }, { id: 'inactive', label: 'Inactive', count: PK.filter((p) => !p.active).length }]} /></div>
          <DataTable rows={PK.filter((p) => pf === 'all' || (pf === 'active' ? p.active : !p.active))} loading={pkgs.isLoading} onRow={(r) => setOpenPkg(r.id)} searchKeys={['name', 'description']} exportName="packages" initialSort={['price_kes', 'desc']}
            onView={(r) => setOpenPkg(r.id)} onEdit={can('services', 'edit') ? setEditPkg : undefined} onDelete={can('services', 'delete') ? async (r) => { await remove('packages', r.id) } : undefined}
            cols={[
              { key: 'name', label: 'Package', sort: true, render: (r) => <div><div className="font-medium">{r.name}</div><div className="text-[12px] text-muted-foreground line-clamp-1 max-w-[320px]">{(r.items || []).map((i: Row) => `${i.name}${Number(i.qty) > 1 ? ` ×${i.qty}` : ''}`).join(' · ')}</div></div> },
              { key: 'items', label: 'Services', align: 'right', render: (r) => <span className="num">{(r.items || []).length}</span>, csv: (r) => (r.items || []).length },
              { key: 'validity_days', label: 'Validity', align: 'right', hideBelow: 'md', render: (r) => `${r.validity_days || 90} d` },
              { key: 'value', label: 'Value', align: 'right', hideBelow: 'sm', render: (r) => <span className="text-muted-foreground line-through num">{kes(pkgValue(r, rows))}</span>, csv: (r) => pkgValue(r, rows) },
              { key: 'saving', label: 'Saving', align: 'right', render: (r) => { const s = pkgValue(r, rows) - Number(r.price_kes); return s > 0 ? <Badge tone="success">{kes(s)}</Badge> : '—' }, csv: (r) => pkgValue(r, rows) - Number(r.price_kes) },
              { key: 'active', label: 'Status', render: (r) => <Badge tone={r.active ? 'success' : 'neutral'} dot>{r.active ? 'Active' : 'Inactive'}</Badge> },
              { key: 'price_kes', label: 'Price', align: 'right', sort: true, render: (r) => <span className="font-medium">{kes(r.price_kes)}</span> },
            ]} />
        </TabPanel>
      </Tabs>
      <RecordForm open={edit !== undefined} onOpenChange={(v) => !v && setEdit(undefined)} table="services" initial={edit ? Object.fromEntries(Object.entries(edit).filter(([k]) => !['actual_cost', 'margin', 'service_categories', 'businesses'].includes(k))) : edit} title={edit ? 'Edit service' : 'Add service'} size="xl"
        fields={[{ name: 'category_id', label: 'Category', type: 'select', options: catOpts, required: true }, { name: 'name', label: 'Service name', required: true },
          { name: 'price_kes', label: 'Price (KES)', type: 'number', required: true }, { name: 'cost_kes', label: 'Flat cost (KES)', type: 'number', hint: 'Used when the service has no product recipe' },
          { name: 'duration_min', label: 'Session length (min)', type: 'number' }, { name: 'delivery_days', label: 'Delivery (days)', type: 'number', hint: 'For projects and builds' },
          { name: 'buffer_min', label: 'Turnaround buffer (min)', type: 'number', hint: 'Prep or wrap-up time blocked after a session' }, { name: 'needs_space', label: 'Needs a space', type: 'select', options: [{ value: 'meeting_room', label: 'Meeting room' }, { value: 'call_booth', label: 'Call booth' }, { value: 'desk', label: 'Desk' }] },
          { name: 'commission_pct', label: 'Commission %', type: 'number' }, { name: 'max_discount_pct', label: 'Max discount %', type: 'number', hint: 'POS blocks discounts above this' },
          { name: 'business_id', label: 'Business', type: 'select', options: bizOpts }, { name: 'is_recurring', label: 'Recurring', type: 'switch' },
          { name: 'bookable_online', label: 'Bookable online', type: 'switch' }, { name: 'active', label: 'Active', type: 'switch' }, { name: 'description', label: 'Description', type: 'textarea', span: 2 }]}
        defaults={{ active: true, commission_pct: 5, max_discount_pct: 100, buffer_min: 0, bookable_online: false, business_id: businesses.find((b) => b.is_primary)?.id }} activity={(v, n) => `${n ? 'Added' : 'Updated'} service ${v.name}`}
        preview={(v) => {
          const c = C.find((x) => x.id === v.category_id)
          const rc = v.id && hasRecipe(v.id) ? recipeCost(v.id) : Number(v.cost_kes || 0)
          const m = marginPct({ price_kes: v.price_kes, cost_kes: rc })
          return (
            <div className="rounded-card bg-card border border-border/70 p-5 shadow-e1">
              <div className="flex items-center gap-2">{c && <span className="inline-flex items-center gap-1.5 text-[12px]"><span className="size-2 rounded-full" style={{ background: c.color }} />{c.name}</span>}<Badge tone={v.active ? 'success' : 'neutral'} dot className="ml-auto">{v.active ? 'Active' : 'Hidden'}</Badge></div>
              <div className="font-semibold text-[17px] mt-3">{v.name || 'New service'}</div>
              <p className="text-[13px] text-muted-foreground mt-1 line-clamp-3">{v.description || 'Description appears here.'}</p>
              <div className="font-display text-[30px] font-semibold num mt-4">{kes(v.price_kes)}</div>
              <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                {[['Cost', kes(rc)], ['Profit', kes(Number(v.price_kes || 0) - rc)], ['Margin', `${m}%`]].map(([k, x]) => <div key={k} className="rounded-[12px] bg-foreground/[.035] py-2"><div className="text-[11px] text-muted-foreground">{k}</div><div className={cn('text-[13px] font-semibold num', k === 'Margin' && m < 35 && 'text-danger')}>{x}</div></div>)}
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-[12.5px] text-muted-foreground mt-3"><span className="inline-flex items-center gap-1"><Clock className="size-3.5" />{v.delivery_days ? `${v.delivery_days} days` : v.duration_min ? `${v.duration_min} min` : '—'}{v.buffer_min ? ` + ${v.buffer_min} min buffer` : ''}</span><span>{Number(v.commission_pct || 0)}% commission</span>{Number(v.max_discount_pct ?? 100) < 100 && <span>max {Number(v.max_discount_pct)}% off</span>}{v.needs_space && <span>{humanize(v.needs_space)}</span>}{v.bookable_online && <span>online booking</span>}{v.is_recurring && <span>recurring</span>}</div>
              {v.id && hasRecipe(v.id) && <div className="text-[12px] tone-violet ink mt-2 inline-flex items-center gap-1"><FlaskConical className="size-3.5" />Cost comes from the product recipe</div>}
            </div>)
        }} />
      <RecordForm open={editCat !== undefined} onOpenChange={(v) => !v && setEditCat(undefined)} table="service_categories" initial={editCat} title={editCat ? 'Edit category' : 'Add service category'}
        fields={[{ name: 'name', label: 'Name', required: true }, { name: 'color', label: 'Colour', type: 'color' }, { name: 'sort', label: 'Display order', type: 'number' }, { name: 'business_id', label: 'Business', type: 'select', options: bizOpts }, { name: 'active', label: 'Active', type: 'switch' }]}
        defaults={{ color: '#C8A24A', sort: (C.length + 1) * 10, active: true }} activity={(v, n) => `${n ? 'Added' : 'Updated'} service category ${v.name}`} />
      <Package360 id={openPkg} onOpenChange={(v) => !v && setOpenPkg(null)} onEdit={(r) => { setOpenPkg(null); setEditPkg(r) }} />
      <RecordForm open={editPkg !== undefined} onOpenChange={(v) => !v && setEditPkg(undefined)} table="packages" initial={editPkg} title={editPkg ? 'Edit package' : 'Add package'}
        fields={[{ name: 'name', label: 'Name', required: true, span: 2 }, { name: 'price_kes', label: 'Package price (KES)', type: 'number', required: true }, { name: 'validity_days', label: 'Validity (days)', type: 'number' }, { name: 'business_id', label: 'Business', type: 'select', options: bizOpts }, { name: 'active', label: 'Active', type: 'switch' }, { name: 'description', label: 'Description', type: 'textarea', span: 2 }]}
        defaults={{ active: true, validity_days: 90, items: [] }} activity={(v, n) => `${n ? 'Added' : 'Updated'} package ${v.name}`}
        preview={(v) => { const val = pkgValue(v, rows); return (
          <Card title={v.name || 'New package'} sub={`${v.validity_days || 90} days validity`}>
            <ul className="space-y-1.5 text-[13px]">{(v.items || []).map((it: Row, i: number) => <li key={i} className="flex justify-between gap-2"><span>{it.name}</span><span className="text-muted-foreground num">×{it.qty}</span></li>)}{!(v.items || []).length && <li className="text-muted-foreground">Add services from the package 360 view.</li>}</ul>
            <div className="grid grid-cols-3 gap-2 mt-4 text-center">{[['Value', kes(val)], ['Price', kes(v.price_kes)], ['Saving', kes(Math.max(0, val - Number(v.price_kes || 0)))]].map(([k, x]) => <div key={k} className="rounded-[12px] bg-foreground/[.035] py-2"><div className="text-[11px] text-muted-foreground">{k}</div><div className="text-[13px] font-semibold num">{x}</div></div>)}</div>
          </Card>) }} />
    </div>
  )
}