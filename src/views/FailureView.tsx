import { Lightbulb, RotateCw, TriangleAlert } from 'lucide-react'
import { FAILURE_COPY, type AnalysisFailure } from '@/lib/view-state'

type FailureViewProps = {
  failure: AnalysisFailure
  onRetry: () => void
  onStartOver: () => void
}

export function FailureView({ failure, onRetry, onStartOver }: FailureViewProps) {
  const copy = FAILURE_COPY[failure]

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-6 py-16">
      <div className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-10 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-error-container">
          <TriangleAlert className="size-6 text-on-error-container" aria-hidden="true" />
        </div>

        <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight text-balance">
          {copy.title}
        </h1>
        <p className="mt-3 leading-relaxed text-pretty text-on-surface-variant">{copy.detail}</p>

        {copy.guidance ? (
          <div className="mt-8 flex gap-3 rounded-xl bg-surface-container-low p-5 text-left">
            <Lightbulb className="mt-0.5 size-4 shrink-0 text-secondary" aria-hidden="true" />
            <p className="text-sm leading-relaxed text-on-surface-variant">{copy.guidance}</p>
          </div>
        ) : null}

        <div className="mt-8 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3.5 font-display text-sm font-medium text-on-primary transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface"
          >
            <RotateCw className="size-4" aria-hidden="true" />
            {copy.retryLabel}
          </button>

          {/* Only offered when retry means something else. When the same file
              can never work, the primary button already starts over. */}
          {copy.canRetrySameFile ? (
            <button
              type="button"
              onClick={onStartOver}
              className="rounded px-2 py-1 text-sm text-on-surface-variant underline underline-offset-4 transition-colors hover:text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface"
            >
              Start over with a different file
            </button>
          ) : null}
        </div>
      </div>
    </main>
  )
}
