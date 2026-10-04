// Generic record form used by catalogue / HR / inventory / finance modules.
// Supports a two-pane layout with a Live Preview (salon template pattern).
import { useEffect, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { Button, Checkbox, Dialog, Field, Input, Select, Switch, Textarea, type Opt } from './ui'
import { insert, update, logActivity, type Row } from '@/services/db'
import { cn } from '@/lib/utils'

export type FieldDef = {
  name: string
  label: string
  type?: 'text' | 'number' | 'email' | 'tel' | 'date' | 'datetime' | 'time' | 'textarea' | 'select' | 'switch' | 'color' | 'tags' | 'checkbox'
  options?: Opt[]
  required?: boolean
  placeholder?: string
  hint?: string
  span?: 2
  min?: number
  step?: number
}

export function RecordForm({ open, onOpenChange, table, title, description, fields, initial, defaults = {}, preview, onSaved, transform, activity, size }: {
  open: boolean; onOpenChange: (v: boolean) => void; table: string; title: string; description?: string; fields: FieldDef[]
  initial?: Row | null; defaults?: Row; preview?: (v: Row) => ReactNode; onSaved?: (r: Row) => void; transform?: (v: Row) => Row
  activity?: (v: Row, isNew: boolean) => string; size?: 'md' | 'lg' | 'xl'
}) {
  const [v, setV] = useState<Row>({})
  const [busy, setBusy] = useState(false)
  useEffect(() => { if (open) setV({ ...defaults, ...(initial || {}) }) }, [open, initial]) // eslint-disable-line react-hooks/exhaustive-deps
  const set = (k: string, val: unknown) => setV((s) => ({ ...s, [k]: val }))

  async function save() {
    for (const f of fields) if (f.required && (v[f.name] === undefined || v[f.name] === null || v[f.name] === '')) return toast.error(`${f.label} is required`)
    const payload: Row = {}
    for (const f of fields) {
      let x = v[f.name]
      if (f.type === 'number') x = x === '' || x == null ? null : Number(x)
      if (f.type === 'tags' && typeof x === 'string') x = x.split(',').map((s: string) => s.trim()).filter(Boolean)
      if (f.type === 'datetime' && x) x = new Date(x).toISOString()
      if ((f.type === 'date' || f.type === 'select' || f.type === 'time') && x === '') x = null
      payload[f.name] = x
    }
    Object.keys(defaults).forEach((k) => { if (!(k in payload) && !initial) payload[k] = defaults[k] })
    const final = transform ? transform(payload) : payload
    setBusy(true)
    try {
      const r = initial?.id ? await update(table, initial.id, final) : await insert(table, final)
      if (activity) await logActivity(activity(final, !initial?.id), `${table}_${initial?.id ? 'updated' : 'created'}`, table.replace(/s$/, ''), r?.id)
      toast.success(initial?.id ? 'Saved' : 'Created')
      onSaved?.(r); onOpenChange(false)
    } catch (e: any) { toast.error(e.message) } finally { setBusy(false) }
  }

  const form = (
    <div className="grid sm:grid-cols-2 gap-4">
      {fields.map((f) => <FieldInput key={f.name} f={f} value={v[f.name]} onChange={(x) => set(f.name, x)} />)}
    </div>
  )
  return (
    <Dialog open={open} onOpenChange={onOpenChange} title={title} description={description} size={size || (preview ? 'xl' : 'md')}
      footer={<><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button loading={busy} onClick={save}>{initial?.id ? 'Save changes' : 'Create'}</Button></>}>
      {preview ? (
        <div className="grid lg:grid-cols-[1fr_360px] gap-6">
          {form}
          <div className="hidden lg:block">
            <div className="sticky top-0 rounded-panel bg-foreground/[.035] p-4">
              <div className="text-[12px] font-medium text-muted-foreground mb-3">Live preview</div>
              {preview(v)}
            </div>
          </div>
        </div>
      ) : form}
    </Dialog>
  )
}

export function FieldInput({ f, value, onChange }: { f: FieldDef; value: any; onChange: (v: any) => void }) {
  const t = f.type || 'text'
  let control: ReactNode
  if (t === 'textarea') control = <Textarea value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={f.placeholder} />
  else if (t === 'select') control = <Select value={value ?? ''} onChange={onChange} options={f.options || []} placeholder={f.placeholder || 'Select'} />
  else if (t === 'switch') control = <div className="h-10 flex items-center"><Switch checked={!!value} onChange={onChange} /></div>
  else if (t === 'checkbox') control = <div className="h-10 flex items-center"><Checkbox checked={!!value} onChange={onChange} /></div>
  else if (t === 'color') control = (
    <div className="flex items-center gap-2">
      <input type="color" value={value || '#C8A24A'} onChange={(e) => onChange(e.target.value)} className="h-10 w-12 rounded-control border border-input bg-card p-1" />
      <Input value={value || ''} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
  else if (t === 'tags') control = <Input value={Array.isArray(value) ? value.join(', ') : value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={f.placeholder || 'Comma separated'} />
  else {
    const it = t === 'datetime' ? 'datetime-local' : t
    let val = value ?? ''
    if (t === 'datetime' && val) { const d = new Date(val); val = isNaN(+d) ? val : new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 16) }
    control = <Input type={it} value={val} min={f.min} step={f.step ?? (t === 'number' ? 'any' : undefined)} onChange={(e) => onChange(e.target.value)} placeholder={f.placeholder} />
  }
  return <Field label={<>{f.label}{f.required && <span className="text-danger"> *</span>}</>} hint={f.hint} className={cn((f.span === 2 || t === 'textarea') && 'sm:col-span-2')}>{control}</Field>
}