import { useState } from 'react'
import { Clock, Plus, Sparkles, Package, Tag } from 'lucide-react'
import { useList, type Row } from '@/services/db'
import { useAuth } from '@/lib/auth'
import { useBiz } from '@/lib/business'
import { kes, humanize } from '@/lib/utils'
import { Badge, Button, Card, Kpi, PageHeader, TabPanel, Tabs } from '@/components/ui'
import { DataTable } from '@/components/data-table'
import { RecordForm } from '@/components/form'

export default function Services() {
  const { can } = useAuth()
  const { businesses } = useBiz()
  const svc = useList('services', { select: '*, service_categories(name,color), businesses(name)', filter: (b) => b.is('deleted_at', null), order: ['name', true] })
  const cats = useList('service_categories', { order: ['sort', true] })
  const pkgs = useList('packages', { order: ['price_kes', true] })
  const [tab, setTab] = useState('services')
  const [edit, setEdit] = useState<Row | null | undefined>(undefined)
  const [editCat, setEditCat] = useState<Row | null | undefined>(undefined)
  const [editPkg, setEditPkg] = useState<Row | null | undefined>(undefined)
  const catOpts = (cats.data || []).map((c) => ({ value: c.id, label: c.name }))
  const bizOpts = businesses.map((b) => ({ value: b.id, label: b.name }))
  const rows = svc.data || []
  return (
    <div>
      <PageHeader title="Services" sub="What we sell: builds, automations, training and care"
        actions={can('services', 'create') && <Button onClick={() => (tab === 'categories' ? setEditCat(null) : tab === 'packages' ? setEditPkg(null) : setEdit(null))}><Plus />Add {tab === 'categories' ? 'category' : tab === 'packages' ? 'package' : 'service'}</Button>} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-5">
        <Kpi solid tone="brand" label="Active services" value={rows.filter((r) => r.active).length} icon={<Sparkles />} />
        <Kpi solid tone="info" label="Categories" value={cats.data?.length || 0} icon={<Tag />} />
        <Kpi solid tone="violet" label="Packages" value={pkgs.data?.length || 0} icon={<Package />} />
        <Kpi solid tone="success" label="Average price" value={rows.length ? rows.reduce((s, r) => s + Number(r.price_kes), 0) / rows.length : 0} format={(n) => kes(n)} />
      </div>
      <Tabs value={tab} onChange={setTab} items={[{ id: 'services', label: 'Services', count: rows.length }, { id: 'categories', label: 'Categories' }, { id: 'packages', label: 'Packages' }]}>
        <TabPanel id="services">
          <DataTable rows={rows} loading={svc.isLoading} onRow={setEdit} searchKeys={['name', 'description', 'service_categories.name']} exportName="services" initialSort={['price_kes', 'desc']}
            cols={[
              { key: 'name', label: 'Service', sort: true, render: (r) => <div><div className="font-medium">{r.name}</div><div className="text-[12px] text-muted-foreground line-clamp-1 max-w-[360px]">{r.description}</div></div> },
              { key: 'service_categories.name', label: 'Category', render: (r) => r.service_categories ? <span className="inline-flex items-center gap-2"><span className="size-2 rounded-full" style={{ background: r.service_categories.color }} />{r.service_categories.name}</span> : '—' },
              { key: 'delivery_days', label: 'Delivery', hideBelow: 'md', render: (r) => r.delivery_days ? `${r.delivery_days} days` : r.duration_min ? `${r.duration_min} min` : '—' },
              { key: 'commission_pct', label: 'Commission', hideBelow: 'lg', align: 'right', render: (r) => `${Number(r.commission_pct || 0)}%` },
              { key: 'active', label: 'Status', render: (r) => <Badge tone={r.active ? 'success' : 'neutral'} dot>{r.active ? 'Active' : 'Hidden'}</Badge> },
              { key: 'price_kes', label: 'Price', align: 'right', sort: true, render: (r) => <span className="font-medium">{kes(r.price_kes)}</span> },
            ]} />
        </TabPanel>
        <TabPanel id="categories">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">{(cats.data || []).map((c) => (
            <button key={c.id} onClick={() => setEditCat(c)} className="text-left rounded-card bg-card border border-border/70 shadow-e1 p-4 hover:shadow-e2 transition-shadow">
              <span className="block size-9 rounded-[12px]" style={{ background: c.color }} />
              <div className="font-semibold mt-3">{c.name}</div><div className="text-[12.5px] text-muted-foreground">{rows.filter((r) => r.category_id === c.id).length} services</div>
            </button>))}</div>
        </TabPanel>
        <TabPanel id="packages">
          <div className="grid md:grid-cols-3 gap-4">{(pkgs.data || []).map((p) => (
            <Card key={p.id} title={p.name} sub={`${p.validity_days || 90} days validity`} action={<Button size="sm" variant="ghost" onClick={() => setEditPkg(p)}>Edit</Button>}>
              <div className="font-display text-[28px] font-semibold num">{kes(p.price_kes)}</div>
              <p className="text-[13px] text-muted-foreground mt-1">{p.description}</p>
              <ul className="mt-3 space-y-1.5 text-[13px]">{(p.items || []).map((it: Row, i: number) => <li key={i} className="flex justify-between gap-2"><span>{it.name}</span><span className="text-muted-foreground num">x{it.qty}</span></li>)}</ul>
            </Card>))}</div>
        </TabPanel>
      </Tabs>
      <RecordForm open={edit !== undefined} onOpenChange={(v) => !v && setEdit(undefined)} table="services" initial={edit} title={edit ? 'Edit service' : 'Add service'}
        fields={[{ name: 'name', label: 'Service name', required: true, span: 2 }, { name: 'category_id', label: 'Category', type: 'select', options: catOpts }, { name: 'business_id', label: 'Business', type: 'select', options: bizOpts },
          { name: 'price_kes', label: 'Price (KES)', type: 'number', required: true }, { name: 'commission_pct', label: 'Commission %', type: 'number' },
          { name: 'delivery_days', label: 'Delivery (days)', type: 'number' }, { name: 'duration_min', label: 'Session length (min)', type: 'number' },
          { name: 'is_recurring', label: 'Recurring', type: 'switch' }, { name: 'active', label: 'Active', type: 'switch' }, { name: 'description', label: 'Description', type: 'textarea' }]}
        defaults={{ active: true, commission_pct: 5, business_id: businesses.find((b) => b.is_primary)?.id }} activity={(v, n) => `${n ? 'Added' : 'Updated'} service ${v.name}`}
        preview={(v) => {
          const c = (cats.data || []).find((x) => x.id === v.category_id)
          return (
            <div className="rounded-card bg-card border border-border/70 p-5 shadow-e1">
              <div className="flex items-center gap-2">{c && <span className="inline-flex items-center gap-1.5 text-[12px]"><span className="size-2 rounded-full" style={{ background: c.color }} />{c.name}</span>}<Badge tone={v.active ? 'success' : 'neutral'} dot className="ml-auto">{v.active ? 'Active' : 'Hidden'}</Badge></div>
              <div className="font-semibold text-[17px] mt-3">{v.name || 'New service'}</div>
              <p className="text-[13px] text-muted-foreground mt-1 line-clamp-4">{v.description || 'Description appears here.'}</p>
              <div className="font-display text-[30px] font-semibold num mt-4">{kes(v.price_kes)}</div>
              <div className="flex gap-3 text-[12.5px] text-muted-foreground mt-2"><span className="inline-flex items-center gap-1"><Clock className="size-3.5" />{v.delivery_days ? `${v.delivery_days} days` : v.duration_min ? `${v.duration_min} min` : '—'}</span><span>{Number(v.commission_pct || 0)}% commission</span>{v.is_recurring && <span>{humanize('recurring')}</span>}</div>
            </div>)
        }} />
      <RecordForm open={editCat !== undefined} onOpenChange={(v) => !v && setEditCat(undefined)} table="service_categories" initial={editCat} title={editCat ? 'Edit category' : 'Add category'}
        fields={[{ name: 'name', label: 'Name', required: true }, { name: 'color', label: 'Colour', type: 'color' }, { name: 'sort', label: 'Order', type: 'number' }]} defaults={{ color: '#C8A24A', sort: 10 }} />
      <RecordForm open={editPkg !== undefined} onOpenChange={(v) => !v && setEditPkg(undefined)} table="packages" initial={editPkg} title={editPkg ? 'Edit package' : 'Add package'}
        fields={[{ name: 'name', label: 'Name', required: true, span: 2 }, { name: 'price_kes', label: 'Price (KES)', type: 'number', required: true }, { name: 'validity_days', label: 'Validity (days)', type: 'number' }, { name: 'active', label: 'Active', type: 'switch' }, { name: 'description', label: 'Description', type: 'textarea' }]}
        defaults={{ active: true, validity_days: 90, items: [] }} />
    </div>
  )
}