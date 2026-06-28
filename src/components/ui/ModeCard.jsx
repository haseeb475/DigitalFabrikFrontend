import { Check } from 'lucide-react'

export function ModeCard({
  icon: Icon,
  title,
  description,
  features,
  badge,
  action,
  highlighted = false,
  muted = false,
}) {
  return (
    <article
      className={`relative flex flex-col rounded-2xl border bg-white p-6 transition-shadow sm:p-7 ${
        highlighted
          ? 'border-civic-purple/30 shadow-md shadow-civic-purple/10 ring-1 ring-civic-purple/20'
          : 'border-slate-200/80 shadow-sm'
      } ${muted ? 'opacity-90' : ''}`}
    >
      {badge && (
        <span className="absolute right-5 top-5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
          {badge}
        </span>
      )}

      <div className="mb-5 flex items-start gap-4">
        {Icon && (
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
              highlighted ? 'bg-civic-purple text-white' : 'bg-slate-100 text-slate-500'
            }`}
          >
            <Icon size={22} strokeWidth={1.75} aria-hidden="true" />
          </div>
        )}
        <div className="min-w-0 pr-16">
          <h3 className="text-lg font-semibold text-charcoal">{title}</h3>
          {description && (
            <p className="mt-1 text-sm leading-relaxed text-slate-500">{description}</p>
          )}
        </div>
      </div>

      <ul className="mb-6 flex-1 space-y-2.5">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5 text-sm text-slate-600">
            <Check
              size={16}
              className={`mt-0.5 shrink-0 ${highlighted ? 'text-civic-purple' : 'text-slate-400'}`}
              strokeWidth={2.5}
              aria-hidden="true"
            />
            {feature}
          </li>
        ))}
      </ul>

      {action}
    </article>
  )
}
