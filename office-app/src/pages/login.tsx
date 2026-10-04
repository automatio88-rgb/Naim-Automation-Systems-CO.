import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { ArrowRight, Lock, Mail } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { isLocalPreview } from '@/lib/supabase'
import { gsap, useGSAP, prefersReduced } from '@/lib/gsap'
import { Button, Field, Input } from '@/components/ui'

export default function Login() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<'in' | 'up'>('in')
  const [email, setEmail] = useState(isLocalPreview ? 'owner@naim.demo' : '')
  const [password, setPassword] = useState(isLocalPreview ? 'naim-demo' : '')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const root = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (prefersReduced()) return
    const tl = gsap.timeline({ defaults: { ease: 'md-emph-decel' } })
    tl.from('[data-l="line"]', { yPercent: 110, duration: 0.9, stagger: 0.08 })
      .from('[data-l="fade"]', { autoAlpha: 0, y: 12, duration: 0.6, stagger: 0.06 }, '-=0.5')
      .from('[data-l="card"]', { autoAlpha: 0, y: 24, scale: 0.985, duration: 0.7 }, '-=0.6')
      .from('[data-l="rule"]', { scaleX: 0, transformOrigin: 'left', duration: 1.1 }, 0.2)
  }, { scope: root })

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true)
    try {
      if (mode === 'in') await signIn(email, password)
      else { await signUp(email, password, name); toast.success('Account created. Check your email to confirm, then sign in.'); setMode('in') }
    } catch (err: any) { toast.error(err.message || 'Sign in failed') } finally { setBusy(false) }
  }

  return (
    <div ref={root} className="min-h-dvh grid lg:grid-cols-[1.1fr_1fr] bg-background">
      <div className="rail-surface grain relative hidden lg:flex flex-col justify-between p-12 text-rail-foreground overflow-hidden">
        <div className="flex items-center gap-3" data-l="fade">
          <span className="size-10 rounded-[13px] grid place-items-center bg-primary text-primary-foreground font-display text-[21px] font-semibold">N</span>
          <span className="font-display text-[18px] font-semibold">NAIM COMMAND</span>
        </div>
        <div>
          <h1 className="font-display text-[56px] xl:text-[64px] leading-[1.02] font-semibold tracking-[-.02em]">
            <span className="block overflow-hidden"><span data-l="line" className="block">The whole company,</span></span>
            <span className="block overflow-hidden"><span data-l="line" className="block">on one <em className="text-primary not-italic font-display italic">calm</em> screen.</span></span>
          </h1>
          <div data-l="rule" className="h-px bg-primary/50 my-8 w-40" />
          <p data-l="fade" className="text-rail-muted text-[16px] max-w-[460px] leading-relaxed">Leads coming in, outreach going out, calls booked, projects delivered, invoices paid. Hermes runs the routine work while you run the business.</p>
        </div>
        <div data-l="fade" className="text-[12.5px] text-rail-muted">Naim Automation Systems Co. · Nairobi</div>
      </div>
      <div className="flex items-center justify-center p-6">
        <form data-l="card" onSubmit={submit} className="w-full max-w-[400px]">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <span className="size-10 rounded-[13px] grid place-items-center bg-primary text-primary-foreground font-display text-[21px] font-semibold">N</span>
            <span className="font-display text-[18px] font-semibold">NAIM COMMAND</span>
          </div>
          <h2 className="font-display text-[32px] font-semibold leading-tight">{mode === 'in' ? 'Welcome back' : 'Create your account'}</h2>
          <p className="text-muted-foreground mt-1.5 mb-7">{mode === 'in' ? 'Sign in to open the office.' : 'The first account becomes the owner.'}</p>
          <div className="grid gap-4">
            {mode === 'up' && <Field label="Full name"><Input value={name} onChange={(e) => setName(e.target.value)} required /></Field>}
            <Field label="Email"><div className="relative"><Mail className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input type="email" className="pl-9" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" /></div></Field>
            <Field label="Password"><div className="relative"><Lock className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input type="password" className="pl-9" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} autoComplete={mode === 'in' ? 'current-password' : 'new-password'} /></div></Field>
            <Button type="submit" size="lg" loading={busy} className="mt-2">{mode === 'in' ? 'Sign in' : 'Create account'}<ArrowRight /></Button>
          </div>
          {!isLocalPreview && (
            <p className="text-[13px] text-muted-foreground mt-6 text-center">
              {mode === 'in' ? 'New to the office?' : 'Already have an account?'}{' '}
              <button type="button" className="text-brand-strong font-medium hover:underline" onClick={() => setMode(mode === 'in' ? 'up' : 'in')}>{mode === 'in' ? 'Create an account' : 'Sign in'}</button>
            </p>
          )}
          {isLocalPreview && (
            <div className="mt-6 rounded-card bg-foreground/[.04] p-4 text-[13px] text-muted-foreground">
              Preview logins (password <span className="font-medium text-foreground">naim-demo</span>):
              <div className="mt-2 flex flex-wrap gap-2">
                {['owner@naim.demo', 'staff@naim.demo'].map((e) => <button key={e} type="button" onClick={() => setEmail(e)} className="rounded-full px-3 h-7 bg-card border border-border text-foreground text-[12.5px] hover:bg-foreground/[.03]">{e.split('@')[0]}</button>)}
              </div>
              <div className="mt-2 text-[12px]">Staff sees only what the Roles & Permissions matrix allows.</div>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}