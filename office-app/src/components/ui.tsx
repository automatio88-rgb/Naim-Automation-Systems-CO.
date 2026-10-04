// NAIM COMMAND UI kit — shadcn-style primitives on Radix, themed by CSS variables.
// Radius varies by hierarchy: controls 10px, chips/buttons full, cards 16px, panels 22px, dialogs 26px.
import { forwardRef, useRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react'
import * as RD from '@radix-ui/react-dialog'
import * as RS from '@radix-ui/react-select'
import * as RSw from '@radix-ui/react-switch'
import * as RC from '@radix-ui/react-checkbox'
import * as RT from '@radix-ui/react-tabs'
import * as RTip from '@radix-ui/react-tooltip'
import * as RM from '@radix-ui/react-dropdown-menu'
import * as RP from '@radix-ui/react-popover'
import { cva, type VariantProps } from 'class-variance-authority'
import { Check, ChevronDown, Loader2, X, Inbox } from 'lucide-react'
import { cn, initials, toneFor } from '@/lib/utils'
import { useCountUp } from '@/lib/motion'

export type Tone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'violet' | 'teal'
export type Opt = { value: string; label: ReactNode }

/* ---------- Button ---------- */
const btn = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-[background,color,box-shadow,transform] duration-200 ease-emph disabled:opacity-50 disabled:pointer-events-none active:scale-[.98] [&_svg]:size-4 [&_svg]:shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 select-none',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow-e1 hover:brightness-[1.06] hover:shadow-e2',
        dark: 'bg-foreground text-background hover:bg-foreground/90',
        outline: 'border border-input bg-card hover:bg-foreground/[.04] text-foreground',
        ghost: 'hover:bg-foreground/[.06] text-foreground',
        soft: 'bg-secondary text-brand-strong hover:bg-primary/25',
        danger: 'bg-danger text-white hover:brightness-110 shadow-e1',
        'danger-soft': 'bg-danger/12 text-danger hover:bg-danger/20',
        success: 'bg-success text-white hover:brightness-110 shadow-e1',
        link: 'text-brand-strong underline-offset-4 hover:underline px-0',
      },
      size: {
        default: 'h-10 px-4 rounded-full text-[14px]',
        sm: 'h-8 px-3 rounded-full text-[13px]',
        lg: 'h-11 px-5 rounded-full text-[15px]',
        icon: 'size-10 rounded-full',
        'icon-sm': 'size-8 rounded-full',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)
type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof btn> & { loading?: boolean }
export const Button = forwardRef<HTMLButtonElement, BtnProps>(({ className, variant, size, loading, children, disabled, type = 'button', ...p }, ref) => (
  <button ref={ref} type={type} className={cn(btn({ variant, size }), className)} disabled={disabled || loading} {...p}>
    {loading && <Loader2 className="animate-spin" />}{children}
  </button>
))
Button.displayName = 'Button'

/* ---------- Inputs ---------- */
const field = 'w-full rounded-control border border-input bg-card px-3 text-[14px] placeholder:text-muted-foreground/70 transition-[border-color,box-shadow] outline-none focus:border-primary focus:shadow-[0_0_0_3px_color-mix(in_oklab,var(--p)_22%,transparent)] disabled:opacity-60'
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className, ...p }, ref) => (
  <input ref={ref} className={cn(field, 'h-10', className)} {...p} />
))
Input.displayName = 'Input'
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...p }, ref) => (
  <textarea ref={ref} className={cn(field, 'py-2.5 min-h-[92px] resize-y', className)} {...p} />
))
Textarea.displayName = 'Textarea'

export function Field({ label, hint, children, className }: { label?: ReactNode; hint?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <label className={cn('grid gap-1.5 min-w-0', className)}>
      {label && <span className="text-[13px] font-medium text-foreground/85">{label}</span>}
      {children}
      {hint && <span className="text-[12px] text-muted-foreground">{hint}</span>}
    </label>
  )
}

export function Select({ value, onChange, options, placeholder = 'Select', className, size = 'default', allowClear }: {
  value?: string | null; onChange: (v: string) => void; options: Opt[]; placeholder?: string; className?: string; size?: 'default' | 'sm'; allowClear?: string
}) {
  const ALL = '__all__'
  const opts = allowClear ? [{ value: ALL, label: allowClear }, ...options.filter((o) => o.value !== '')] : options.filter((o) => o.value !== '')
  const v = value ? String(value) : allowClear ? ALL : ''
  return (
    <RS.Root value={v} onValueChange={(x) => onChange(x === ALL ? '' : x)}>
      <RS.Trigger className={cn(field, 'inline-flex items-center justify-between gap-2 text-left', size === 'sm' ? 'h-9 text-[13px]' : 'h-10', className)}>
        <span className="truncate"><RS.Value placeholder={<span className="text-muted-foreground/70">{placeholder}</span>} /></span>
        <RS.Icon><ChevronDown className="size-4 opacity-60" /></RS.Icon>
      </RS.Trigger>
      <RS.Portal>
        <RS.Content position="popper" sideOffset={6} className="anim-pop z-[80] min-w-[var(--radix-select-trigger-width)] max-h-[min(360px,var(--radix-select-content-available-height))] overflow-hidden rounded-[14px] border border-border bg-popover shadow-e3">
          <RS.Viewport className="p-1.5">
            {opts.map((o) => (
              <RS.Item key={o.value} value={o.value} className="relative flex items-center gap-2 rounded-[9px] pl-8 pr-3 py-2 text-[13.5px] outline-none cursor-pointer data-[highlighted]:bg-foreground/[.06]">
                <RS.ItemIndicator className="absolute left-2.5"><Check className="size-4 text-brand-strong" /></RS.ItemIndicator>
                <RS.ItemText>{o.label}</RS.ItemText>
              </RS.Item>
            ))}
          </RS.Viewport>
        </RS.Content>
      </RS.Portal>
    </RS.Root>
  )
}

export function Switch({ checked, onChange, disabled, label, tone = 'brand' }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean; label?: string; tone?: Tone }) {
  return (
    <RSw.Root checked={checked} onCheckedChange={onChange} disabled={disabled} aria-label={label}
      className={cn('tone-' + tone, 'relative h-6 w-11 shrink-0 rounded-full transition-colors bg-foreground/15 data-[state=checked]:fill-tone disabled:opacity-50')}>
      <RSw.Thumb className="block size-5 rounded-full bg-white shadow-e1 transition-transform duration-300 ease-emph translate-x-0.5 data-[state=checked]:translate-x-[22px]" />
    </RSw.Root>
  )
}

export function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2">
      <RC.Root checked={checked} onCheckedChange={(v) => onChange(v === true)} onClick={(e) => e.stopPropagation()}
        className="size-[18px] shrink-0 rounded-[6px] border border-input bg-card data-[state=checked]:bg-primary data-[state=checked]:border-transparent text-primary-foreground grid place-items-center">
        <RC.Indicator><Check className="size-3.5" strokeWidth={3} /></RC.Indicator>
      </RC.Root>
      {label && <span className="text-[13.5px]">{label}</span>}
    </span>
  )
}

/* ---------- Surfaces ---------- */
export function Card({ className, children, title, action, sub, pad = true, ...p }: { className?: string; children?: ReactNode; title?: ReactNode; action?: ReactNode; sub?: ReactNode; pad?: boolean } & Record<string, any>) {
  return (
    <section className={cn('rounded-card bg-card border border-border/70 shadow-e1 min-w-0', className)} {...p}>
      {(title || action) && (
        <header className="flex items-start justify-between gap-3 px-5 pt-4 pb-1">
          <div className="min-w-0">
            {title && <h3 className="text-[15px] font-semibold tracking-[-.005em]">{title}</h3>}
            {sub && <p className="text-[12.5px] text-muted-foreground mt-0.5">{sub}</p>}
          </div>
          {action && <div className="shrink-0 flex items-center gap-2">{action}</div>}
        </header>
      )}
      <div className={cn(pad && 'p-5', pad && (title || action) && 'pt-3')}>{children}</div>
    </section>
  )
}

export function Badge({ tone = 'neutral', children, dot, className }: { tone?: Tone; children: ReactNode; dot?: boolean; className?: string }) {
  return (
    <span className={cn('tone-' + tone, 'chip inline-flex items-center gap-1.5 rounded-full px-2.5 h-6 text-[12px] font-medium whitespace-nowrap', className)}>
      {dot && <span className="dot size-1.5 rounded-full" />}{children}
    </span>
  )
}
export const StatusBadge = ({ map, value }: { map: Record<string, { label: string; tone: Tone }>; value?: string | null }) => {
  const s = (value && map[value]) || { label: value ? value.replace(/_/g, ' ') : '—', tone: 'neutral' as Tone }
  return <Badge tone={s.tone} dot>{s.label}</Badge>
}

export function Avatar({ name, src, size = 32, className }: { name?: string | null; src?: string | null; size?: number; className?: string }) {
  const t = toneFor(name)
  return src ? <img src={src} alt="" className={cn('rounded-full object-cover shrink-0', className)} style={{ width: size, height: size }} />
    : <span className={cn('tone-' + t, 'chip rounded-full grid place-items-center shrink-0 font-semibold', className)} style={{ width: size, height: size, fontSize: size * 0.36 }}>{initials(name)}</span>
}

export const Skeleton = ({ className }: { className?: string }) => <div className={cn('animate-pulse rounded-md bg-foreground/[.07]', className)} />

export function Empty({ title, body, icon, action }: { title: string; body?: ReactNode; icon?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6">
      <div className="size-11 rounded-full bg-foreground/[.05] grid place-items-center text-muted-foreground mb-3 [&_svg]:size-5">{icon || <Inbox />}</div>
      <div className="font-medium">{title}</div>
      {body && <div className="text-[13px] text-muted-foreground mt-1 max-w-sm">{body}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function PageHeader({ title, sub, actions, children }: { title: ReactNode; sub?: ReactNode; actions?: ReactNode; children?: ReactNode }) {
  return (
    <div className="mb-6" data-reveal>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-[30px] sm:text-[34px] leading-[1.08] font-semibold tracking-[-.015em]">{title}</h1>
          {sub && <p className="text-muted-foreground mt-1.5 text-[14.5px]">{sub}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children && <div className="mt-5">{children}</div>}
    </div>
  )
}

/** KPI tile. `solid` = colored tile (salon dashboard), otherwise a quiet stat. */
export function Kpi({ label, value, format = (n) => Math.round(n).toLocaleString('en-KE'), icon, tone = 'brand', solid, foot, onClick }: {
  label: ReactNode; value: number; format?: (n: number) => string; icon?: ReactNode; tone?: Tone; solid?: boolean; foot?: ReactNode; onClick?: () => void
}) {
  const ref = useRef<HTMLSpanElement>(null)
  useCountUp(ref, value, format)
  const Tag: any = onClick ? 'button' : 'div'
  return (
    <Tag onClick={onClick} data-reveal className={cn('tone-' + tone, 'relative text-left rounded-card border p-4 min-w-0 overflow-hidden transition-transform duration-300 ease-emph',
      solid ? 'kpi-solid' : 'bg-card border-border/70 shadow-e1', onClick && 'hover:-translate-y-0.5 cursor-pointer')}>
      <div className="flex items-start justify-between gap-2">
        <div className={cn('text-[12.5px] font-medium leading-tight', solid ? 'kpi-muted' : 'text-muted-foreground')}>{label}</div>
        {icon && <div className={cn('kpi-icon size-8 rounded-full grid place-items-center shrink-0 [&_svg]:size-4', !solid && 'chip')}>{icon}</div>}
      </div>
      <div className="mt-2 text-[24px] font-semibold num tracking-[-.01em] leading-none"><span ref={ref}>{format(value)}</span></div>
      {foot && <div className={cn('mt-2 text-[12px]', solid ? 'kpi-muted' : 'text-muted-foreground')}>{foot}</div>}
    </Tag>
  )
}

/** Chevron status filter strip (salon template pattern). */
export function ChevronFilter({ items, value, onChange }: { items: { id: string; label: string; count?: number; tone?: Tone }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex overflow-x-auto scroll-thin -mx-1 px-1 pb-1">
      <div className="flex gap-[3px] min-w-max">
        {items.map((it) => (
          <button key={it.id} onClick={() => onChange(it.id)} aria-pressed={value === it.id}
            className={cn('chev tone-' + (it.tone || 'brand'), value === it.id ? 'chev-on' : 'chev-off', 'h-9 pl-6 pr-7 first:pl-4 text-[13px] font-medium transition-colors whitespace-nowrap')}>
            {it.label}{it.count !== undefined && <span className="ml-1.5 num opacity-80">{it.count}</span>}
          </button>
        ))}
      </div>
    </div>
  )
}

export function Segmented<T extends string>({ value, onChange, items, size = 'default' }: { value: T; onChange: (v: T) => void; items: { id: T; label: ReactNode }[]; size?: 'default' | 'sm' }) {
  return (
    <div className="inline-flex rounded-full bg-foreground/[.06] p-1 max-w-full overflow-x-auto scroll-thin">
      {items.map((it) => (
        <button key={it.id} onClick={() => onChange(it.id)} aria-pressed={value === it.id}
          className={cn('rounded-full whitespace-nowrap font-medium transition-[background,color,box-shadow] duration-200', size === 'sm' ? 'px-3 h-7 text-[12.5px]' : 'px-3.5 h-8 text-[13px]',
            value === it.id ? 'bg-card text-foreground shadow-e1' : 'text-muted-foreground hover:text-foreground')}>{it.label}</button>
      ))}
    </div>
  )
}

export function Progress({ value, tone = 'brand', className }: { value: number; tone?: Tone; className?: string }) {
  return (
    <div className={cn('h-1.5 rounded-full bg-foreground/[.08] overflow-hidden', className)}>
      <div className={cn('tone-' + tone, 'fill-tone h-full rounded-full transition-transform duration-700 ease-emph origin-left')} style={{ transform: `scaleX(${Math.max(0, Math.min(100, value)) / 100})` }} />
    </div>
  )
}

export function Stat({ label, value, className }: { label: ReactNode; value: ReactNode; className?: string }) {
  return (
    <div className={cn('min-w-0', className)}>
      <div className="text-[12px] text-muted-foreground">{label}</div>
      <div className="font-medium num truncate">{value}</div>
    </div>
  )
}

/* ---------- Overlays ---------- */
const sizes = { sm: 'max-w-[440px]', md: 'max-w-[620px]', lg: 'max-w-[820px]', xl: 'max-w-[1040px]' }
export function Dialog({ open, onOpenChange, title, description, children, footer, size = 'md', headerExtra }: {
  open: boolean; onOpenChange: (v: boolean) => void; title: ReactNode; description?: ReactNode; children?: ReactNode; footer?: ReactNode; size?: keyof typeof sizes; headerExtra?: ReactNode
}) {
  return (
    <RD.Root open={open} onOpenChange={onOpenChange}>
      <RD.Portal>
        <RD.Overlay className="anim-fade fixed inset-0 z-[60] bg-[rgb(12_9_6/.55)] backdrop-blur-[3px]" />
        <RD.Content className={cn('anim-dialog fixed z-[70] inset-x-3 top-[4vh] sm:inset-x-0 sm:mx-auto bottom-auto max-h-[92vh] flex flex-col rounded-dialog bg-popover border border-border shadow-e3 outline-none', sizes[size])}>
          <div className="flex items-start gap-3 px-6 pt-5 pb-4 border-b border-border/70">
            <div className="min-w-0 flex-1">
              <RD.Title className="font-display text-[22px] font-semibold leading-tight">{title}</RD.Title>
              {description ? <RD.Description className="text-[13.5px] text-muted-foreground mt-1">{description}</RD.Description> : <RD.Description className="sr-only">Dialog</RD.Description>}
            </div>
            {headerExtra}
            <RD.Close asChild><Button variant="ghost" size="icon-sm" aria-label="Close"><X /></Button></RD.Close>
          </div>
          <div className="flex-1 overflow-y-auto scroll-thin px-6 py-5">{children}</div>
          {footer && <div className="flex flex-wrap justify-end gap-2 px-6 py-4 border-t border-border/70">{footer}</div>}
        </RD.Content>
      </RD.Portal>
    </RD.Root>
  )
}

export function Sheet({ open, onOpenChange, title, description, children, footer, width = 560, side = 'right' }: {
  open: boolean; onOpenChange: (v: boolean) => void; title: ReactNode; description?: ReactNode; children?: ReactNode; footer?: ReactNode; width?: number; side?: 'right' | 'left'
}) {
  return (
    <RD.Root open={open} onOpenChange={onOpenChange}>
      <RD.Portal>
        <RD.Overlay className="anim-fade fixed inset-0 z-[60] bg-[rgb(12_9_6/.45)] backdrop-blur-[2px]" />
        <RD.Content style={{ width: `min(${width}px, 100vw)` }}
          className={cn('fixed z-[70] top-0 bottom-0 flex flex-col bg-popover shadow-e3 outline-none', side === 'right' ? 'anim-sheet right-0 rounded-l-[26px]' : 'anim-sheet-left left-0')}>
          {title !== null && (
            <div className="flex items-start gap-3 px-6 pt-5 pb-4 border-b border-border/70">
              <div className="min-w-0 flex-1">
                <RD.Title className="font-display text-[22px] font-semibold leading-tight">{title}</RD.Title>
                {description ? <RD.Description className="text-[13.5px] text-muted-foreground mt-1">{description}</RD.Description> : <RD.Description className="sr-only">Panel</RD.Description>}
              </div>
              <RD.Close asChild><Button variant="ghost" size="icon-sm" aria-label="Close"><X /></Button></RD.Close>
            </div>
          )}
          {title === null && <><RD.Title className="sr-only">Navigation</RD.Title><RD.Description className="sr-only">Navigation</RD.Description></>}
          <div className="flex-1 overflow-y-auto scroll-thin">{children}</div>
          {footer && <div className="flex flex-wrap justify-end gap-2 px-6 py-4 border-t border-border/70">{footer}</div>}
        </RD.Content>
      </RD.Portal>
    </RD.Root>
  )
}

export function Confirm({ open, onOpenChange, title, body, confirm = 'Confirm', danger, onConfirm, loading }: {
  open: boolean; onOpenChange: (v: boolean) => void; title: string; body?: ReactNode; confirm?: string; danger?: boolean; onConfirm: () => void; loading?: boolean
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} title={title} size="sm"
      footer={<><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button variant={danger ? 'danger' : 'default'} loading={loading} onClick={onConfirm}>{confirm}</Button></>}>
      <div className="text-[14px] text-muted-foreground">{body}</div>
    </Dialog>
  )
}

/* ---------- Tabs ---------- */
export function Tabs({ value, onChange, items, children, className }: { value: string; onChange: (v: string) => void; items: { id: string; label: ReactNode; count?: number }[]; children?: ReactNode; className?: string }) {
  return (
    <RT.Root value={value} onValueChange={onChange} className={className}>
      <RT.List className="flex gap-1 border-b border-border/70 overflow-x-auto scroll-thin">
        {items.map((it) => (
          <RT.Trigger key={it.id} value={it.id}
            className="relative px-3.5 h-10 text-[13.5px] font-medium text-muted-foreground whitespace-nowrap hover:text-foreground data-[state=active]:text-foreground after:absolute after:inset-x-3 after:-bottom-px after:h-[2px] after:rounded-full after:bg-transparent data-[state=active]:after:bg-foreground">
            {it.label}{it.count !== undefined && <span className="ml-1.5 text-[12px] num text-muted-foreground">{it.count}</span>}
          </RT.Trigger>
        ))}
      </RT.List>
      {children}
    </RT.Root>
  )
}
export const TabPanel = ({ id, children, className }: { id: string; children: ReactNode; className?: string }) =>
  <RT.Content value={id} className={cn('pt-4 outline-none', className)}>{children}</RT.Content>

/* ---------- Menus / tips ---------- */
export function Menu({ trigger, items, align = 'end' }: { trigger: ReactNode; items: ({ label: ReactNode; icon?: ReactNode; onSelect: () => void; danger?: boolean } | 'sep')[]; align?: 'start' | 'end' }) {
  return (
    <RM.Root>
      <RM.Trigger asChild>{trigger}</RM.Trigger>
      <RM.Portal>
        <RM.Content align={align} sideOffset={6} className="anim-pop z-[80] min-w-[200px] rounded-[14px] border border-border bg-popover p-1.5 shadow-e3">
          {items.map((it, i) => it === 'sep' ? <RM.Separator key={i} className="my-1 h-px bg-border" /> : (
            <RM.Item key={i} onSelect={it.onSelect} className={cn('flex items-center gap-2.5 rounded-[9px] px-2.5 py-2 text-[13.5px] outline-none cursor-pointer data-[highlighted]:bg-foreground/[.06] [&_svg]:size-4', it.danger && 'text-danger')}>
              {it.icon}{it.label}
            </RM.Item>
          ))}
        </RM.Content>
      </RM.Portal>
    </RM.Root>
  )
}
export function Popover({ trigger, children, align = 'end', className }: { trigger: ReactNode; children: ReactNode; align?: 'start' | 'end' | 'center'; className?: string }) {
  return (
    <RP.Root>
      <RP.Trigger asChild>{trigger}</RP.Trigger>
      <RP.Portal>
        <RP.Content align={align} sideOffset={8} className={cn('anim-pop z-[80] rounded-[18px] border border-border bg-popover shadow-e3 outline-none', className)}>{children}</RP.Content>
      </RP.Portal>
    </RP.Root>
  )
}
export function Tip({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <RTip.Root delayDuration={250}>
      <RTip.Trigger asChild>{children}</RTip.Trigger>
      <RTip.Portal><RTip.Content sideOffset={6} className="z-[90] rounded-[8px] bg-foreground text-background px-2.5 py-1.5 text-[12px]">{label}</RTip.Content></RTip.Portal>
    </RTip.Root>
  )
}
export const TipProvider = RTip.Provider
export const DialogClose = RD.Close