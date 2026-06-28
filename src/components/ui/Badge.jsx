const variants = {
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  active: 'bg-amber-50 text-amber-700 border-amber-200',
  locked: 'bg-slate-50 text-slate-500 border-slate-200',
  guest: 'bg-emerald-50 text-emerald-800 border-emerald-200',
}

export function Badge({ variant = 'locked', className = '', children }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  )
}
