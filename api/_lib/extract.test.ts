import { describe, expect, it } from 'vitest'
import { PDFDocument, StandardFonts } from 'pdf-lib'
import { Document, Packer, Paragraph, TextRun } from 'docx'
import {
  extractResumeText,
  normalizeWhitespace,
  NoTextFoundError,
  UnreadableFileError,
} from './extract'

/**
 * Fixtures are generated through the real pdf-lib / docx writers and read back
 * through the real extractors, so these are genuine round trips, not mocks. That
 * is the point: extraction breaks on real files, not on stubs.
 */

async function makePdf(lines: string[]): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const page = doc.addPage([600, 800])
  const font = await doc.embedFont(StandardFonts.Helvetica)
  lines.forEach((line, index) => {
    page.drawText(line, { x: 50, y: 750 - index * 24, size: 12, font })
  })
  return doc.save()
}

async function makeImageOnlyPdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  doc.addPage([600, 800]) // a page, but no text drawn — like a scan
  return doc.save()
}

async function makeDocx(paragraphs: string[]): Promise<Uint8Array> {
  const doc = new Document({
    sections: [{ children: paragraphs.map((text) => new Paragraph({ children: [new TextRun(text)] })) }],
  })
  return new Uint8Array(await Packer.toBuffer(doc))
}

// A resume-length body, comfortably above the "no meaningful text" floor, so the
// happy-path tests exercise real extraction rather than the empty-file guard.
const RESUME_LINES = [
  'Sarah Chen',
  'Product Manager',
  'Led a cross-functional team of twelve engineers and designers.',
  'Shipped three major features that grew activation by 40 percent.',
  'Previously a software engineer at a Series B startup.',
]

describe('extractResumeText', () => {
  it('extracts text from a PDF passed as a Node Buffer (the Vercel case)', async () => {
    // On Vercel the request body arrives as a Buffer, not a plain Uint8Array,
    // and pdfjs rejects Buffer. This reproduces that exact condition.
    const pdf = Buffer.from(await makePdf(RESUME_LINES))
    const text = await extractResumeText(pdf, 'resume.pdf')
    expect(text).toContain('Sarah Chen')
  })

  it('extracts text from a PDF', async () => {
    const pdf = await makePdf(RESUME_LINES)
    const text = await extractResumeText(pdf, 'resume.pdf')
    expect(text).toContain('Sarah Chen')
    expect(text).toContain('grew activation by 40 percent')
  })

  it('extracts text from a DOCX', async () => {
    const docx = await makeDocx(RESUME_LINES)
    const text = await extractResumeText(docx, 'resume.docx')
    expect(text).toContain('Sarah Chen')
    expect(text).toContain('grew activation by 40 percent')
  })

  it('detects format by content, not filename — a DOCX named .pdf still reads', async () => {
    const docx = await makeDocx(['Real content lives here regardless of the extension.'])
    const text = await extractResumeText(docx, 'misnamed.pdf')
    expect(text).toContain('Real content lives here')
  })

  it('throws NoTextFoundError for an image-only PDF', async () => {
    const scanned = await makeImageOnlyPdf()
    await expect(extractResumeText(scanned, 'scan.pdf')).rejects.toBeInstanceOf(NoTextFoundError)
  })

  it('names the file in the no-text error so the UI can be specific', async () => {
    const scanned = await makeImageOnlyPdf()
    await expect(extractResumeText(scanned, 'my-scan.pdf')).rejects.toThrow('my-scan.pdf')
  })

  it('treats a doc with only a few characters as no meaningful text', async () => {
    // A near-empty file (a stray title, a placeholder) is as useless to analyze
    // as a scan, and routes to the same "no text" screen.
    const barelyAnything = await makePdf(['Draft'])
    await expect(extractResumeText(barelyAnything, 'stub.pdf')).rejects.toBeInstanceOf(
      NoTextFoundError,
    )
  })

  it('throws UnreadableFileError for bytes that are neither PDF nor DOCX', async () => {
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]) // a PNG header
    await expect(extractResumeText(png, 'photo.png')).rejects.toBeInstanceOf(UnreadableFileError)
  })

  it('throws UnreadableFileError for a PDF header followed by garbage', async () => {
    const brokenPdf = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x00, 0x01, 0x02, 0x03])
    await expect(extractResumeText(brokenPdf, 'broken.pdf')).rejects.toBeInstanceOf(
      UnreadableFileError,
    )
  })

  it('normalizes whitespace: trimmed, no triple newlines, no double spaces', async () => {
    const docx = await makeDocx([...RESUME_LINES, '', '', '', 'Additional trailing section.'])
    const text = await extractResumeText(docx, 'spaced.docx')
    expect(text).toBe(text.trim())
    expect(text).not.toMatch(/\n{3,}/)
    expect(text).not.toMatch(/[ \t]{2,}/)
  })
})

// Unit tests for the normalizer, exercising specific characters that can't be
// injected reliably through the docx/pdf writers above. Written with \u escapes
// so this source stays free of invisible characters.
describe('normalizeWhitespace', () => {
  it('folds non-breaking spaces into regular spaces', () => {
    expect(normalizeWhitespace('Senior Engineer')).toBe('Senior Engineer')
  })

  it('strips zero-width characters and BOM', () => {
    expect(normalizeWhitespace('Sarah​Chen﻿')).toBe('SarahChen')
  })

  it('folds ligatures via NFKC', () => {
    expect(normalizeWhitespace(String.fromCharCode(0xFB01))).toBe('fi') // U+FB01 fi ligature
  })

  it('collapses spaces and caps blank-line runs', () => {
    expect(normalizeWhitespace('a  \n\n\n\nb')).toBe('a\n\nb')
  })
})
