export const MAX_FILE_BYTES = 5 * 1024 * 1024
export const ACCEPTED_EXTENSIONS = ['.pdf', '.docx'] as const

const ACCEPTED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])

/**
 * The parts of a File this module needs. Narrowing to a plain shape keeps the
 * validation framework-free and testable without constructing a real File.
 */
export type ResumeFileInfo = {
  name: string
  size: number
  type: string
}

export type FileRejection = {
  reason: 'type' | 'empty' | 'size'
  message: string
}

/**
 * Client-side validation is a courtesy — it catches obvious mistakes before a
 * pointless upload. It is not a security boundary: the server re-validates by
 * actually extracting text, which is the only check that can't be spoofed.
 *
 * Returns null when the file is acceptable.
 */
export function validateResumeFile(file: ResumeFileInfo): FileRejection | null {
  if (!hasAcceptedType(file)) {
    return {
      reason: 'type',
      message: `${describeType(file)} isn't supported. Upload a PDF or DOCX.`,
    }
  }

  if (file.size === 0) {
    return { reason: 'empty', message: 'That file is empty.' }
  }

  if (file.size > MAX_FILE_BYTES) {
    return {
      reason: 'size',
      message: `That file is ${formatFileSize(file.size)}. The limit is ${formatFileSize(MAX_FILE_BYTES)}.`,
    }
  }

  return null
}

/**
 * Either signal is enough. Browsers report MIME types inconsistently depending
 * on the drag source and OS — an empty string is common — so demanding both
 * would reject valid resumes. A file that lies about its extension fails later
 * at text extraction, which is the honest place to catch it.
 */
function hasAcceptedType(file: ResumeFileInfo): boolean {
  const name = file.name.toLowerCase()
  return (
    ACCEPTED_EXTENSIONS.some((extension) => name.endsWith(extension)) ||
    ACCEPTED_MIME_TYPES.has(file.type)
  )
}

/** Names the offending format when we can, so the message isn't "that file". */
function describeType(file: ResumeFileInfo): string {
  const extension = file.name.split('.').pop()
  const hasUsableExtension = extension && extension !== file.name && extension.length <= 5
  return hasUsableExtension ? `.${extension.toLowerCase()} files` : 'That file type'
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
