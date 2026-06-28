export function ProgressBar({ current, total, className = '' }) {
  const percent = total > 0 ? Math.round((current / total) * 100) : 0

  return (
    <div
      className={`h-2 w-full overflow-hidden rounded-full bg-slate-100 ${className}`}
      role="progressbar"
      aria-valuenow={current}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-label={`Step ${current} of ${total}`}
    >
      <div
        className="h-full rounded-full bg-civic-purple transition-all duration-300"
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}
