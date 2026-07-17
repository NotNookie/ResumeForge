export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-outline-variant/60">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-6 text-sm text-on-surface-variant sm:flex-row sm:items-center sm:justify-between">
        <span className="font-display font-semibold text-on-surface">ResumeForge</span>
        {/* Says only what's true: we don't keep the file. It is sent to an AI
            provider to be analyzed, so no privacy or encryption claim beyond that. */}
        <span>Your resume is analyzed and discarded. We don't store it.</span>
      </div>
    </footer>
  )
}
