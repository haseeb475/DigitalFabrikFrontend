import { forwardRef } from 'react'

export const Card = forwardRef(function Card({ className = '', children, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={`rounded-xl border border-slate-100 bg-white p-6 shadow-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  )
})
