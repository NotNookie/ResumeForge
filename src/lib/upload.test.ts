import { describe, expect, it } from 'vitest'
import {
  formatFileSize,
  MAX_FILE_BYTES,
  validateResumeFile,
  type ResumeFileInfo,
} from '@/lib/upload'

const PDF_MIME = 'application/pdf'
const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

function file(overrides: Partial<ResumeFileInfo> = {}): ResumeFileInfo {
  return { name: 'resume.pdf', size: 1_200_000, type: PDF_MIME, ...overrides }
}

describe('validateResumeFile', () => {
  it('accepts a normal PDF and DOCX', () => {
    expect(validateResumeFile(file())).toBeNull()
    expect(validateResumeFile(file({ name: 'resume.docx', type: DOCX_MIME }))).toBeNull()
  })

  it('accepts a file whose MIME type the browser failed to report', () => {
    expect(validateResumeFile(file({ type: '' }))).toBeNull()
  })

  it('accepts an uppercase extension', () => {
    expect(validateResumeFile(file({ name: 'RESUME.PDF', type: '' }))).toBeNull()
  })

  it('rejects an unsupported type and names the format', () => {
    const rejection = validateResumeFile(
      file({ name: 'portfolio_assets_final_v3.png', type: 'image/png' }),
    )
    expect(rejection?.reason).toBe('type')
    expect(rejection?.message).toContain('.png files')
  })

  it('rejects a file over the limit and states both sizes', () => {
    const rejection = validateResumeFile(file({ size: 8.4 * 1024 * 1024 }))
    expect(rejection?.reason).toBe('size')
    expect(rejection?.message).toContain('8.4 MB')
    expect(rejection?.message).toContain('4.0 MB')
  })

  it('accepts a file exactly at the limit', () => {
    expect(validateResumeFile(file({ size: MAX_FILE_BYTES }))).toBeNull()
  })

  it('rejects an empty file before complaining about its size', () => {
    expect(validateResumeFile(file({ size: 0 }))?.reason).toBe('empty')
  })

  it('reports the type problem first when a file is both wrong and oversized', () => {
    const rejection = validateResumeFile(
      file({ name: 'photo.png', type: 'image/png', size: 20 * 1024 * 1024 }),
    )
    expect(rejection?.reason).toBe('type')
  })

  it('handles a file with no extension at all', () => {
    const rejection = validateResumeFile(file({ name: 'resume', type: 'text/plain' }))
    expect(rejection?.reason).toBe('type')
    expect(rejection?.message).toContain('That file type')
  })
})

describe('formatFileSize', () => {
  it('scales units by magnitude', () => {
    expect(formatFileSize(512)).toBe('512 B')
    expect(formatFileSize(2048)).toBe('2 KB')
    expect(formatFileSize(1_258_291)).toBe('1.2 MB')
  })
})
