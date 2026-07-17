import { useRef, useState, type DragEvent } from 'react'
import { ArrowRight, FileText, Trash2, TriangleAlert } from 'lucide-react'
import {
  ACCEPTED_EXTENSIONS,
  formatFileSize,
  validateResumeFile,
  type FileRejection,
} from '@/lib/upload'

type UploadViewProps = {
  file: File | null
  onFileSelected: (file: File) => void
  onFileCleared: () => void
  onAnalyze: () => void
}

export function UploadView({ file, onFileSelected, onFileCleared, onAnalyze }: UploadViewProps) {
  const [rejection, setRejection] = useState<FileRejection | null>(null)
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

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
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 py-16 text-center">
      <h1 className="font-display text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
        Recruiter-grade feedback on your resume
      </h1>
      <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-pretty text-on-surface-variant">
        Find out how your resume scores against ATS filters and what a recruiter would think — in
        about ten seconds. No account needed.
      </p>

      {file ? (
        <SelectedFile file={file} onClear={onFileCleared} onAnalyze={onAnalyze} />
      ) : (
        <>
          {/* The label is the drop target and the click target, so the native
              file input stays keyboard-accessible instead of being replaced by a
              div with a click handler. */}
          <label
            onDragOver={(event) => {
              event.preventDefault()
              setIsDraggingOver(true)
            }}
            onDragLeave={() => setIsDraggingOver(false)}
            onDrop={handleDrop}
            className={`mt-12 flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed px-6 py-20 transition-colors focus-within:border-secondary focus-within:bg-secondary-container/20 ${
              isDraggingOver
                ? 'border-secondary bg-secondary-container/30'
                : 'border-outline-variant bg-surface-container-lowest hover:border-outline'
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED_EXTENSIONS.join(',')}
              className="sr-only"
              onChange={(event) => handleFile(event.target.files?.[0])}
            />
            <FileText className="size-8 text-on-surface-variant" aria-hidden="true" />
            <span className="mt-6 font-display text-base font-medium">
              Drop your resume, or click to browse
            </span>
            <span className="mt-2 font-display text-xs tracking-[0.08em] text-on-surface-variant uppercase">
              PDF or DOCX · Max 5 MB
            </span>
          </label>

          {rejection ? (
            <p
              role="alert"
              className="mx-auto mt-4 flex items-center gap-2 rounded-lg bg-error-container px-4 py-3 text-sm text-on-error-container"
            >
              <TriangleAlert className="size-4 shrink-0" aria-hidden="true" />
              {rejection.message}
            </p>
          ) : null}
        </>
      )}
    </main>
  )
}

function SelectedFile({
  file,
  onClear,
  onAnalyze,
}: {
  file: File
  onClear: () => void
  onAnalyze: () => void
}) {
  return (
    <div className="mt-12">
      <div className="flex items-center gap-4 rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-4 text-left">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-surface-container">
          <FileText className="size-5" aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          {/* Filenames can be long and have no spaces to wrap on. */}
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

      <button
        type="button"
        onClick={onAnalyze}
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 font-display text-base font-medium text-on-primary transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface"
      >
        Analyze resume
        <ArrowRight className="size-4" aria-hidden="true" />
      </button>
    </div>
  )
}
