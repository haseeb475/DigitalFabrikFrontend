export function LandingIllustration({ className = '' }) {
  return (
    <svg
      viewBox="0 0 400 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="sky" x1="200" y1="0" x2="200" y2="220" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F5F3FF" />
          <stop offset="1" stopColor="#EEF2FF" />
        </linearGradient>
        <linearGradient id="ground" x1="200" y1="160" x2="200" y2="220" gradientUnits="userSpaceOnUse">
          <stop stopColor="#E0E7FF" />
          <stop offset="1" stopColor="#DDD6FE" />
        </linearGradient>
      </defs>
      <rect width="400" height="220" fill="url(#sky)" rx="16" />
      <ellipse cx="200" cy="175" rx="170" ry="28" fill="url(#ground)" opacity="0.7" />

      {/* Landmarks */}
      <g opacity="0.55">
        <rect x="48" y="95" width="16" height="80" fill="#C4B5FD" rx="2" />
        <polygon points="56,72 48,95 64,95" fill="#C4B5FD" />
        <circle cx="56" cy="68" r="7" fill="#C4B5FD" />
        <polygon points="310,175 328,85 346,175" fill="#C4B5FD" />
        <rect x="318" y="120" width="20" height="3" fill="#F5F3FF" />
        <rect x="312" y="145" width="32" height="3" fill="#F5F3FF" />
      </g>

      {/* City blocks */}
      <g opacity="0.45">
        <rect x="90" y="120" width="36" height="55" fill="#A5B4FC" rx="3" />
        <rect x="135" y="105" width="28" height="70" fill="#818CF8" rx="3" />
        <rect x="172" y="115" width="42" height="60" fill="#A5B4FC" rx="3" />
        <rect x="222" y="100" width="32" height="75" fill="#818CF8" rx="3" />
        <rect x="262" y="125" width="38" height="50" fill="#A5B4FC" rx="3" />
      </g>

      {/* Suitcase */}
      <rect x="188" y="138" width="28" height="20" rx="4" fill="#F59E0B" />
      <rect x="198" y="132" width="8" height="8" rx="2" fill="#D97706" />
      <line x1="192" y1="148" x2="212" y2="148" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" />

      {/* Figures */}
      <circle cx="162" cy="128" r="11" fill="#FCD34D" />
      <rect x="150" y="139" width="24" height="28" rx="6" fill="#5D5CDE" />
      <rect x="146" y="165" width="11" height="16" rx="4" fill="#4338CA" />
      <rect x="167" y="165" width="11" height="16" rx="4" fill="#4338CA" />

      <circle cx="232" cy="128" r="11" fill="#FCD34D" />
      <path d="M220 139c12-5 24-5 24 0l-2 24c-6 4-14 4-20 0l-2-24z" fill="#818CF8" />
      <rect x="216" y="165" width="11" height="16" rx="4" fill="#6366F1" />
      <rect x="237" y="165" width="11" height="16" rx="4" fill="#6366F1" />
    </svg>
  )
}
