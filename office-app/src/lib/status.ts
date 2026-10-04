import type { Tone } from '@/components/ui'

/** One source of truth for status → label/tone across modules. */
export const LEAD_STATUS: Record<string, { label: string; tone: Tone }> = {
  new: { label: 'New', tone: 'neutral' }, enriched: { label: 'Enriched', tone: 'info' }, queued: { label: 'Queued', tone: 'teal' },
  sent: { label: 'Sent', tone: 'info' }, replied: { label: 'Replied', tone: 'success' }, booked: { label: 'Booked', tone: 'violet' },
  converted: { label: 'Converted', tone: 'brand' }, dead: { label: 'Dead', tone: 'danger' },
}
export const QUALITY: Record<string, { label: string; tone: Tone }> = {
  high: { label: 'High', tone: 'success' }, medium: { label: 'Medium', tone: 'warning' }, low: { label: 'Low', tone: 'danger' },
}
export const scoreTone = (s: number): Tone => (s >= 75 ? 'success' : s >= 50 ? 'warning' : s > 0 ? 'danger' : 'neutral')

export const DEAL_STAGES = [
  { id: 'discovery', label: 'Discovery booked', tone: 'neutral' as Tone },
  { id: 'consultation', label: 'Consultation held', tone: 'info' as Tone },
  { id: 'proposal', label: 'Quotation sent', tone: 'teal' as Tone },
  { id: 'contract', label: 'Contract signed', tone: 'violet' as Tone },
  { id: 'deposit_paid', label: 'Deposit paid', tone: 'warning' as Tone },
  { id: 'won', label: 'Won', tone: 'success' as Tone },
  { id: 'lost', label: 'Lost', tone: 'danger' as Tone },
]
export const dealStage = (s: string) => DEAL_STAGES.find((x) => x.id === s) || DEAL_STAGES[0]

export const PROJECT_STATUS: Record<string, { label: string; tone: Tone }> = {
  materials_pending: { label: 'Materials pending', tone: 'warning' }, in_build: { label: 'In build', tone: 'info' }, review: { label: 'Review', tone: 'teal' },
  live_demo: { label: 'Live demo', tone: 'violet' }, delivered: { label: 'Delivered', tone: 'success' }, in_care_plan: { label: 'In care plan', tone: 'brand' },
  on_hold: { label: 'On hold', tone: 'neutral' }, cancelled: { label: 'Cancelled', tone: 'danger' },
}
export const INVOICE_STATUS: Record<string, { label: string; tone: Tone }> = {
  draft: { label: 'Draft', tone: 'neutral' }, sent: { label: 'Sent', tone: 'info' }, partial: { label: 'Partial', tone: 'warning' },
  paid: { label: 'Paid', tone: 'success' }, overdue: { label: 'Overdue', tone: 'danger' }, void: { label: 'Void', tone: 'neutral' },
}
export const APPT_STATUS: Record<string, { label: string; tone: Tone }> = {
  booked: { label: 'Booked', tone: 'neutral' }, confirmed: { label: 'Confirmed', tone: 'info' }, checked_in: { label: 'Checked in', tone: 'teal' },
  in_progress: { label: 'In progress', tone: 'violet' }, completed: { label: 'Completed', tone: 'success' }, no_show: { label: 'No-show', tone: 'danger' }, cancelled: { label: 'Cancelled', tone: 'neutral' },
}
export const TASK_PRIORITY: Record<string, Tone> = { low: 'neutral', medium: 'info', high: 'warning', urgent: 'danger' }
export const RUN_STATUS: Record<string, Tone> = { running: 'info', success: 'success', failed: 'danger', skipped: 'warning' }
export const PAY_METHODS = [{ value: 'mpesa', label: 'M-PESA' }, { value: 'bank', label: 'Bank transfer' }, { value: 'cash', label: 'Cash' }, { value: 'card', label: 'Card' }]
export const methodLabel = (m: string) => PAY_METHODS.find((x) => x.value === m)?.label || m
export const opts = (o: Record<string, { label: string }>) => Object.entries(o).map(([value, v]) => ({ value, label: v.label }))