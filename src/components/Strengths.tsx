import { Check, CircleCheck } from 'lucide-react'
import type { Finding } from '@/schemas/analysis'

type StrengthsProps = {
  strengths: readonly Finding[]
}

export function Strengths({ strengths }: StrengthsProps) {
  // A weak resume may genuinely have nothing to praise. Say so plainly rather
  // than inventing a compliment — the whole point is honest feedback.
  if (strengths.length === 0) {
    return (
      <section className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-8">
        <h2 className="font-display text-lg font-semibold">Strengths</h2>
        <p className="mt-2 text-sm text-on-surface-variant">
          Nothing stood out yet. Work through the critical fixes above — they're the fastest way to
          change that.
        </p>
      </section>
    )
  }

  return (
    // 30% against the pink's 60%: secondary-container is a far more saturated
    // base than error-container, so matching opacities read as mismatched weights.
    <section className="rounded-2xl bg-secondary-container/30 p-8">
      <h2 className="flex items-center gap-2.5 font-display text-lg font-semibold text-on-secondary-container">
        <CircleCheck className="size-5" aria-hidden="true" />
        Strengths
      </h2>

      <ul className="mt-6 grid gap-6 border-t border-secondary/15 pt-6 sm:grid-cols-2">
        {strengths.map((strength) => (
          <li key={strength.title} className="flex gap-2.5">
            <Check className="mt-0.5 size-4 shrink-0 text-secondary" aria-hidden="true" />
            <div>
              <h3 className="font-display text-sm font-semibold text-on-secondary-container">
                {strength.title}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">
                {strength.detail}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
