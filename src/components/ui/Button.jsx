const variants = {
  primary:
    'bg-civic-purple text-white hover:bg-civic-purple-dark focus-visible:ring-civic-purple',
  secondary:
    'bg-white text-civic-purple border-2 border-civic-purple hover:bg-civic-purple-light focus-visible:ring-civic-purple',
  success:
    'bg-gentle-emerald text-white hover:bg-emerald-600 focus-visible:ring-gentle-emerald',
  ghost:
    'bg-transparent text-charcoal border border-slate-200 hover:bg-slate-50 focus-visible:ring-charcoal',
  disabled:
    'bg-civic-purple/40 text-white/80 cursor-not-allowed border border-transparent',
}

export function Button({
  variant = 'primary',
  disabled = false,
  className = '',
  children,
  ...props
}) {
  const resolvedVariant = disabled && variant === 'primary' ? 'disabled' : disabled ? 'disabled' : variant

  return (
    <button
      type="button"
      disabled={disabled}
      className={`inline-flex min-h-11 items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${variants[resolvedVariant] ?? variants.primary} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
