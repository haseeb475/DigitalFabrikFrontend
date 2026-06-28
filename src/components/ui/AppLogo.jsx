export function AppLogo({ size = 48, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect width="48" height="48" rx="14" fill="#5D5CDE" fillOpacity="0.12" />
      <path
        d="M14 34V14h8.5c4.2 0 7 2.6 7 6.4 0 2.4-1.2 4.2-3.1 5.1L32 34h-6.8l-4.8-7.4H20V34H14zm6-12.2h2.1c1.6 0 2.5-.9 2.5-2.3s-.9-2.2-2.5-2.2H20v4.5z"
        fill="#5D5CDE"
      />
      <path
        d="M30 34V14h6v20h-6z"
        fill="#5D5CDE"
        fillOpacity="0.55"
      />
    </svg>
  )
}
