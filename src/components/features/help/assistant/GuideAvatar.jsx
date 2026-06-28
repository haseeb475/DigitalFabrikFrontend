import { motion, useReducedMotion } from 'framer-motion'
import { useLocale } from '../../../../i18n/useLocale'

/**
 * The Navigator's guide persona, "Nav" — a friendly, softly-shaded compass
 * character. It gives the experience a warm, human feel without the weight of
 * a 3D engine: it's a single inline SVG with a gentle idle float and an
 * occasional blink (both disabled when the user prefers reduced motion).
 *
 * Purely presentational. Same API as before ({ size, className }) so existing
 * usages upgrade automatically.
 *
 * @param {{ size?: number, className?: string }} props
 */
export function GuideAvatar({ size = 40, className = '' }) {
  const { t } = useLocale()
  const reduceMotion = useReducedMotion()

  const floatProps = reduceMotion
    ? {}
    : {
        animate: { y: [0, -2.5, 0] },
        transition: { duration: 3.2, repeat: Infinity, ease: 'easeInOut' },
      }

  const eyeBlink = reduceMotion
    ? {}
    : {
        animate: { scaleY: [1, 1, 0.15, 1] },
        transition: {
          duration: 4,
          times: [0, 0.92, 0.96, 1],
          repeat: Infinity,
          ease: 'easeInOut',
        },
        style: { transformBox: 'fill-box', transformOrigin: 'center' },
      }

  return (
    <motion.span
      role="img"
      aria-label={t('guide.avatarAlt')}
      className={`inline-flex shrink-0 ${className}`}
      style={{ width: size, height: size }}
      {...floatProps}
    >
      <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
        <defs>
          <radialGradient id="navBody" cx="35%" cy="28%" r="80%">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="60%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#6d28d9" />
          </radialGradient>
        </defs>

        {/* soft drop shadow */}
        <ellipse cx="32" cy="60" rx="18" ry="3.5" fill="#6d28d9" opacity="0.15" />

        {/* body */}
        <circle cx="32" cy="32" r="29" fill="url(#navBody)" />
        {/* glossy highlight for a semi-3D feel */}
        <ellipse cx="24" cy="19" rx="13" ry="8" fill="#ffffff" opacity="0.18" />

        {/* north marker */}
        <path d="M32 3.5 l3.4 6.5 h-6.8 z" fill="#fbbf24" />

        {/* face dial */}
        <circle cx="32" cy="34" r="17.5" fill="#fdf7ef" />
        <circle cx="32" cy="34" r="17.5" fill="none" stroke="#6d28d9" strokeOpacity="0.12" strokeWidth="2" />

        {/* eyes (blink) */}
        <motion.ellipse cx="26" cy="32.5" rx="2.5" ry="3" fill="#3f3d56" {...eyeBlink} />
        <motion.ellipse cx="38" cy="32.5" rx="2.5" ry="3" fill="#3f3d56" {...eyeBlink} />

        {/* cheeks */}
        <circle cx="21.5" cy="38" r="2.2" fill="#f9a8d4" opacity="0.55" />
        <circle cx="42.5" cy="38" r="2.2" fill="#f9a8d4" opacity="0.55" />

        {/* smile */}
        <path
          d="M26 39 q6 5 12 0"
          fill="none"
          stroke="#3f3d56"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
    </motion.span>
  )
}
