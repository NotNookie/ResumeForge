import { ArrowRight, FileQuestion } from 'lucide-react'

type NotResumeViewProps = {
  reason: string
  onAnalyzeAnyway: () => void
  onChooseAnother: () => void
}

/**
 * Shown when the server's heuristic doubts the upload is a resume. It's a
 * warning, not an error — the heuristic is deliberately rough, so "Analyze
 * anyway" is a first-class action, not a buried escape hatch. Amber, not red:
 * nothing is broken.
 */
export function NotResumeView({ reason, onAnalyzeAnyway, onChooseAnother }: NotResumeViewProps) {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-6 py-16">
      <div className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-10 text-center shadow-card">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-warning-container">
          <FileQuestion className="size-6 text-on-warning-container" aria-hidden="true" />
        </div>

        <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight text-balance">
          This doesn't look like a resume
        </h1>
        <p className="mt-3 leading-relaxed text-pretty text-on-surface-variant">{reason}</p>

        <div className="mt-8 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={onAnalyzeAnyway}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 font-display text-base font-medium text-on-primary shadow-card transition-transform hover:scale-[1.02] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface"
          >
            Analyze it anyway
            <ArrowRight className="size-4" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={onChooseAnother}
            className="rounded px-2 py-1 text-sm text-on-surface-variant underline underline-offset-4 transition-colors hover:text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface"
          >
            Choose a different file
          </button>
        </div>
      </div>
    </main>
  )
}
