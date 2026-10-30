/**
 * @file ui.tsx
 * @description Componentes visuais base da área do aluno (Tailwind + Lucide, paleta roxa).
 */
import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type ReactNode,
} from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import { CircleAlert, CircleCheck, Inbox, Info, LoaderCircle, RefreshCw, X, type LucideIcon } from 'lucide-react'

export type Icon = LucideIcon

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}

// ─── Botões ─────────────────────────────────────────────────────

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'light' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-on-primary hover:bg-primary-strong shadow-sm',
  secondary: 'bg-surface-container text-primary hover:bg-surface-container-highest',
  outline: 'border border-outline-variant bg-white text-primary hover:bg-surface-container-low',
  ghost: 'text-primary hover:bg-surface-container-low',
  light: 'bg-white text-primary hover:bg-surface-container-low shadow-lg',
  danger: 'bg-error text-white hover:opacity-90',
}

const SIZES: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2.5 text-sm gap-2',
  lg: 'px-6 py-3.5 text-sm gap-2',
}

const BUTTON_BASE =
  'inline-flex items-center justify-center rounded-xl font-bold transition-all duration-150 active:scale-[0.98] disabled:opacity-60 disabled:active:scale-100 cursor-pointer select-none'

export function buttonClasses(variant: ButtonVariant = 'primary', size: ButtonSize = 'md', extra?: string) {
  return cn(BUTTON_BASE, VARIANTS[variant], SIZES[size], extra)
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  icon?: Icon
  iconRight?: Icon
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading = false, icon: IconLeft, iconRight: IconRight, className, children, disabled, type = 'button', ...rest },
  ref,
) {
  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClasses(variant, size, className)}
      {...rest}
    >
      {loading ? (
        <LoaderCircle className={cn(iconSize, 'animate-spin')} aria-hidden />
      ) : (
        IconLeft && <IconLeft className={iconSize} aria-hidden />
      )}
      {children}
      {IconRight && !loading && <IconRight className={iconSize} aria-hidden />}
    </button>
  )
})

export function ButtonLink({
  variant = 'primary',
  size = 'md',
  icon: IconLeft,
  iconRight: IconRight,
  className,
  children,
  ...rest
}: LinkProps & { variant?: ButtonVariant; size?: ButtonSize; icon?: Icon; iconRight?: Icon }) {
  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'
  return (
    <Link className={buttonClasses(variant, size, className)} {...rest}>
      {IconLeft && <IconLeft className={iconSize} aria-hidden />}
      {children}
      {IconRight && <IconRight className={iconSize} aria-hidden />}
    </Link>
  )
}

export function ExternalButtonLink({
  variant = 'primary',
  size = 'md',
  icon: IconLeft,
  className,
  children,
  ...rest
}: AnchorHTMLAttributes<HTMLAnchorElement> & { variant?: ButtonVariant; size?: ButtonSize; icon?: Icon }) {
  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'
  return (
    <a target="_blank" rel="noopener noreferrer" className={buttonClasses(variant, size, className)} {...rest}>
      {IconLeft && <IconLeft className={iconSize} aria-hidden />}
      {children}
    </a>
  )
}

// ─── Superfícies e rótulos ──────────────────────────────────────

export function Card({ className, children, as: As = 'div' }: { className?: string; children: ReactNode; as?: 'div' | 'section' | 'article' | 'aside' }) {
  return <As className={cn('rounded-2xl bg-white p-4 shadow-card sm:p-6', className)}>{children}</As>
}

type BadgeTone = 'primary' | 'soft' | 'strong' | 'neutral' | 'danger' | 'white'

const BADGE_TONES: Record<BadgeTone, string> = {
  primary: 'bg-primary text-on-primary',
  soft: 'bg-surface-container text-primary',
  strong: 'bg-secondary-container text-on-secondary-container',
  neutral: 'bg-surface-container-low text-muted',
  danger: 'bg-error-container text-on-error-container',
  white: 'bg-white/15 text-white',
}

export function Badge({ tone = 'soft', icon: IconLeft, className, children }: { tone?: BadgeTone; icon?: Icon; className?: string; children: ReactNode }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none whitespace-nowrap', BADGE_TONES[tone], className)}>
      {IconLeft && <IconLeft className="h-3.5 w-3.5" aria-hidden />}
      {children}
    </span>
  )
}

export function CardTitle({ icon: IconLeft, children, aside }: { icon?: Icon; children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <h2 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-on-surface">
        {IconLeft && <IconLeft className="h-4 w-4 text-primary" aria-hidden />}
        {children}
      </h2>
      {aside}
    </div>
  )
}

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: ReactNode; title: ReactNode; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="flex max-w-3xl flex-col gap-1">
        {eyebrow && <span className="text-xs font-bold uppercase tracking-wider text-secondary">{eyebrow}</span>}
        <h1 className="text-2xl font-bold tracking-tight text-on-surface lg:text-[28px]">{title}</h1>
        {description && <p className="text-sm leading-relaxed text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function ProgressBar({ value, label, className, tone = 'primary' }: { value: number; label: string; className?: string; tone?: 'primary' | 'light' }) {
  const pct = Math.min(100, Math.max(0, Math.round(value)))
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      className={cn('h-2 w-full overflow-hidden rounded-full', tone === 'light' ? 'bg-white/20' : 'bg-surface-container', className)}
    >
      <div
        className={cn('h-full rounded-full transition-all duration-500', tone === 'light' ? 'bg-white' : 'bg-gradient-to-r from-primary to-primary-container')}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

// ─── Estados de carregamento, erro e vazio ─────────────────────

export function Spinner({ className }: { className?: string }) {
  return <LoaderCircle className={cn('h-5 w-5 animate-spin text-primary', className)} aria-hidden />
}

export function LoadingState({ label = 'Carregando…', className }: { label?: string; className?: string }) {
  return (
    <div role="status" className={cn('flex items-center justify-center gap-3 py-16 text-sm font-medium text-muted', className)}>
      <Spinner />
      <span>{label}</span>
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn('animate-pulse rounded-xl bg-surface-container', className)} />
}

export function ErrorState({ title = 'Algo deu errado', message, onRetry, className }: { title?: string; message: string; onRetry?: () => void | Promise<void>; className?: string }) {
  const [retrying, setRetrying] = useState(false)

  async function handleRetry() {
    if (!onRetry) return
    setRetrying(true)
    try {
      await onRetry()
    } finally {
      setRetrying(false)
    }
  }

  return (
    <div role="alert" className={cn('mx-auto flex max-w-md flex-col items-center gap-3 rounded-2xl bg-white p-6 text-center shadow-card', className)}>
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-error-container text-error">
        <CircleAlert className="h-6 w-6" aria-hidden />
      </span>
      <h2 className="text-base font-bold text-on-surface">{title}</h2>
      <p className="text-sm text-muted">{message}</p>
      {onRetry && (
        <Button
          variant="outline"
          icon={RefreshCw}
          loading={retrying}
          onClick={() => void handleRetry()}
        >
          Tentar novamente
        </Button>
      )}
    </div>
  )
}

export function EmptyState({ icon: IconMain = Inbox, title, description, action, className }: { icon?: Icon; title: string; description?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center gap-3 rounded-2xl border border-dashed border-outline-variant bg-surface-container-low/60 px-6 py-10 text-center', className)}>
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-container text-primary">
        <IconMain className="h-6 w-6" aria-hidden />
      </span>
      <h3 className="text-base font-bold text-on-surface">{title}</h3>
      {description && <p className="max-w-md text-sm text-muted">{description}</p>}
      {action}
    </div>
  )
}

export function Alert({ tone = 'info', title, children, className }: { tone?: 'info' | 'danger' | 'success'; title?: string; children: ReactNode; className?: string }) {
  const styles = {
    info: 'bg-surface-container-low text-on-surface-variant border-outline-variant',
    success: 'bg-surface-container text-primary-strong border-secondary-container',
    danger: 'bg-error-container text-on-error-container border-error/20',
  }[tone]
  const IconTone = tone === 'danger' ? CircleAlert : tone === 'success' ? CircleCheck : Info
  return (
    <div role={tone === 'danger' ? 'alert' : 'status'} className={cn('flex items-start gap-2.5 rounded-xl border p-3 text-sm', styles, className)}>
      <IconTone className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div className="flex flex-col gap-0.5">
        {title && <strong className="font-semibold">{title}</strong>}
        <div className="leading-relaxed">{children}</div>
      </div>
    </div>
  )
}

// ─── Modal ──────────────────────────────────────────────────────

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children?: ReactNode
  footer?: ReactNode
  size?: 'md' | 'lg'
}) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    panelRef.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      previous?.focus?.()
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button type="button" aria-label="Fechar" className="absolute inset-0 bg-primary-deep/50 backdrop-blur-sm" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          'relative z-10 flex max-h-[90vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-raised outline-none sm:rounded-2xl',
          size === 'lg' ? 'sm:max-w-2xl' : 'sm:max-w-lg',
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-outline-variant px-5 py-4">
          <div>
            <h2 id={titleId} className="text-base font-bold text-on-surface">{title}</h2>
            {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-muted hover:bg-surface-container-low hover:text-primary" aria-label="Fechar janela">
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4 text-sm text-on-surface-variant">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-outline-variant bg-surface-container-low/50 px-5 py-3">{footer}</div>}
      </div>
    </div>
  )
}

// ─── Toasts ─────────────────────────────────────────────────────

interface Toast {
  id: number
  tone: 'success' | 'error' | 'info'
  title: string
  description?: string
}

interface ToastApi {
  success: (title: string, description?: string) => void
  error: (title: string, description?: string) => void
  info: (title: string, description?: string) => void
}

const ToastContext = createContext<ToastApi | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(1)

  const dismiss = useCallback((id: number) => setToasts(list => list.filter(t => t.id !== id)), [])

  const push = useCallback(
    (tone: Toast['tone'], title: string, description?: string) => {
      const id = nextId.current++
      setToasts(list => [...list.slice(-2), { id, tone, title, description }])
      window.setTimeout(() => dismiss(id), tone === 'error' ? 7000 : 4500)
    },
    [dismiss],
  )

  const api = useMemo<ToastApi>(
    () => ({
      success: (t, d) => push('success', t, d),
      error: (t, d) => push('error', t, d),
      info: (t, d) => push('info', t, d),
    }),
    [push],
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed bottom-4 right-4 z-[80] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
        {toasts.map(toast => {
          const IconTone = toast.tone === 'error' ? CircleAlert : toast.tone === 'success' ? CircleCheck : Info
          return (
            <div
              key={toast.id}
              role={toast.tone === 'error' ? 'alert' : 'status'}
              className={cn(
                'pointer-events-auto flex items-start gap-3 rounded-xl p-3.5 text-sm shadow-raised',
                toast.tone === 'error' ? 'bg-error-container text-on-error-container' : 'bg-inverse-surface text-inverse-on-surface',
              )}
            >
              <IconTone className={cn('mt-0.5 h-5 w-5 shrink-0', toast.tone === 'error' ? 'text-error' : 'text-primary-fixed-dim')} aria-hidden />
              <div className="flex-1">
                <p className="font-semibold">{toast.title}</p>
                {toast.description && <p className="mt-0.5 opacity-85">{toast.description}</p>}
              </div>
              <button type="button" onClick={() => dismiss(toast.id)} className="rounded p-0.5 opacity-70 hover:opacity-100" aria-label="Fechar aviso">
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast deve ser usado dentro de <ToastProvider>')
  return ctx
}
