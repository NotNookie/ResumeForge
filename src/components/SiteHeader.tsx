import { Lock } from 'lucide-react'

export function SiteHeader() {
  return (
    <header className="border-b border-outline-variant/60">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <span className="font-display text-lg font-semibold tracking-tight">ResumeForge</span>
        <span className="flex items-center gap-1.5 font-display text-sm text-on-surface-variant">
          <Lock className="size-3.5" aria-hidden="true" />
          Free — no account needed
        </span>
      </div>
    </header>
  )
}
