# ResumeForge

AI resume analysis. Upload a PDF or DOCX and get an ATS-compatibility score, a
recruiter score, and specific, actionable feedback in under a minute — no
account, no database, nothing stored.

Live: resume-forge-rouge-kappa.vercel.app

> Most free resume checkers scan for keywords and paywall the actual advice.
> ResumeForge judges both how an applicant-tracking system parses your resume
> and whether a human recruiter would be impressed — and tells you what to change.

---

## What it does

- **Two scores that mean different things** — ATS compatibility (how cleanly an
  automated system parses your resume) and recruiter appeal (whether a human
  would interview you), plus an overall score.
- **Specific fixes, not platitudes** — critical issues with a concrete
  correction for each, drawn from your actual resume.
- **Strengths, missing keywords, and formatting notes** — the missing keywords
  are weighted (core vs nice-to-have) so you know what matters.
- **Optional job-description comparison** — paste a posting and get a fit score
  for that role, the requirements your resume doesn't evidence, and tailored
  rewrites to close the gap.
- **Honest guard rails** — a cheap check flags uploads that don't look like a
  resume (with an "analyze anyway" override), and scanned/image PDFs get a clear
  "no text layer" message instead of a garbage score.

## How it works

```
Upload (browser) → POST /api/analyze → extract text (PDF/DOCX)
                 → is-this-a-resume check → prompt Gemini
                 → validate the JSON with Zod → typed response → render
```

The AI's output is treated as **untrusted input**. A language model is not an API
contract: field names drift, scores come back as strings, arrays arrive empty.
Every response is parsed through a Zod schema before it touches the UI, and a
validation failure is retried once before the user sees an error — never
`as SomeType`, which just turns a bad response into a white screen.

## Tech stack

React 19 · TypeScript · Vite · Tailwind CSS 4 · Zod 4 · Vitest · Google Gemini ·
deployed on Vercel (static frontend + serverless functions, no separate backend).

## Architecture & decisions

The interesting parts are the decisions, not the framework choices.

**Schema-first.** [`src/schemas/analysis.ts`](src/schemas/analysis.ts) is the one
source of truth: the Zod schema both validates the model's output at runtime and,
via `z.infer`, types the entire UI. Change the shape in one place and both the
prompt target and the render code follow.

**One core, two adapters.** The analysis pipeline is framework-agnostic
([`api/_lib/`](api/_lib/)) and runs behind two thin adapters: the Vercel
serverless function ([`api/analyze.ts`](api/analyze.ts)) and a Vite dev
middleware, so the exact same code path is exercised locally and in production.

**No router, on purpose.** Nothing is persisted, so a `/results` URL would break
on refresh and when shared. The app is a typed state machine
([`src/lib/view-state.ts`](src/lib/view-state.ts)) — a discriminated union where
"analyzing" cannot coexist with "results", enforced by the compiler.

**Errors are values users read.** A small failure taxonomy (no text found, rate
limited, AI unavailable) maps to dedicated screens with real guidance, and the
"not a resume" case is a warning the user can override, not a dead end.

**Honest by omission.** Scores are framed as an AI assessment. There's no
"top 4% of candidates" percentile (there's no candidate pool to rank against)
and no keyword-saturation figures (the model can't measure that) — those were
deliberately cut rather than faked.

**Reliability for a free tier.** The Gemini call retries transient `503`s within
a wall-clock budget (`AbortController`-bounded so it can't exceed the serverless
timeout), surfaces quota `429`s immediately instead of hammering them, and caps
input/output tokens. A best-effort per-IP rate limiter turns away abuse before
any work is done.

**Secrets live server-side only.** The Gemini key is a Vercel env var read inside
`api/`. It never appears in `src/`, never in a `VITE_`-prefixed variable (Vite
inlines those into the browser bundle in plaintext), and is never reachable from
a devtools Network tab.

## Local development

```bash
npm install
echo "GEMINI_API_KEY=your_key" > .env   # free key: https://aistudio.google.com/apikey
npm run dev                              # http://localhost:5173 — API runs via Vite middleware
```

| Command             | Purpose                        |
| ------------------- | ------------------------------ |
| `npm run dev`       | Dev server + API on :5173      |
| `npm run build`     | Production build               |
| `npm run typecheck` | `tsc --noEmit`                 |
| `npm test`          | Vitest                         |
| `npm run lint`      | oxlint                         |

## Testing

Vitest, tests beside the source. The suite covers the parts that actually break:
PDF/DOCX extraction against real generated files (including the Node-`Buffer`
case that only surfaces on Vercel), Zod schemas against malformed AI output, the
scoring and resume-detection logic, and a live Gemini integration test gated on
the API key. Presentational components and Tailwind classes aren't tested.

## Deploying to Vercel

Import the repo, set `GEMINI_API_KEY` as an environment variable, and deploy.
Two project-specific facts are baked in so it builds and runs:

- TypeScript is pinned to 5.x — Vercel's function builder can't drive the TS 7
  native-preview compiler yet.
- `api/` code uses relative imports **with `.js` extensions** and a `vercel.json`
  that bundles `unpdf`'s pdfjs — the functions run as native Node ESM, which is
  stricter than the local bundler about both.

## Limitations

This is a portfolio project on Gemini's free tier. An analysis takes ~20–40s and
can occasionally hit "high demand" under load; the rate limiter is best-effort
(per serverless instance, not shared). Uploaded resumes are sent to Google's free
API, which may use submitted data for training — fine for a demo, worth moving to
a zero-retention tier before real users.
