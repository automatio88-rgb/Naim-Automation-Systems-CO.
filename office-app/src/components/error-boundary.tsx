// Catches render errors so one broken module never blanks the whole app (masterprompt Phase 5).
import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

type Props = { children: ReactNode; full?: boolean; resetKey?: unknown }
type State = { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }
  static getDerivedStateFromError(error: Error): State { return { error } }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('NAIM COMMAND render error', error, info.componentStack) }
  componentDidUpdate(prev: Props) { if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null }) }
  render() {
    const { error } = this.state
    if (!error) return this.props.children
    const chunk = /Loading chunk|dynamically imported module|Failed to fetch/i.test(error.message)
    return (
      <div className={this.props.full ? 'min-h-dvh grid place-items-center p-6' : 'grid place-items-center py-16 px-4'}>
        <div className="max-w-md w-full rounded-card border border-border/70 bg-card shadow-e1 p-6 text-center">
          <span className="tone-danger chip size-11 rounded-full grid place-items-center mx-auto"><AlertTriangle className="size-5" /></span>
          <div className="font-semibold text-[17px] mt-4">{chunk ? 'A new version is available' : 'This page hit a problem'}</div>
          <p className="text-[13.5px] text-muted-foreground mt-1.5">{chunk ? 'Reload to get the latest NAIM COMMAND.' : 'Your data is safe. Try again, or open another module from the sidebar.'}</p>
          {!chunk && <pre className="text-[11.5px] text-left bg-foreground/[.04] rounded-[10px] p-3 mt-4 overflow-auto max-h-32 whitespace-pre-wrap">{error.message}</pre>}
          <div className="flex gap-2 justify-center mt-5">
            <button className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-primary text-primary-foreground text-[13.5px] font-medium" onClick={() => (chunk ? location.reload() : this.setState({ error: null }))}><RotateCcw className="size-4" />{chunk ? 'Reload' : 'Try again'}</button>
            {!chunk && <button className="h-9 px-4 rounded-full border border-border text-[13.5px]" onClick={() => location.assign('/')}>Go to dashboard</button>}
          </div>
        </div>
      </div>
    )
  }
}