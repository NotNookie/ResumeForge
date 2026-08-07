import { useState, type DragEvent } from 'react'
import {
  ArrowRight,
  Briefcase,
  FileText,
  Gauge,
  ShieldCheck,
  Trash2,
  TriangleAlert,
  Zap,
} from 'lucide-react'
import {
  ACCEPTED_EXTENSIONS,
  formatFileSize,
  MAX_JOB_DESCRIPTION_CHARS,
  validateResumeFile,
  type FileRejection,
} from '@/lib/upload'

type UploadViewProps = {
  file: File | null
  jobDescription: string
  onJobDescriptionChange: (value: string) => void
  onFileSelected: (file: File) => void
  onFileCleared: () => void
  onAnalyze: () => void
}

/**
 * Claims here must stay things the app actually does. No "Fortune 500 hiring
 * managers" — there's no such data — and no privacy claim beyond not storing
 * the file, since it is sent to a third-party model to be read.
 */
const ASSURANCES = [
  {
    icon: ShieldCheck,
    title: 'Nothing is stored',
    detail: 'Your resume is read once, analyzed, and discarded. No account, no database.',
  },
  {
    icon: Gauge,
    title: 'Two views at once',
    detail: 'Scored the way an ATS parses it, and the way a recruiter actually reads it.',
  },
  {
    icon: Zap,
    title: 'Specific, not generic',
    detail: 'Real fixes drawn from your resume — not a checklist you could have written yourself.',
  },
] as const

export function UploadView({
  file,
  jobDescription,
  onJobDescriptionChange,
  onFileSelected,
  onFileCleared,
  onAnalyze,
}: UploadViewProps) {
  const [rejection, setRejection] = useState<FileRejection | null>(null)
  const [isDraggingOver, setIsDraggingOver] = useState(false)

  function handleFile(candidate: File | undefined) {
    if (!candidate) return
    const problem = validateResumeFile(candidate)
    setRejection(problem)
    if (!problem) onFileSelected(candidate)
  }

  function handleDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault()
    setIsDraggingOver(false)
    handleFile(event.dataTransfer.files[0])
  }

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 pt-20 pb-24">
      <div className="text-center">
        <h1 className="mx-auto max-w-3xl font-display text-5xl font-semibold tracking-tight text-balance sm:text-6xl">
          Find out why your resume isn't getting callbacks
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-pretty text-on-surface-variant">
          Upload it and get an ATS score, a recruiter score, and the specific fixes that would move
          them — in under a minute.
        </p>
      </div>

      <div className="mt-14">
        {file ? (
          <SelectedFile
            file={file}
            jobDescription={jobDescription}
            onJobDescriptionChange={onJobDescriptionChange}
            onClear={onFileCleared}
            onAnalyze={onAnalyze}
          />
        ) : (
          <>
            {/* The label is both drop target and click target, so the native
                input stays keyboard-accessible instead of being replaced by a
                div with a click handler. */}
            <label
              onDragOver={(event) => {
                event.preventDefault()
                setIsDraggingOver(true)
              }}
              onDragLeave={() => setIsDraggingOver(false)}
              onDrop={handleDrop}
              className={`flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed px-6 py-12 text-center shadow-card transition-all focus-within:border-secondary focus-within:bg-secondary-container/25 ${
                isDraggingOver
                  ? 'scale-[1.01] border-secondary bg-secondary-container/30'
                  : 'border-outline-variant bg-surface-container-lowest hover:border-outline hover:bg-surface-container-low/50'
              }`}
            >
              <input
                type="file"
                accept={ACCEPTED_EXTENSIONS.join(',')}
                className="sr-only"
                onChange={(event) => handleFile(event.target.files?.[0])}
              />

              <span className="flex size-14 items-center justify-center rounded-2xl bg-surface-container">
                <FileText className="size-6" aria-hidden="true" />
              </span>

              <span className="mt-6 font-display text-xl font-semibold">
                Drop your resume here
              </span>
              <span className="mt-1.5 text-sm text-on-surface-variant">
                or <span className="underline underline-offset-4">browse your files</span>
              </span>

              <span className="mt-8 rounded-full bg-surface-container px-3 py-1.5 font-display text-[11px] font-medium tracking-[0.08em] text-on-surface-variant uppercase">
                PDF or DOCX · Max 5 MB
              </span>
            </label>

            {rejection ? (
              <p
                role="alert"
                className="mx-auto mt-4 flex w-fit items-center gap-2 rounded-lg bg-error-container px-4 py-3 text-sm font-medium text-on-error-container"
              >
                <TriangleAlert className="size-4 shrink-0" aria-hidden="true" />
                {rejection.message}
              </p>
            ) : null}
          </>
        )}
      </div>

      <ul className="mt-24 grid gap-10 border-t border-outline-variant/60 pt-14 sm:grid-cols-3">
        {ASSURANCES.map(({ icon: Icon, title, detail }) => (
          <li key={title}>
            <Icon className="size-5 text-secondary" aria-hidden="true" />
            <h2 className="mt-4 font-display text-sm font-semibold">{title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">{detail}</p>
          </li>
        ))}
      </ul>
    </main>
  )
}

function SelectedFile({
  file,
  jobDescription,
  onJobDescriptionChange,
  onClear,
  onAnalyze,
}: {
  file: File
  jobDescription: string
  onJobDescriptionChange: (value: string) => void
  onClear: () => void
  onAnalyze: () => void
}) {
  // Open by default if a JD is already present (e.g. returning from a retry).
  const [showJob, setShowJob] = useState(jobDescription.trim().length > 0)
  const remaining = MAX_JOB_DESCRIPTION_CHARS - jobDescription.length

  return (
    <div className="mx-auto max-w-xl text-center">
      <div className="flex items-center gap-4 rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-4 text-left shadow-card">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-secondary-container/50">
          <FileText className="size-5 text-secondary" aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          {/* Filenames get long and have no spaces to wrap on. */}
          <p className="truncate font-display text-sm font-medium">{file.name}</p>
          <p className="mt-0.5 text-xs text-on-surface-variant">{formatFileSize(file.size)}</p>
        </div>

        <button
          type="button"
          onClick={onClear}
          className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-error transition-colors hover:bg-error-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error"
        >
          <Trash2 className="size-4" aria-hidden="true" />
          Remove
        </button>
      </div>

      {/* Optional JD: a quiet reveal so the default stays a one-click flow. */}
      <div className="mt-4 text-left">
        {showJob ? (
          <div className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-4 shadow-card">
            <label
              htmlFor="job-description"
              className="flex items-center gap-2 font-display text-sm font-medium"
            >
              <Briefcase className="size-4 text-secondary" aria-hidden="true" />
              Compare to a job description
              <span className="font-sans font-normal text-on-surface-variant">(optional)</span>
            </label>
            <textarea
              id="job-description"
              value={jobDescription}
              maxLength={MAX_JOB_DESCRIPTION_CHARS}
              onChange={(event) => onJobDescriptionChange(event.target.value)}
              placeholder="Paste the job posting here to see how well your resume fits and what to change."
              className="mt-3 h-36 w-full resize-y rounded-lg border border-outline-variant bg-surface p-3 text-sm leading-relaxed outline-none focus:border-secondary focus:ring-1 focus:ring-secondary"
            />
            <p className="mt-1.5 text-right text-xs text-on-surface-variant tabular-nums">
              {remaining.toLocaleString()} characters left
            </p>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowJob(true)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-outline-variant px-4 py-3.5 font-display text-sm font-medium text-on-surface-variant transition-colors hover:border-outline hover:text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface"
          >
            <Briefcase className="size-4" aria-hidden="true" />
            Compare to a job description
            <span className="font-sans font-normal">(optional)</span>
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={onAnalyze}
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 font-display text-base font-medium text-on-primary shadow-card transition-transform hover:scale-[1.02] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface"
      >
        {jobDescription.trim() ? 'Analyze & compare' : 'Analyze resume'}
        <ArrowRight className="size-4" aria-hidden="true" />
      </button>
    </div>
  )
}
