import { GuideAvatar } from './GuideAvatar'

/**
 * Pairs the guide avatar ("Nav") with a line of text in a soft speech-bubble,
 * giving key moments a warm, human voice without becoming a chat thread.
 *
 * @param {{ children: React.ReactNode, avatarSize?: number, className?: string }} props
 */
export function GuideMessage({ children, avatarSize = 40, className = '' }) {
  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <GuideAvatar size={avatarSize} />
      <div className="min-w-0 flex-1 rounded-2xl rounded-tl-sm bg-white/80 px-4 py-3 text-sm leading-relaxed text-charcoal shadow-sm ring-1 ring-slate-100">
        {children}
      </div>
    </div>
  )
}
