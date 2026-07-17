import { useEffect, useState } from 'react'
import { Check, Loader2 } from 'lucide-react'

/**
 * These stages are the real pipeline, in order. What we can't know is exactly
 * when each one finishes — the AI call returns once, with no progress events —
 * so they advance on a timer.
 *
 * That's why there's no percentage and no progress bar: a number would claim a
 * precision we don't have. The last stage holds until the response lands, so a
 * slow analysis reads as "still working", never as "stuck at 90%".
 */
const STAGES = [
  'Reading your document',
  'Reviewing your experience',
  'Checking ATS compatibility',
  'Writing your report',
] as const

const STAGE_DURATION_MS = 2800

export function AnalyzingView({ fileName }: { fileName: string }) {
  const [stageIndex, setStageIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setStageIndex((current) => Math.min(current + 1, STAGES.length - 1))
    }, STAGE_DURATION_MS)
    return () => clearInterval(timer)
  }, [])

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-6 py-16">
      <div className="text-center">
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Analyzing your resume
        </h1>
        <p className="mt-3 truncate text-sm text-on-surface-variant">{fileName}</p>
      </div>

      <ol className="mt-12 space-y-1" aria-live="polite">
        {STAGES.map((stage, index) => {
          const isDone = index < stageIndex
          const isCurrent = index === stageIndex

          return (
            <li
              key={stage}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition-colors ${
                isCurrent ? 'bg-surface-container-lowest font-medium' : ''
              } ${isDone || isCurrent ? 'text-on-surface' : 'text-on-surface-variant/50'}`}
            >
              <span className="flex size-5 shrink-0 items-center justify-center">
                {isDone ? (
                  <Check className="size-4 text-secondary" aria-hidden="true" />
                ) : isCurrent ? (
                  <Loader2 className="size-4 animate-spin text-secondary" aria-hidden="true" />
                ) : (
                  <span className="size-1.5 rounded-full bg-outline-variant" aria-hidden="true" />
                )}
              </span>
              {stage}
            </li>
          )
        })}
      </ol>

      <p className="mt-10 text-center text-xs text-on-surface-variant">
        This usually takes about ten seconds.
      </p>
    </main>
  )
}
