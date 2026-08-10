# ResumeForge

AI resume analysis. Upload a PDF/DOCX, get an ATS score, recruiter score, and
actionable feedback. No accounts, no database.

**Status:** v1 in progress — upload + analysis scores only. No rewrites, no
download. Those are explicitly deferred; don't build toward them yet.

## Commands

| Command             | Purpose                                  |
| ------------------- | ---------------------------------------- |
| `npm run dev`       | Dev server on :5173                      |
| `npm run build`     | Production build                         |
| `npm run typecheck` | `tsc --noEmit` — must pass before commit |
| `npm test`          | Vitest run                               |
| `npm run lint`      | oxlint                                   |

## Stack

React 19 + TypeScript 5 + Vite 8, Tailwind 4, Zod 4, Vitest 4. Deploys to
Vercel: static frontend plus serverless functions in `api/`. No separate
backend server.

Three of these differ from what most tutorials assume:

- **Tailwind 4** has no `tailwind.config.js` and no PostCSS step. It's the
  `@tailwindcss/vite` plugin plus `@import "tailwindcss"` in `src/index.css`.
  Ignore any guide that says `npx tailwindcss init`.
- **TypeScript pinned to 5.x**, not the 7 native-preview compiler. Vercel's
  `@vercel/node` function builder can't drive the TS 7 compiler API yet and
  crashes at deploy (`Cannot read properties of undefined (reading 'readFile')`).
  Path aliases stay relative (`"@/*": ["./src/*"]`) — valid in both, and no
  `baseUrl` (TS 7 removed it; TS 5 doesn't need it for relative `paths`).
- **Zod 4** — check imports against v4, not v3 docs.

## Architecture

```
src/
  components/   Presentational React. No fetch calls, no business logic.
  lib/          Framework-free logic: scoring, formatting, validation helpers.
  schemas/      Zod schemas + inferred types. The contract with the AI.
  api/          Client-side fetch wrappers (not the serverless functions).
api/            Vercel serverless functions. Server-only. Secrets live here.
```

Import via the `@/` alias (`@/lib/scoring`), not deep relative paths
(`../../lib/scoring`). The alias is declared in **both** `tsconfig.json` and
`vite.config.ts` — changing one without the other breaks the build.

### The rule that matters most

**`api/` is the only place secrets exist.** The AI key is a Vercel env var read
server-side. It must never appear in `src/`, in a `VITE_`-prefixed variable, or
in any code shipped to the browser — Vite inlines `VITE_*` into the client
bundle in plaintext. If the key is reachable from a browser devtools Network
tab, it's compromised. This is a public portfolio repo; leaked keys get scraped.

### Data flow

```
Upload (browser) → POST /api/analyze → extract text → prompt AI
                 → validate JSON with Zod → typed response → render
```

The AI's output is **untrusted input**. It's a language model, not an API
contract: field names drift, scores come back as strings, arrays arrive empty.
Every response passes through a Zod schema before touching the UI. Never
`as SomeType` an AI response — that's a lie to the compiler that surfaces as a
white screen in front of a user.

## Conventions

- **TypeScript is strict**, including `noUncheckedIndexedAccess` and
  `exactOptionalPropertyTypes`. `arr[0]` is `T | undefined` — handle it.
- **No `any`.** Use `unknown` at boundaries and narrow with Zod.
- **Schema first.** Define the Zod schema, derive the type with
  `z.infer`, then write the code. One source of truth.
- **Errors are values users read.** No swallowed catches, no `console.log` as
  error handling. If the AI fails, the user sees why and what to do next.
- **Comments explain why, not what.** The code shows what.

## Testing

Vitest, `*.test.ts` beside the source. Test the parts that actually break:

- Text extraction against malformed/messy PDFs
- Zod schemas against malformed AI output
- Scoring/formatting edge cases

Don't test presentational components or Tailwind classes.

## Workflow

- Run `npm run typecheck` and `npm test` before proposing a commit.
- Propose commits; the user approves them.
- Verify changes by running the app, not just by building it.
