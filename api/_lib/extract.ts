import { definePDFJSModule, extractText, getDocumentProxy } from 'unpdf'
// Static import of unpdf's bundled pdfjs. By default unpdf lazy-loads it via a
// dynamic `import('unpdf/pdfjs')`, which Vercel's function tracer doesn't follow
// — so on Vercel pdfjs is missing and every PDF extracts to empty text. A static
// import is traced and bundled; definePDFJSModule below wires it in explicitly.
import * as pdfjsModule from 'unpdf/pdfjs'
import mammoth from 'mammoth'

// Register the statically-imported pdfjs once, before the first extraction.
let pdfjsRegistered: Promise<void> | undefined
function ensurePdfjs(): Promise<void> {
  pdfjsRegistered ??= definePDFJSModule(() => Promise.resolve(pdfjsModule))
  return pdfjsRegistered
}

/**
 * Server-only. Turns an uploaded resume into clean plain text, or throws a
 * domain error the endpoint can map to a user-facing failure screen.
 *
 * Lives under api/_lib rather than src/lib because it pulls in Node-only PDF and
 * DOCX parsers that must never reach the browser bundle. The leading underscore
 * keeps Vercel from treating it as its own serverless endpoint.
 */

/**
 * The file parsed but held (almost) no text — the classic scanned or
 * photographed resume with no text layer. Distinct from UnreadableFileError so
 * the caller can tell "image-only" from "broken file".
 */
export class NoTextFoundError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'NoTextFoundError'
  }
}

/** The bytes couldn't be parsed at all: corrupt, password-protected, wrong format. */
export class UnreadableFileError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'UnreadableFileError'
  }
}

/**
 * A scanned PDF yields roughly zero characters; a genuine resume yields
 * thousands. The floor only needs to sit clearly above zero and below any real
 * resume, so its exact value isn't delicate.
 */
const MIN_MEANINGFUL_CHARS = 40

type FileKind = 'pdf' | 'docx'

export async function extractResumeText(bytes: Uint8Array, filename = 'the file'): Promise<string> {
  const kind = detectKind(bytes)
  const raw = kind === 'pdf' ? await extractPdf(bytes) : await extractDocx(bytes)
  const text = normalizeWhitespace(raw)

  if (countNonWhitespace(text) < MIN_MEANINGFUL_CHARS) {
    throw new NoTextFoundError(
      // TEMP DIAGNOSTIC: the char counts reveal whether extraction produced
      // nothing (pdfjs missing on Vercel) vs a genuinely image-only file.
      `Found no readable text in ${filename} [${kind}, raw=${raw.length}, clean=${countNonWhitespace(text)}].`,
    )
  }
  return text
}

/**
 * Detect by magic bytes, not the filename — a server must not trust that a
 * `.pdf` is really a PDF. PDF starts with "%PDF"; every OOXML file (including
 * DOCX) is a ZIP starting with "PK\x03\x04". Anything else (a stray image, an
 * old OLE .doc) is rejected before it reaches a parser.
 */
function detectKind(bytes: Uint8Array): FileKind {
  if (startsWith(bytes, [0x25, 0x50, 0x44, 0x46])) return 'pdf'
  if (startsWith(bytes, [0x50, 0x4b, 0x03, 0x04])) return 'docx'
  throw new UnreadableFileError('Unrecognized file format; expected a PDF or DOCX.')
}

function startsWith(bytes: Uint8Array, signature: number[]): boolean {
  return signature.every((byte, index) => bytes[index] === byte)
}

async function extractPdf(bytes: Uint8Array): Promise<string> {
  try {
    await ensurePdfjs()
    const pdf = await getDocumentProxy(bytes)
    const { text } = await extractText(pdf, { mergePages: true })
    return text
  } catch (error) {
    throw new UnreadableFileError(
      "Couldn't read this PDF. It may be corrupt or password-protected.",
      { cause: error },
    )
  }
}

async function extractDocx(bytes: Uint8Array): Promise<string> {
  try {
    const { value } = await mammoth.extractRawText({ buffer: Buffer.from(bytes) })
    return value
  } catch (error) {
    throw new UnreadableFileError("Couldn't read this DOCX. It may be corrupt.", { cause: error })
  }
}

/**
 * PDF and DOCX extraction leave text the AI shouldn't have to cope with: broken
 * ligatures, non-breaking and zero-width spaces, ragged runs of blank lines.
 * Fold it to plain, evenly-spaced UTF-8 so the prompt sees the resume, not the
 * export artifacts. Special characters are written as \u escapes so nothing in
 * this source is invisible.
 */
export function normalizeWhitespace(raw: string): string {
  return raw
    .normalize('NFKC') // fold ligatures and other compatibility forms
    .replace(/\r\n?/g, '\n') // CRLF / CR -> LF
    .replace(/[   ]/g, ' ') // non-breaking spaces -> space
    .replace(/[​-‍﻿]/g, '') // zero-width chars and BOM -> gone
    .replace(/[ \t]+/g, ' ') // collapse runs of spaces and tabs
    .replace(/ *\n */g, '\n') // strip spaces hugging line breaks
    .replace(/\n{3,}/g, '\n\n') // cap blank-line runs at one
    .trim()
}

function countNonWhitespace(text: string): number {
  return text.replace(/\s/g, '').length
}
